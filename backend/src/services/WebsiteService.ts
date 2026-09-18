import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError, notFound } from '../utils/apiError';
import { generateJson, generationSchema, requireGemini } from './GeminiService';
import { googlePlacesService } from './GooglePlacesService';
import { env } from '../config/env';
import { hasPhotoSearch, searchImages, type UnsplashImage } from './UnsplashService';
import { businessSchema, contentSchema, documentSchema, sectionTypes, seoSchema, settingsSchema, themeSchema, type WebsiteDocument } from './websiteSchema';
import { climaTheme, presetImageQuery, presetPrompt, resolveNiche } from './sitePresets';

const include = { sections: { orderBy: { order: 'asc' as const } } };
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
const generatedSchema = z.object({
  theme: z.object({ primary: hex, accent: hex, background: hex, text: hex, font: z.enum(['sans', 'serif']), radius: z.number().min(0).max(60) }),
  seo: z.object({ title: z.string(), description: z.string(), keywords: z.string() }),
  imageQueries: z.object({ hero: z.string().max(160).default(''), about: z.string().max(160).default(''), gallery: z.string().max(160).default('') }).default({ hero: '', about: '', gallery: '' }),
  sections: z.array(z.object({ type: z.enum(sectionTypes), title: z.string(), subtitle: z.string(), eyebrow: z.string(), text: z.string(), primaryLabel: z.string(), secondaryLabel: z.string(), items: z.array(z.object({ title: z.string(), text: z.string(), price: z.string() })).max(20).default([]) })).min(3).max(16),
});
const emptySeo = { title: '', description: '', keywords: '' };
const asJson = (value: unknown) => value as Prisma.InputJsonValue;

export class WebsiteService {
  async list() {
    return prisma.website.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, name: true, status: true, generationStatus: true,
        generationError: true, updatedAt: true, publishedAt: true,
        crmLead: { select: { id: true, lead: { select: { id: true, nome: true, categoria: true, cidade: true, estado: true } } } },
        _count: { select: { sections: true } },
      },
    });
  }
  async get(id: string) {
    const site = await prisma.website.findUnique({ where: { id }, include });
    if (!site) throw notFound('Site não encontrado');
    const { published: _published, ...draft } = site;
    return draft;
  }
  async byLead(leadId: string) {
    return prisma.website.findUnique({ where: { crmLeadId: leadId }, select: { id: true, generationStatus: true, generationError: true, status: true } });
  }
  async generate(crmLeadId: string) {
    requireGemini();
    const crm = await prisma.crmLead.findUnique({ where: { id: crmLeadId }, include: { lead: true } });
    if (!crm) throw notFound('Adicione o estabelecimento ao CRM antes de gerar um site.');
    const l = crm.lead;
    let digits = (l.telefoneInternacional || l.telefone || '').replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
    const business = businessSchema.parse({ googlePlaceId: l.googlePlaceId, name: l.nome, category: l.categoria || l.nicho || '', city: [l.cidade, l.estado].filter(Boolean).join(' / '), address: l.endereco || '', phone: l.telefone || l.telefoneInternacional || '', whatsapp: digits ? `https://wa.me/${digits}` : '', rating: l.nota == null ? '' : String(l.nota), reviewCount: l.quantidadeAvaliacoes == null ? '' : String(l.quantidadeAvaliacoes), mapUrl: l.googleMapsUrl || '' });
    const site = await prisma.website.upsert({ where: { crmLeadId }, create: { crmLeadId, name: l.nome, business, theme: themeSchema.parse({}), seo: emptySeo }, update: {} });
    if (site.generationStatus === 'completed') return this.get(site.id);
    const lock = await prisma.website.updateMany({ where: { id: site.id, OR: [{ generationStatus: { in: ['pending', 'failed'] } }, { generationStatus: 'generating', updatedAt: { lt: new Date(Date.now() - 150000) } }] }, data: { generationStatus: 'generating', generationError: null } });
    if (!lock.count) throw new AppError(409, 'Este site já está sendo gerado. Aguarde alguns instantes.');
    try {
      const document = await this.generateDocument(business, { ...l, crmNotes: crm.notes });
      await prisma.$transaction(async tx => {
        await tx.websiteSection.deleteMany({ where: { websiteId: site.id } });
        await tx.website.update({ where: { id: site.id }, data: { name: document.name, business: asJson(document.business), theme: asJson(document.theme), seo: asJson(document.seo), generationStatus: 'completed', revision: { increment: 1 }, sections: { create: document.sections.map((s, order) => ({ ...s, order, content: asJson(s.content), settings: asJson(s.settings) })) } } });
        const changed = await tx.crmLead.updateMany({ where: { id: crmLeadId, stage: 'NEW' }, data: { stage: 'SITE_GENERATED' } });
        if (changed.count) await tx.crmActivity.create({ data: { crmLeadId, type: 'STAGE_CHANGED', description: 'Site gerado com IA. Lead movido para Site gerado.' } });
      });
      return this.get(site.id);
    } catch (e) {
      const message = e instanceof AppError ? e.message : 'Não foi possível validar ou salvar o site gerado. Tente novamente.';
      await prisma.website.update({ where: { id: site.id }, data: { generationStatus: 'failed', generationError: message } });
      throw new AppError(502, message);
    }
  }
  async generateDocument(business: WebsiteDocument['business'], facts: unknown): Promise<WebsiteDocument> {
    const factStrings = JSON.stringify(facts);
    const factsRecord = facts && typeof facts === 'object' ? facts as Record<string, unknown> : {};
    const preset = resolveNiche(business.category, typeof factsRecord.nicho === 'string' ? factsRecord.nicho : '', typeof factsRecord.categoria === 'string' ? factsRecord.categoria : '');
    const theme = themeSchema.parse(climaTheme(preset.clima));
    const result = generatedSchema.parse(await generateJson(`Create a complete website in Brazilian Portuguese, including theme, SEO and sections. Use exactly the theme colors and fonts of the mandatory brand climate below; do not pick different colors. Do not invent services, prices, people or testimonials. Return imageQueries.hero, imageQueries.about and imageQueries.gallery as short, precise visual search descriptions based on this business category and verified information. Describe visible subjects and materials, not the business name, street or vague ideas. A granite shop should use granite slabs, marble surfaces or a stone showroom, never generic retail stock, warehouses or unrelated workers. Keep each query specific to the image placement: hero is the strongest business/product visual, about is the real type of workspace or storefront, gallery is products or details. Use English visual keywords for stock image search. Include header, hero and footer. Keep unknown factual content empty. Do not create fake image URLs.

${presetPrompt(preset)}

Data: ${JSON.stringify(facts)}`, generationSchema));
    const sections = result.sections.slice(0, 16).map(s => ({ id: randomUUID(), type: s.type, visible: true, content: contentSchema.parse({ title: s.type === 'header' || s.type === 'footer' ? business.name : s.title, subtitle: s.subtitle, eyebrow: s.eyebrow, text: s.text, items: s.items.filter(item => item.title && [item.title, item.text, item.price].every(value => !value || factStrings.includes(value))), primaryButton: { label: s.primaryLabel, href: business.whatsapp }, secondaryButton: { label: s.secondaryLabel, href: '#contato' } }), settings: settingsSchema.parse(s.type === 'hero' || s.type === 'cta' ? { background: theme.primary, color: '#ffffff' } : s.type === 'header' || s.type === 'footer' ? { padding: 24 } : {}) }));
    const imageQueries = {
      hero: result.imageQueries.hero || presetImageQuery(preset, 'hero'),
      about: result.imageQueries.about || presetImageQuery(preset, 'about'),
      gallery: result.imageQueries.gallery || presetImageQuery(preset, 'gallery'),
    };
    return documentSchema.parse(await this.attachImages(business, { name: business.name, business, theme, seo: seoSchema.parse(result.seo), sections }, imageQueries));
  }
  private async attachImages(business: WebsiteDocument['business'], document: WebsiteDocument, queries: { hero: string; about: string; gallery: string }): Promise<WebsiteDocument> {
    let hero: UnsplashImage | undefined;
    let about: UnsplashImage | undefined;
    let gallery: UnsplashImage[] = [];
    if (business.googlePlaceId && env.NODE_ENV !== 'test') {
      try {
        const place = await googlePlacesService.getPlaceDetails(business.googlePlaceId, ['id', 'photos']);
        const photos = (place.photos ?? []).slice(0, 8).map((photo, index) => ({
          url: `google-place://${encodeURIComponent(business.googlePlaceId!)}/${index}`,
          alt: `Real photo of ${business.name} from Google Maps`,
          credit: photo.authorAttributions?.[0]?.displayName || 'Google Maps',
          creditUrl: photo.authorAttributions?.[0]?.uri || business.mapUrl || `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(business.googlePlaceId!)}`,
          provider: 'Google Maps' as const,
        }));
        hero = photos[0];
        about = photos[1] ?? photos[0];
        gallery = photos.slice(2, 8);
      } catch { /* Optional Maps photos must not block website generation. */ }
    }
    if (!hero && env.NODE_ENV !== 'test' && hasPhotoSearch()) {
      const city = business.city ? ` ${business.city}` : '';
      const title = document.sections.find(section => section.type === 'hero')?.content.title || business.category;
      const heroResults = await searchImages(queries.hero || `${business.category} ${title}${city}`, 6).catch(() => [] as UnsplashImage[]);
      hero = heroResults[0];
      const aboutResults = await searchImages(queries.about || `${business.category} workspace interior storefront${city}`, 6).catch(() => [] as UnsplashImage[]);
      about = aboutResults.find(image => image.url !== hero?.url);
      const galleryResults = await searchImages(queries.gallery || `${business.category} products materials details${city}`, 12).catch(() => [] as UnsplashImage[]);
      gallery = galleryResults.filter(image => image.url !== hero?.url && image.url !== about?.url).slice(0, 8);
    }
    if (!hero && !about && !gallery.length) return document;
    const sections = document.sections.map(section => {
      const altFor = (image: UnsplashImage) => `${business.name}${image.alt ? ` - ${image.alt}` : ''}`.slice(0, 200);
      if (section.type === 'hero' && hero && !section.content.image) return { ...section, content: { ...section.content, image: hero.url, imageAlt: altFor(hero), imageCredit: hero.credit, imageCreditUrl: hero.creditUrl } };
      if (section.type === 'about' && about && !section.content.image) return { ...section, content: { ...section.content, image: about.url, imageAlt: altFor(about), imageCredit: about.credit, imageCreditUrl: about.creditUrl } };
      if (section.type === 'gallery' && gallery.length) {
        let next = 0;
        const items = section.content.items.map(item => {
          if (item.image || !gallery[next]) return item;
          const image = gallery[next++];
          return { ...item, image: image.url, imageAlt: item.imageAlt || altFor(image), imageCredit: image.credit, imageCreditUrl: image.creditUrl };
        });
        for (const image of gallery.slice(next)) items.push({ title: '', text: '', price: '', image: image.url, imageAlt: altFor(image), imageCredit: image.credit, imageCreditUrl: image.creditUrl, href: '' });
        return { ...section, content: { ...section.content, items } };
      }
      return section;
    });
    const hasGallery = sections.some(section => section.type === 'gallery');
    const finalSections = hasGallery || !gallery.length ? sections : this.insertGallery(sections, business, gallery);
    return documentSchema.parse({ ...document, sections: finalSections });
  }  private insertGallery(sections: WebsiteDocument['sections'], business: WebsiteDocument['business'], gallery: UnsplashImage[]) {
    const gallerySection = { id: randomUUID(), type: 'gallery' as const, visible: true, content: contentSchema.parse({ title: 'Galeria de fotos', items: gallery.slice(0, 8).map((img, i) => ({ title: '', text: '', price: '', image: img.url, imageAlt: `Foto ${i + 1} de ${business.name}`, imageCredit: img.credit, imageCreditUrl: img.creditUrl, href: '' })) }), settings: settingsSchema.parse({}) };
    const footerIndex = sections.findIndex(s => s.type === 'footer');
    const at = footerIndex > 2 ? footerIndex : sections.findIndex(s => s.type === 'contact') > 2 ? sections.findIndex(s => s.type === 'contact') : sections.length - 1;
    const inserted = [...sections];
    inserted.splice(at > 0 ? at : sections.length, 0, gallerySection);
    return inserted;
  }
  async save(id: string, revision: number, document: WebsiteDocument, publish = false) {
    await prisma.$transaction(async tx => {
      const changed = await tx.website.updateMany({ where: { id, revision, generationStatus: 'completed' }, data: { name: document.name, business: asJson(document.business), theme: asJson(document.theme), seo: asJson(document.seo), revision: { increment: 1 }, ...(publish ? { status: 'PUBLISHED', published: asJson(document), publishedAt: new Date() } : {}) } });
      if (!changed.count) throw new AppError(409, 'O site foi alterado em outra aba ou ainda está sendo gerado. Recarregue antes de salvar.');
      await tx.websiteSection.deleteMany({ where: { websiteId: id } });
      await tx.websiteSection.createMany({ data: document.sections.map((s, order) => ({ ...s, websiteId: id, order, content: asJson(s.content), settings: asJson(s.settings) })) });
    });
    return this.get(id);
  }
  async publicSite(id: string) {
    const site = await prisma.website.findUnique({ where: { id }, select: { status: true, published: true } });
    if (site?.status !== 'PUBLISHED' || !site.published) throw notFound('Site não publicado');
    return site.published;
  }
  async remove(id: string) {
    const site = await prisma.website.findUnique({ where: { id } });
    if (!site) throw notFound('Site não encontrado');
    await prisma.website.delete({ where: { id } });
  }
  async rewrite(id: string, document: WebsiteDocument, sectionId: string | undefined, field: string, instruction: string) {
    const site = await prisma.website.findUnique({ where: { id }, include: { crmLead: { include: { lead: true } } } });
    if (!site) throw notFound();
    if (field === 'structure') return { document: await this.generateDocument(document.business, site.crmLead.lead) };
    const section = document.sections.find(s => s.id === sectionId);
    if (!section) throw notFound('Seção não encontrada');
    const keys = field === 'section' ? ['eyebrow', 'title', 'subtitle', 'text'] : [field];
    const currentText = Object.fromEntries(['eyebrow', 'title', 'subtitle', 'text'].map(key => [key, section.content[key as keyof typeof section.content]]));
    const schema = { type: 'object', required: keys, properties: Object.fromEntries(keys.map(k => [k, { type: 'string' }])) };
    const raw = await generateJson(`Reescreva apenas os campos solicitados desta seção, sem alterar fatos. Pedido: ${instruction}. Dados verificados: ${JSON.stringify(site.crmLead.lead)}. Seção atual: ${JSON.stringify(currentText)}. Campos: ${keys.join(', ')}.`, schema);
    const parsed = z.object(Object.fromEntries(keys.map(k => [k, z.string().max(12000)]))).parse(raw);
    return { patch: parsed };
  }
}
export const websiteService = new WebsiteService();
