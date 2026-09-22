import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, notFound } from '../utils/apiError';
import { generateJson, generateAuxJson, requireGemini, siteCreateGenerationSchema, siteEditGenerationSchema, siteRepairGenerationSchema, type RetryEvent } from './GeminiService';
import { normalizeBusiness } from './BusinessNormalizer';
import { artefactSchema, siteCreateSchema, siteEditSchema, storedSiteSchema, type ArtefactFiles, type DesignPlan, type StoredSite } from './siteArtefactSchema';
import { buildCreatePrompt, buildEditPrompt, buildRegeneratePrompt, buildRepairPrompt, SYSTEM_INSTRUCTION } from './SitePrompt';
import { sanitizeFiles, artefactSize } from './SiteSanitizer';
import { collectLeadImages, collectImageBytes, resolveSiteImages, type LeadImageCollection } from './SiteImages';
import { auditArtifact, type QualityAudit, type QualityIssue } from './SiteQuality';
import { WEBSITE_PROMPT_VERSION, analyzeBusinessForWebsite, buildAssetManifest, buildWebsiteGenerationContext, createCreativeBrief } from './WebsiteStrategy';
import { generationQueue, type GenerationJob } from './GenerationQueue';
import { env } from '../config/env';
import { compactGenerationContext } from './GenerationContext';

const asJson = (value: unknown) => value as Prisma.InputJsonValue;
const emptySeo = { title: '', description: '', keywords: '' };
const legacyStored = (value: unknown): boolean => Boolean(value && typeof value === 'object' && (value as Record<string, unknown>).schemaVersion !== 2);
type SiteTemplate = 'simple' | 'animated';
const templateOf = (theme: unknown): SiteTemplate => (theme && typeof theme === 'object' && (theme as Record<string, unknown>).template === 'animated' ? 'animated' : 'simple');
const STALE_GENERATION_MS = Math.max(150_000, env.GEMINI_REQUEST_TIMEOUT_MS + 60_000);

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
  private async recoverStaleGeneration(site: { id: string; generationStatus: string; updatedAt: Date }): Promise<void> {
    if (site.generationStatus !== 'generating') return;
    const cutoff = new Date(Date.now() - STALE_GENERATION_MS);
    if (site.updatedAt >= cutoff) return;
    const recovered = await prisma.website.updateMany({
      where: { id: site.id, generationStatus: 'generating', updatedAt: { lt: cutoff } },
      data: {
        generationStatus: 'failed',
        generationStage: 'FAILED',
        generationNextAttemptAt: null,
        generationError: 'A geração foi interrompida antes de receber resposta do Gemini. Clique em “Gerar novamente” para retomar.',
        generationMetrics: asJson({ model: env.GEMINI_MODEL, status: 'orphaned', recoveredAt: new Date().toISOString() }),
      },
    });
    if (recovered.count) console.warn('[Website generation recovered]', { websiteId: site.id });
  }

  private startGenerationHeartbeat(siteId: string, getStage: () => string): () => void {
    const timer = setInterval(() => {
      void prisma.website.updateMany({
        where: { id: siteId, generationStatus: 'generating' },
        data: { generationStage: getStage() },
      }).catch(error => console.warn('[Website generation heartbeat]', { websiteId: siteId, detail: error instanceof Error ? error.message : 'erro desconhecido' }));
    }, 20_000);
    return () => clearInterval(timer);
  }

  private transientGenerationError(error: unknown): boolean {
    if (!(error instanceof AppError)) return false;
    return /sobrecarregado|limite de uso|nÃ£o foi possÃ­vel conectar/i.test(error.message);
  }

  private async deferGeneration(site: { id: string; generationRetries: number }, crmLeadId: string, baseUrl?: string): Promise<boolean> {
    const attempts = site.generationRetries + 1;
    if (attempts > env.MAX_DEFERRED_GENERATION_RETRIES) return false;
    const retryAt = new Date(Date.now() + env.GEMINI_OVERLOAD_RETRY_MS);
    await prisma.website.update({
      where: { id: site.id },
      data: {
        generationStatus: 'pending', generationStage: 'RETRY_WAIT', generationRetries: attempts,
        generationNextAttemptAt: retryAt,
        generationError: 'Gemini temporariamente indisponÃ­vel. Nova tentativa automÃ¡tica agendada.',
        generationMetrics: asJson({ model: env.GEMINI_MODEL, status: 'retry_wait', retries: attempts, nextAttemptAt: retryAt.toISOString() }),
      },
    });
    setTimeout(() => {
      void this.enqueueGenerate(crmLeadId, { baseUrl, resume: true, wait: false }).catch(error => {
        console.error('[Website deferred generation]', { websiteId: site.id, attempt: attempts, detail: error instanceof Error ? error.message : 'erro desconhecido' });
      });
    }, env.GEMINI_OVERLOAD_RETRY_MS);
    return true;
  }
  async list() {
    return prisma.website.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, name: true, status: true, generationStatus: true, generationStage: true, generationRetries: true, generationNextAttemptAt: true,
        generationError: true, updatedAt: true, publishedAt: true,
        business: true, seo: true,
        crmLead: { select: { id: true, lead: { select: { id: true, nome: true, categoria: true, cidade: true, estado: true } } } },
      },
    });
  }

  async get(id: string) {
    let site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site nÃ£o encontrado');
    await this.recoverStaleGeneration(site);
    site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site nÃ£o encontrado');
    const { published: _published, ...draft } = site;
    if (site.schemaVersion !== 2) {
      (draft as Record<string, unknown>).legacy = true;
    }
    return draft;
  }

  async byLead(leadId: string) {
    let website = await prisma.website.findUnique({ where: { crmLeadId: leadId }, select: { id: true, generationStatus: true, generationStage: true, generationRetries: true, generationNextAttemptAt: true, generationError: true, status: true, schemaVersion: true, updatedAt: true } });
    if (!website) return null;
    await this.recoverStaleGeneration(website);
    website = await prisma.website.findUnique({ where: { crmLeadId: leadId }, select: { id: true, generationStatus: true, generationStage: true, generationRetries: true, generationNextAttemptAt: true, generationError: true, status: true, schemaVersion: true, updatedAt: true } });
    if (!website) return null;
    if (website.schemaVersion !== 2) return null;
    return website;
  }

  private async generateArtifact(business: StoredSite['business'], input: LeadImageCollection, opts: { notes?: string | null }, creativeDirection?: string, previousPlan?: DesignPlan, onRetry?: (event: RetryEvent) => void) {
    const { assets, profiles, summary, reviews } = input;
    const context = buildWebsiteGenerationContext(business, input, opts.notes);
    const analysis = analyzeBusinessForWebsite(context);
    const brief = createCreativeBrief(context, analysis);
    const manifest = buildAssetManifest(context);
    const compact = compactGenerationContext({ business, assets, summary, reviews, notes: opts.notes });
    const prompt = creativeDirection
      ? buildRegeneratePrompt({ business: compact.business, instruction: creativeDirection, assets: compact.assets, profiles, summary: compact.summary, reviews: compact.reviews, previousPlan, analysis, brief, manifest })
      : buildCreatePrompt({ business: compact.business, assets: compact.assets, profiles, notes: compact.notes, summary: compact.summary, reviews: compact.reviews, analysis, brief, manifest });
    const visionAssets = compact.assets.filter(asset => asset.isBusinessAsset || asset.sourceType === 'business' || asset.sourceType === 'social').slice(0, 3);
    const vision = env.GEMINI_SEND_IMAGES ? await collectImageBytes(visionAssets, business) : [];
    const raw = await generateJson(prompt, siteCreateGenerationSchema, SYSTEM_INSTRUCTION, vision, { onRetry });
    const parsed = siteCreateSchema.parse(raw);
    const resolved = await resolveSiteImages(parsed.files, business, assets, parsed.imageIntents ?? []);
    return { parsed, resolved, analysis, brief, manifest, metrics: { promptVersion: WEBSITE_PROMPT_VERSION, inputContextChars: compact.estimatedChars, selectedAssets: compact.assets.length, realAssets: manifest.realAssetCount, visionImages: vision.length } };
  }

  private async settleFiles(files: ArtefactFiles, business: StoredSite['business'], seoTitle: string, onRetry?: (event: RetryEvent) => void): Promise<{ files: ArtefactFiles; audit: QualityAudit; repairPasses: number }> {
    const prepare = (input: ArtefactFiles) => {
      const sanitized = sanitizeFiles(input).files;
      return ensureTitle(sanitized, seoTitle || '', business.name);
    };
    let current = prepare(files);
    for (let attempt = 0; attempt <= env.MAX_SITE_REFINEMENT_ITERATIONS; attempt += 1) {
      const audit = auditArtifact(current);
      if (!audit.needsRepair) return { files: current, audit, repairPasses: attempt };
      if (attempt === env.MAX_SITE_REFINEMENT_ITERATIONS) {
        if (audit.issues.some(issue => issue.severity === 'critical')) {
          throw new AppError(502, `O site não passou na validação estrutural após ${attempt} revisão(ões): ${audit.issues.filter(issue => issue.severity === 'critical').map(issue => issue.message).join(' ')}`);
        }
        return { files: current, audit, repairPasses: attempt };
      }
      const repair = await generateAuxJson(
        buildRepairPrompt({ business, files: current, issues: audit.issues as QualityIssue[] }),
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
    return { files: current, audit: auditArtifact(current), repairPasses: env.MAX_SITE_REFINEMENT_ITERATIONS };
  }

  private async createStoredSite(business: StoredSite['business'], opts: { notes?: string | null; baseUrl?: string }, creativeDirection?: string, previousPlan?: DesignPlan, onRetry?: (event: RetryEvent) => void, onStage?: (stage: 'SITE_GENERATION') => Promise<void>) {
    const input = await collectLeadImages(business, opts.baseUrl);
    await onStage?.('SITE_GENERATION');
    const { parsed, resolved, analysis, brief, manifest, metrics } = await this.generateArtifact(business, input, { notes: opts.notes }, creativeDirection, previousPlan, onRetry);
    const settled = await this.settleFiles(resolved.files, business, parsed.seo.title, onRetry);
    const files = settled.files;
    const artefact = artefactSchema.parse({ format: 'html-standalone', files, seo: parsed.seo });
    const stored = storedSiteSchema.parse({
      schemaVersion: 2,
      business,
      artefact,
      imageMap: resolved.imageMap,
      assets: resolved.assets,
      designPlan: parsed.designPlan,
      generation: { promptVersion: WEBSITE_PROMPT_VERSION, businessAnalysis: analysis, creativeBrief: brief, assetManifest: manifest, qualityScore: settled.audit.score, auditIssues: settled.audit.issues },
      meta: { source: 'ai_generation', instruction: creativeDirection || '', sizeBytes: artefactSize(files) },
    });
    if (env.NODE_ENV !== 'production') {
      console.info('[Website generation audit]', {
        promptVersion: WEBSITE_PROMPT_VERSION,
        business: business.name,
        category: business.category,
        realAssets: manifest.realAssetCount,
        totalAssets: resolved.assets.length,
        qualityScore: settled.audit.score,
        repairPasses: settled.repairPasses,
        issues: settled.audit.issues.map(issue => issue.code),
      });
    }
    return { stored, metrics: { ...metrics, qualityScore: settled.audit.score, auditIssues: settled.audit.issues.length, repairPasses: settled.repairPasses } };
  }

  private async commit({ site, crmLeadId, stored, source, instruction }: {
    site: { id: string; revision: number };
    crmLeadId?: string;
    stored: StoredSite;
    source: 'ai_generation' | 'ai_edit' | 'manual_edit' | 'restore';
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
          generationStatus: 'completed', generationStage: 'READY', generationNextAttemptAt: null,
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

  async generate(crmLeadId: string, baseUrl?: string, template?: SiteTemplate) {
    await this.enqueueGenerate(crmLeadId, { baseUrl, template, wait: false });
    const site = await prisma.website.findUnique({ where: { crmLeadId } });
    if (!site) throw notFound('Site nÃ£o encontrado');
    return this.get(site.id);
  }

  async enqueueGenerate(crmLeadId: string, opts: { baseUrl?: string; resume?: boolean; wait?: boolean; template?: SiteTemplate } = {}) {
    requireGemini();
    const crm = await prisma.crmLead.findUnique({ where: { id: crmLeadId }, include: { lead: true } });
    if (!crm) throw notFound('Adicione o estabelecimento ao CRM antes de gerar um site.');
    const business = normalizeBusiness(crm.lead);
    const site = await prisma.website.upsert({ where: { crmLeadId }, create: { crmLeadId, name: business.name, business: asJson(business), theme: asJson(opts.template ? { template: opts.template } : {}), seo: asJson(emptySeo), schemaVersion: 2 }, update: {} });
    if (site.generationStatus === 'completed' && !legacyStored(site.currentDocument)) return;
    await prisma.website.update({ where: { id: site.id }, data: {
      generationStatus: 'pending', generationStage: opts.resume ? 'PREPARE' : 'PREPARE',
      ...(opts.template ? { theme: asJson({ template: opts.template }) } : {}),
      ...(opts.resume ? {} : { generationRetries: 0, generationStartedAt: new Date() }),
      generationNextAttemptAt: null, generationError: null,
    } });
    const job = this.makeJob(site.id, crmLeadId, 'generate', () => this.processGenerate(site.id, crmLeadId, opts.baseUrl, job));
    void generationQueue.enqueue(job);
    if (opts.wait !== false) await job.promise;
    if (job.state === 'failed') throw new AppError(502, job.error || 'Falha na geraÃ§Ã£o do site.');
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
    if (!site) throw notFound('Site nÃ£o encontrado');
    const lock = await prisma.website.updateMany({ where: { id: site.id, OR: [{ generationStatus: { in: ['pending', 'failed'] } }, { generationStatus: 'generating', updatedAt: { lt: new Date(Date.now() - 150000) } }] }, data: { generationStatus: 'generating', generationStage: 'ASSET_DISCOVERY', generationError: null, generationNextAttemptAt: null } });
    if (!lock.count) return;
    const onRetry = () => generationQueue.setRetrying(job);
    let liveStage = 'ASSET_DISCOVERY';
    const stopHeartbeat = this.startGenerationHeartbeat(site.id, () => liveStage);
    try {
      const crm = await prisma.crmLead.findUnique({ where: { id: crmLeadId }, include: { lead: true } });
      if (!crm) throw notFound('Lead do CRM nÃ£o encontrado.');
      const business = normalizeBusiness(crm.lead);
      const startedAt = Date.now();
      const result = await this.createStoredSite(business, { notes: crm.notes, baseUrl }, undefined, undefined, onRetry, async stage => {
        liveStage = stage;
        await prisma.website.update({ where: { id: site.id }, data: { generationStage: stage } });
      });
      const stored = result.stored;
      await prisma.website.update({ where: { id: site.id }, data: { generationStage: 'VALIDATING' } });
      await this.commit({ site, crmLeadId, stored, source: 'ai_generation' });
      await prisma.website.update({ where: { id: site.id }, data: { generationMetrics: asJson({
        model: env.GEMINI_MODEL, template: templateOf(site.theme), startedAt: new Date(startedAt).toISOString(), completedAt: new Date().toISOString(),
        totalDurationMs: Date.now() - startedAt, retries: job.attempts, ...result.metrics,
      }) } });
    } catch (error) {
      if (this.transientGenerationError(error) && await this.deferGeneration(site, crmLeadId, baseUrl)) {
        return;
      }
      const detail = error instanceof Error ? error.message : 'erro desconhecido';
      console.error('[Website generation]', { websiteId: site.id, crmLeadId, detail });
      const message = error instanceof AppError ? error.message : `O site gerado nÃ£o passou na validaÃ§Ã£o: ${detail}`;
      await prisma.website.update({ where: { id: site.id }, data: { generationStatus: 'failed', generationStage: 'FAILED', generationNextAttemptAt: null, generationError: message, generationMetrics: asJson({
        model: env.GEMINI_MODEL, status: 'failed', completedAt: new Date().toISOString(), retries: job.attempts,
      }) } });
      throw new AppError(502, message);
    } finally {
      stopHeartbeat();
    }
  }

  async regenerate(id: string, instruction: string | undefined, baseUrl?: string) {
    await this.enqueueRegenerate(id, instruction, baseUrl, false);
    return this.get(id);
  }

  async enqueueRegenerate(id: string, instruction: string | undefined, baseUrl?: string, wait = true) {
    requireGemini();
    const site = await prisma.website.findUnique({ where: { id }, include: { crmLead: { include: { lead: true } } } });
    if (!site) throw notFound('Site nÃ£o encontrado');
    if (site.generationStatus === 'generating' && Date.now() - new Date(site.updatedAt).getTime() < 150000) {
      throw new AppError(409, 'Este site jÃ¡ estÃ¡ sendo gerado. Aguarde alguns instantes.');
    }
    await prisma.website.update({ where: { id }, data: { generationStatus: 'pending', generationStage: 'PREPARE', generationRetries: 0, generationStartedAt: new Date(), generationNextAttemptAt: null, generationError: null } });
    const job = this.makeJob(id, site.crmLeadId ?? '', 'regenerate', () => this.processRegenerate(id, instruction, baseUrl, job));
    void generationQueue.enqueue(job);
    if (wait) await job.promise;
    if (job.state === 'failed') throw new AppError(502, job.error || 'Falha na regeneraÃ§Ã£o do site.');
  }

  private async processRegenerate(id: string, instruction: string | undefined, baseUrl: string | undefined, job: GenerationJob) {
    const site = await prisma.website.findUnique({ where: { id }, include: { crmLead: { include: { lead: true } } } });
    if (!site) throw notFound('Site nÃ£o encontrado');
    const lock = await prisma.website.updateMany({ where: { id, generationStatus: { not: 'generating' } }, data: { generationStatus: 'generating', generationStage: 'ASSET_DISCOVERY', generationError: null, generationNextAttemptAt: null } });
    if (!lock.count) return;
    const onRetry = () => generationQueue.setRetrying(job);
    let liveStage = 'ASSET_DISCOVERY';
    const stopHeartbeat = this.startGenerationHeartbeat(site.id, () => liveStage);
    try {
      const business = normalizeBusiness(site.crmLead.lead);
      let previousPlan: DesignPlan | undefined;
      try {
        previousPlan = storedSiteSchema.parse(site.currentDocument).designPlan;
      } catch { /* site sem documento anterior */ }
      const startedAt = Date.now();
      const result = await this.createStoredSite(business, { notes: site.crmLead.notes, baseUrl }, instruction, previousPlan, onRetry, async stage => {
        liveStage = stage;
        await prisma.website.update({ where: { id }, data: { generationStage: stage } });
      });
      const stored = result.stored;
      await prisma.website.update({ where: { id }, data: { generationStage: 'VALIDATING' } });
      await this.commit({ site, crmLeadId: site.crmLeadId, stored, source: 'ai_generation', instruction });
      await prisma.website.update({ where: { id }, data: { generationMetrics: asJson({
        model: env.GEMINI_MODEL, startedAt: new Date(startedAt).toISOString(), completedAt: new Date().toISOString(),
        totalDurationMs: Date.now() - startedAt, retries: job.attempts, ...result.metrics,
      }) } });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'erro desconhecido';
      console.error('[Website regenerate]', { websiteId: id, detail });
      const message = error instanceof AppError ? error.message : `A regeneraÃ§Ã£o nÃ£o passou na validaÃ§Ã£o: ${detail}`;
      await prisma.website.update({ where: { id }, data: { generationStatus: 'failed', generationStage: 'FAILED', generationNextAttemptAt: null, generationError: message, generationMetrics: asJson({
        model: env.GEMINI_MODEL, status: 'failed', completedAt: new Date().toISOString(), retries: job.attempts,
      }) } });
      throw new AppError(502, message);
    } finally {
      stopHeartbeat();
    }
  }

  async rewrite(id: string, instruction: string) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site nÃ£o encontrado');
    if (site.generationStatus !== 'completed' || legacyStored(site.currentDocument)) throw new AppError(400, 'Gere o site antes de pedir alteraÃ§Ãµes.');
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
    const files = (await this.settleFiles(merged, current.business, seo.title)).files;
    const artefact = artefactSchema.parse({ format: 'html-standalone', files, seo });
    const stored = storedSiteSchema.parse({
      ...current,
      artefact,
      meta: { source: 'ai_edit', instruction, sizeBytes: artefactSize(files) },
    });
    await this.commit({ site, crmLeadId: site.crmLeadId, stored, source: 'ai_edit', instruction });
    return this.get(id);
  }

  async saveContent(id: string, files: ArtefactFiles) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site nÃ£o encontrado');
    if (site.generationStatus !== 'completed' || legacyStored(site.currentDocument)) throw new AppError(400, 'Gere o site antes de editar.');
    const current = storedSiteSchema.parse(site.currentDocument);
    const files2 = ensureTitle(sanitizeFiles(files).files, current.artefact.seo.title, current.business.name);
    const artefact = artefactSchema.parse({ format: 'html-standalone', files: files2, seo: current.artefact.seo });
    const stored = storedSiteSchema.parse({
      ...current,
      artefact,
      meta: { source: 'manual_edit', instruction: 'EdiÃ§Ã£o manual no preview', sizeBytes: artefactSize(files2) },
    });
    await this.commit({ site, crmLeadId: site.crmLeadId, stored, source: 'manual_edit' });
    return this.get(id);
  }

  async publish(id: string) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site nÃ£o encontrado');
    if (site.generationStatus !== 'completed' || legacyStored(site.currentDocument)) throw new AppError(400, 'Gere o site antes de publicar.');
    const stored = storedSiteSchema.parse(site.currentDocument);
    await prisma.website.update({ where: { id }, data: { status: 'PUBLISHED', published: asJson(stored), publishedAt: new Date(), publishedVersion: site.revision } });
    return this.get(id);
  }

  async unpublish(id: string) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site nÃ£o encontrado');
    await prisma.website.update({ where: { id }, data: { status: 'DRAFT', published: Prisma.DbNull, publishedAt: null, publishedVersion: null } });
    return this.get(id);
  }

  async versions(id: string) {
    const site = await prisma.website.findUnique({ where: { id }, select: { revision: true, publishedVersion: true } });
    if (!site) throw notFound('Site nÃ£o encontrado');
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
    if (!site) throw notFound('Site nÃ£o encontrado');
    const row = await prisma.websiteVersion.findUnique({ where: { websiteId_version: { websiteId: id, version } } });
    if (!row) throw notFound('VersÃ£o nÃ£o encontrada');
    const stored = storedSiteSchema.parse(row.document);
    await this.commit({ site, stored, source: 'restore' });
    return this.get(id);
  }

  async publicSite(id: string) {
    const site = await prisma.website.findUnique({ where: { id }, select: { status: true, published: true } });
    if (site?.status !== 'PUBLISHED' || !site.published || legacyStored(site.published)) throw notFound('Site nÃ£o publicado');
    return site.published;
  }

  async remove(id: string) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site nÃ£o encontrado');
    await prisma.website.delete({ where: { id } });
  }
}
export const websiteService = new WebsiteService();

