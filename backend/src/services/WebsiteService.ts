import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, notFound } from '../utils/apiError';
import { generateJson, generateAuxJson, requireGemini, siteCreateGenerationSchema, siteEditGenerationSchema, siteRepairGenerationSchema, type RetryEvent } from './GeminiService';
import { normalizeBusiness } from './BusinessNormalizer';
import { artefactSchema, siteCreateSchema, siteEditSchema, storedSiteSchema, type ArtefactFiles, type DesignPlan, type StoredSite } from './siteArtefactSchema';
import { buildCreatePrompt, buildEditPrompt, buildRegeneratePrompt, buildRepairPrompt, SYSTEM_INSTRUCTION } from './SitePrompt';
import { sanitizeFiles, artefactSize } from './SiteSanitizer';
import { collectLeadImages, collectImageBytes, resolveSiteImages, type LeadImageCollection } from './SiteImages';
import { inspectArtifact, criticalIssues, type QualityIssue } from './SiteQuality';
import { generationQueue, type GenerationJob } from './GenerationQueue';
import { env } from '../config/env';

const asJson = (value: unknown) => value as Prisma.InputJsonValue;
const emptySeo = { title: '', description: '', keywords: '' };
const legacyStored = (value: unknown): boolean => Boolean(value && typeof value === 'object' && (value as Record<string, unknown>).schemaVersion !== 2);

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ensureTitle(files: ArtefactFiles, seoTitle: string, fallbackName: string): ArtefactFiles {
  const title = `<title>${escapeHtml(seoTitle || fallbackName)}</title>`;
  const html = files['index.html'].replace(/<title>[\s\S]*?<\/title>/i, title);
  if (html === files['index.html'] && !/<title>/i.test(html)) {
    return { ...files, 'index.html': html.replace(/<\/head>/i, () => `${title}\n</head>`) };
  }
  return { ...files, 'index.html': html };
}

export class WebsiteService {
  private deferredAttempts = new Map<string, number>();

  private transientGenerationError(error: unknown): boolean {
    if (!(error instanceof AppError)) return false;
    return /sobrecarregado|limite de uso|não foi possível conectar/i.test(error.message);
  }

  private deferGeneration(siteId: string, crmLeadId: string, baseUrl?: string): boolean {
    const attempts = (this.deferredAttempts.get(siteId) ?? 0) + 1;
    if (attempts > env.MAX_DEFERRED_GENERATION_RETRIES) return false;
    this.deferredAttempts.set(siteId, attempts);
    setTimeout(() => {
      void this.enqueueGenerate(crmLeadId, { baseUrl, resume: true }).catch(error => {
        console.error('[Website deferred generation]', { websiteId: siteId, attempt: attempts, detail: error instanceof Error ? error.message : 'erro desconhecido' });
      });
    }, env.GEMINI_OVERLOAD_RETRY_MS);
    return true;
  }
  async list() {
    return prisma.website.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, name: true, status: true, generationStatus: true,
        generationError: true, updatedAt: true, publishedAt: true,
        business: true, seo: true,
        crmLead: { select: { id: true, lead: { select: { id: true, nome: true, categoria: true, cidade: true, estado: true } } } },
      },
    });
  }

  async get(id: string) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site não encontrado');
    const { published: _published, ...draft } = site;
    if (site.schemaVersion !== 2) {
      (draft as Record<string, unknown>).legacy = true;
    }
    return draft;
  }

  async byLead(leadId: string) {
    const site = await prisma.website.findUnique({ where: { crmLeadId: leadId }, select: { id: true, generationStatus: true, generationError: true, status: true, schemaVersion: true } });
    if (!site) return null;
    if (site.schemaVersion !== 2) return null;
    return site;
  }

  private async generateArtifact(business: StoredSite['business'], input: LeadImageCollection, opts: { notes?: string | null }, creativeDirection?: string, previousPlan?: DesignPlan, onRetry?: (event: RetryEvent) => void) {
    const { assets, profiles, summary, reviews } = input;
    const prompt = creativeDirection
      ? buildRegeneratePrompt({ business, instruction: creativeDirection, assets, profiles, summary, reviews, previousPlan })
      : buildCreatePrompt({ business, assets, profiles, notes: opts.notes || undefined, summary, reviews });
    const vision = env.GEMINI_SEND_IMAGES ? await collectImageBytes(assets, business) : [];
    const raw = await generateJson(prompt, siteCreateGenerationSchema, SYSTEM_INSTRUCTION, vision, { onRetry });
    const parsed = siteCreateSchema.parse(raw);
    const resolved = await resolveSiteImages(parsed.files, business, assets, parsed.imageIntents ?? []);
    return { parsed, resolved };
  }

  private async settleFiles(files: ArtefactFiles, business: StoredSite['business'], seoTitle: string, onRetry?: (event: RetryEvent) => void): Promise<ArtefactFiles> {
    const prepare = (input: ArtefactFiles) => {
      const sanitized = sanitizeFiles(input).files;
      return ensureTitle(sanitized, seoTitle || '', business.name);
    };
    let current = prepare(files);
    for (let attempt = 0; attempt <= env.MAX_SITE_REFINEMENT_ITERATIONS; attempt += 1) {
      const critical = criticalIssues(inspectArtifact(current));
      if (!critical.length) return current;
      if (attempt === env.MAX_SITE_REFINEMENT_ITERATIONS) {
        throw new AppError(502, `O site não passou na validação estrutural após ${attempt} revisão(ões): ${critical.map(issue => issue.message).join(' ')}`);
      }
      const repair = await generateAuxJson(
        buildRepairPrompt({ business, files: current, issues: critical as QualityIssue[] }),
        siteRepairGenerationSchema,
        { onRetry },
      );
      const patch = siteEditSchema.parse(repair);
      current = prepare({
        'index.html': patch.files['index.html'] ?? current['index.html'],
        'styles.css': patch.files['styles.css'] ?? current['styles.css'],
        'script.js': patch.files['script.js'] ?? current['script.js'],
      });
    }
    return current;
  }

  private async createStoredSite(business: StoredSite['business'], opts: { notes?: string | null; baseUrl?: string }, creativeDirection?: string, previousPlan?: DesignPlan, onRetry?: (event: RetryEvent) => void) {
    const input = await collectLeadImages(business, opts.baseUrl);
    const { parsed, resolved } = await this.generateArtifact(business, input, { notes: opts.notes }, creativeDirection, previousPlan, onRetry);
    const files = await this.settleFiles(resolved.files, business, parsed.seo.title, onRetry);
    const artefact = artefactSchema.parse({ format: 'html-standalone', files, seo: parsed.seo });
    const stored = storedSiteSchema.parse({
      schemaVersion: 2,
      business,
      artefact,
      imageMap: resolved.imageMap,
      assets: resolved.assets,
      designPlan: parsed.designPlan,
      meta: { source: 'ai_generation', instruction: creativeDirection || '', sizeBytes: artefactSize(files) },
    });
    return stored;
  }

  private async commit({ site, crmLeadId, stored, source, instruction }: {
    site: { id: string; revision: number };
    crmLeadId?: string;
    stored: StoredSite;
    source: 'ai_generation' | 'ai_edit' | 'restore';
    instruction?: string;
  }) {
    const meta = { ...stored.meta, source, instruction: instruction || stored.meta.instruction || '', sizeBytes: stored.meta.sizeBytes };
    const doc = { ...stored, meta };
    await prisma.$transaction(async tx => {
      const nextRevision = site.revision + 1;
      await tx.website.update({
        where: { id: site.id },
        data: {
          name: doc.business.name,
          business: asJson(doc.business),
          seo: asJson(doc.artefact.seo),
          schemaVersion: 2,
          currentDocument: asJson(doc),
          generationStatus: 'completed',
          generationError: null,
          revision: nextRevision,
        },
      });
      await tx.websiteSection.deleteMany({ where: { websiteId: site.id } });
      await tx.websiteVersion.create({ data: { websiteId: site.id, version: nextRevision, document: asJson(doc), source } });
      if (crmLeadId && source === 'ai_generation') {
        const changed = await tx.crmLead.updateMany({ where: { id: crmLeadId, stage: 'NEW' }, data: { stage: 'SITE_GENERATED' } });
        if (changed.count) await tx.crmActivity.create({ data: { crmLeadId, type: 'STAGE_CHANGED', description: 'Site gerado com IA. Lead movido para Site gerado.' } });
      }
    });
  }

  async generate(crmLeadId: string, baseUrl?: string) {
    await this.enqueueGenerate(crmLeadId, { baseUrl });
    const site = await prisma.website.findUnique({ where: { crmLeadId } });
    if (!site) throw notFound('Site não encontrado');
    return this.get(site.id);
  }

  async enqueueGenerate(crmLeadId: string, opts: { baseUrl?: string; resume?: boolean } = {}) {
    requireGemini();
    const crm = await prisma.crmLead.findUnique({ where: { id: crmLeadId }, include: { lead: true } });
    if (!crm) throw notFound('Adicione o estabelecimento ao CRM antes de gerar um site.');
    const business = normalizeBusiness(crm.lead);
    const site = await prisma.website.upsert({ where: { crmLeadId }, create: { crmLeadId, name: business.name, business: asJson(business), theme: asJson({}), seo: asJson(emptySeo), schemaVersion: 2 }, update: {} });
    if (site.generationStatus === 'completed' && !legacyStored(site.currentDocument)) return;
    await prisma.website.update({ where: { id: site.id }, data: { generationStatus: 'pending', generationError: null } });
    const job = this.makeJob(site.id, crmLeadId, 'generate', () => this.processGenerate(site.id, crmLeadId, opts.baseUrl, job));
    void generationQueue.enqueue(job);
    await job.promise;
    if (job.state === 'failed') throw new AppError(502, job.error || 'Falha na geração do site.');
  }

  private makeJob(siteId: string, crmLeadId: string, kind: GenerationJob['kind'], run: () => Promise<void>): GenerationJob {
    let resolveJob: (value: void) => void = () => {};
    const promise = new Promise<void>(resolve => { resolveJob = resolve; });
    const job: GenerationJob = {
      siteId, crmLeadId, kind, state: 'pending', attempts: 0,
      queuedAt: Date.now(),
      run,
      resolve: resolveJob,
      promise,
    };
    return job;
  }

  private async processGenerate(siteId: string, crmLeadId: string, baseUrl: string | undefined, job: GenerationJob) {
    const site = await prisma.website.findUnique({ where: { id: siteId } });
    if (!site) throw notFound('Site não encontrado');
    const lock = await prisma.website.updateMany({ where: { id: site.id, OR: [{ generationStatus: { in: ['pending', 'failed'] } }, { generationStatus: 'generating', updatedAt: { lt: new Date(Date.now() - 150000) } }] }, data: { generationStatus: 'generating', generationError: null } });
    if (!lock.count) return;
    const onRetry = () => generationQueue.setRetrying(job);
    try {
      const crm = await prisma.crmLead.findUnique({ where: { id: crmLeadId }, include: { lead: true } });
      if (!crm) throw notFound('Lead do CRM não encontrado.');
      const business = normalizeBusiness(crm.lead);
      const stored = await this.createStoredSite(business, { notes: crm.notes, baseUrl }, undefined, undefined, onRetry);
      await this.commit({ site, crmLeadId, stored, source: 'ai_generation' });
      this.deferredAttempts.delete(site.id);
    } catch (error) {
      if (this.transientGenerationError(error) && this.deferGeneration(site.id, crmLeadId, baseUrl)) {
        await prisma.website.update({ where: { id: site.id }, data: { generationStatus: 'pending', generationError: 'Gemini temporariamente indisponível. Nova tentativa automática agendada.' } });
        return;
      }
      const detail = error instanceof Error ? error.message : 'erro desconhecido';
      console.error('[Website generation]', { websiteId: site.id, crmLeadId, detail });
      const message = error instanceof AppError ? error.message : `O site gerado não passou na validação: ${detail}`;
      await prisma.website.update({ where: { id: site.id }, data: { generationStatus: 'failed', generationError: message } });
      throw new AppError(502, message);
    }
  }

  async regenerate(id: string, instruction: string | undefined, baseUrl?: string) {
    await this.enqueueRegenerate(id, instruction, baseUrl);
    return this.get(id);
  }

  async enqueueRegenerate(id: string, instruction: string | undefined, baseUrl?: string) {
    requireGemini();
    const site = await prisma.website.findUnique({ where: { id }, include: { crmLead: { include: { lead: true } } } });
    if (!site) throw notFound('Site não encontrado');
    if (site.generationStatus === 'generating' && Date.now() - new Date(site.updatedAt).getTime() < 150000) {
      throw new AppError(409, 'Este site já está sendo gerado. Aguarde alguns instantes.');
    }
    await prisma.website.update({ where: { id }, data: { generationStatus: 'pending', generationError: null } });
    const job = this.makeJob(id, site.crmLeadId ?? '', 'regenerate', () => this.processRegenerate(id, instruction, baseUrl, job));
    void generationQueue.enqueue(job);
    await job.promise;
    if (job.state === 'failed') throw new AppError(502, job.error || 'Falha na regeneração do site.');
  }

  private async processRegenerate(id: string, instruction: string | undefined, baseUrl: string | undefined, job: GenerationJob) {
    const site = await prisma.website.findUnique({ where: { id }, include: { crmLead: { include: { lead: true } } } });
    if (!site) throw notFound('Site não encontrado');
    const lock = await prisma.website.updateMany({ where: { id, generationStatus: { not: 'generating' } }, data: { generationStatus: 'generating', generationError: null } });
    if (!lock.count) return;
    const onRetry = () => generationQueue.setRetrying(job);
    try {
      const business = normalizeBusiness(site.crmLead.lead);
      let previousPlan: DesignPlan | undefined;
      try {
        previousPlan = storedSiteSchema.parse(site.currentDocument).designPlan;
      } catch { /* site sem documento anterior */ }
      const stored = await this.createStoredSite(business, { notes: site.crmLead.notes, baseUrl }, instruction, previousPlan, onRetry);
      await this.commit({ site, crmLeadId: site.crmLeadId, stored, source: 'ai_generation', instruction });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'erro desconhecido';
      console.error('[Website regenerate]', { websiteId: id, detail });
      const message = error instanceof AppError ? error.message : `A regeneração não passou na validação: ${detail}`;
      await prisma.website.update({ where: { id }, data: { generationStatus: 'failed', generationError: message } });
      throw new AppError(502, message);
    }
  }

  async rewrite(id: string, instruction: string) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site não encontrado');
    if (site.generationStatus !== 'completed' || legacyStored(site.currentDocument)) throw new AppError(400, 'Gere o site antes de pedir alterações.');
    const current = storedSiteSchema.parse(site.currentDocument);
    const editScript = /(script|anima|menu mobile|intera|carr|slider|efeito|carreg|estilo)/i.test(instruction);
    const filesToSend: Partial<Record<'index.html' | 'styles.css' | 'script.js', string>> = {
      'index.html': current.artefact.files['index.html'],
      'styles.css': current.artefact.files['styles.css'],
    };
    if (editScript) filesToSend['script.js'] = current.artefact.files['script.js'];
    const prompt = buildEditPrompt({ business: current.business, instruction, files: filesToSend, designPlan: current.designPlan });
    const raw = await generateJson(prompt, siteEditGenerationSchema);
    const edit = siteEditSchema.parse(raw);
    const merged = {
      'index.html': edit.files['index.html'] ?? current.artefact.files['index.html'],
      'styles.css': edit.files['styles.css'] ?? current.artefact.files['styles.css'],
      'script.js': edit.files['script.js'] ?? current.artefact.files['script.js'],
    };
    const seo = edit.seo ?? current.artefact.seo;
    const files = await this.settleFiles(merged, current.business, seo.title);
    const artefact = artefactSchema.parse({ format: 'html-standalone', files, seo });
    const stored = storedSiteSchema.parse({
      ...current,
      artefact,
      meta: { source: 'ai_edit', instruction, sizeBytes: artefactSize(files) },
    });
    await this.commit({ site, crmLeadId: site.crmLeadId, stored, source: 'ai_edit', instruction });
    return this.get(id);
  }

  async publish(id: string) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site não encontrado');
    if (site.generationStatus !== 'completed' || legacyStored(site.currentDocument)) throw new AppError(400, 'Gere o site antes de publicar.');
    const stored = storedSiteSchema.parse(site.currentDocument);
    await prisma.website.update({ where: { id }, data: { status: 'PUBLISHED', published: asJson(stored), publishedAt: new Date(), publishedVersion: site.revision } });
    return this.get(id);
  }

  async unpublish(id: string) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site não encontrado');
    await prisma.website.update({ where: { id }, data: { status: 'DRAFT', published: Prisma.DbNull, publishedAt: null, publishedVersion: null } });
    return this.get(id);
  }

  async versions(id: string) {
    const site = await prisma.website.findUnique({ where: { id }, select: { revision: true, publishedVersion: true } });
    if (!site) throw notFound('Site não encontrado');
    const rows = await prisma.websiteVersion.findMany({ where: { websiteId: id }, orderBy: { version: 'desc' } });
    return rows.map(version => {
      let sizeBytes = 0;
      let title = '';
      try {
        const doc = storedSiteSchema.parse(version.document);
        sizeBytes = doc.meta.sizeBytes ?? 0;
        title = doc.artefact.seo.title;
      } catch { /* keep zeros for legacy entries */ }
      return {
        version: version.version,
        source: version.source,
        createdAt: version.createdAt,
        sizeBytes,
        title,
        isCurrent: version.version === site.revision,
        isPublished: version.version === site.publishedVersion,
      };
    });
  }

  async restore(id: string, version: number) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site não encontrado');
    const row = await prisma.websiteVersion.findUnique({ where: { websiteId_version: { websiteId: id, version } } });
    if (!row) throw notFound('Versão não encontrada');
    const stored = storedSiteSchema.parse(row.document);
    await this.commit({ site, stored, source: 'restore' });
    return this.get(id);
  }

  async publicSite(id: string) {
    const site = await prisma.website.findUnique({ where: { id }, select: { status: true, published: true } });
    if (site?.status !== 'PUBLISHED' || !site.published || legacyStored(site.published)) throw notFound('Site não publicado');
    return site.published;
  }

  async remove(id: string) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site não encontrado');
    await prisma.website.delete({ where: { id } });
  }
}
export const websiteService = new WebsiteService();
