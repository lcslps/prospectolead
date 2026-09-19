import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError, notFound } from '../utils/apiError';
import { generateJson, requireGemini, siteCreateGenerationSchema, siteEditGenerationSchema } from './GeminiService';
import { normalizeBusiness } from './BusinessNormalizer';
import { artefactSchema, siteCreateSchema, siteEditSchema, storedSiteSchema, type ArtefactFiles, type StoredSite } from './siteArtefactSchema';
import { buildCreatePrompt, buildEditPrompt, buildRegeneratePrompt } from './SitePrompt';
import { sanitizeFiles, artefactSize } from './SiteSanitizer';
import { collectPlacePhotos, resolveSiteImages } from './SiteImages';

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

  private async createStoredSite(business: StoredSite['business'], opts: { notes?: string | null; baseUrl?: string }, creativeDirection?: string) {
    const assets = await collectPlacePhotos(business, opts.baseUrl);
    const prompt = creativeDirection
      ? buildRegeneratePrompt({ business, instruction: creativeDirection, assets })
      : buildCreatePrompt({ business, assets, notes: opts.notes || undefined });
    const raw = await generateJson(prompt, siteCreateGenerationSchema);
    const parsed = siteCreateSchema.parse(raw);
    const resolved = await resolveSiteImages(parsed.files, business, assets, parsed.imageIntents ?? []);
    const sanitized = sanitizeFiles(resolved.files);
    const files = ensureTitle(sanitized.files, parsed.seo.title, business.name);
    const artefact = artefactSchema.parse({ format: 'html-standalone', files, seo: parsed.seo });
    const stored = storedSiteSchema.parse({
      schemaVersion: 2,
      business,
      artefact,
      imageMap: resolved.imageMap,
      assets: resolved.assets,
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
    requireGemini();
    const crm = await prisma.crmLead.findUnique({ where: { id: crmLeadId }, include: { lead: true } });
    if (!crm) throw notFound('Adicione o estabelecimento ao CRM antes de gerar um site.');
    const business = normalizeBusiness(crm.lead);
    const site = await prisma.website.upsert({ where: { crmLeadId }, create: { crmLeadId, name: business.name, business: asJson(business), theme: asJson({}), seo: asJson(emptySeo), schemaVersion: 2 }, update: {} });
    if (site.generationStatus === 'completed' && !legacyStored(site.currentDocument)) return this.get(site.id);
    const lock = await prisma.website.updateMany({ where: { id: site.id, OR: [{ generationStatus: { in: ['pending', 'failed'] } }, { generationStatus: 'generating', updatedAt: { lt: new Date(Date.now() - 150000) } }] }, data: { generationStatus: 'generating', generationError: null } });
    if (!lock.count) throw new AppError(409, 'Este site já está sendo gerado. Aguarde alguns instantes.');
    try {
      const stored = await this.createStoredSite(business, { notes: crm.notes, baseUrl });
      await this.commit({ site, crmLeadId, stored, source: 'ai_generation' });
      return this.get(site.id);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'erro desconhecido';
      console.error('[Website generation]', { websiteId: site.id, crmLeadId, detail });
      const message = error instanceof AppError ? error.message : `O site gerado não passou na validação: ${detail}`;
      await prisma.website.update({ where: { id: site.id }, data: { generationStatus: 'failed', generationError: message } });
      throw new AppError(502, message);
    }
  }

  async regenerate(id: string, instruction: string | undefined, baseUrl?: string) {
    requireGemini();
    const site = await prisma.website.findUnique({ where: { id }, include: { crmLead: { include: { lead: true } } } });
    if (!site) throw notFound('Site não encontrado');
    const business = normalizeBusiness(site.crmLead.lead);
    const lock = await prisma.website.updateMany({ where: { id, generationStatus: { not: 'generating' } }, data: { generationStatus: 'generating', generationError: null } });
    if (!lock.count) throw new AppError(409, 'Este site já está sendo gerado. Aguarde alguns instantes.');
    try {
      const stored = await this.createStoredSite(business, { notes: site.crmLead.notes, baseUrl }, instruction);
      await this.commit({ site, crmLeadId: site.crmLeadId, stored, source: 'ai_generation', instruction });
      return this.get(id);
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
    const prompt = buildEditPrompt({ business: current.business, instruction, files: filesToSend });
    const raw = await generateJson(prompt, siteEditGenerationSchema);
    const edit = siteEditSchema.parse(raw);
    const merged = {
      'index.html': edit.files['index.html'] ?? current.artefact.files['index.html'],
      'styles.css': edit.files['styles.css'] ?? current.artefact.files['styles.css'],
      'script.js': edit.files['script.js'] ?? current.artefact.files['script.js'],
    };
    const seo = edit.seo ?? current.artefact.seo;
    const sanitized = sanitizeFiles(merged);
    const files = ensureTitle(sanitized.files, seo.title, current.business.name);
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