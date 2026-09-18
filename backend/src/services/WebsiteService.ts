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

const include = { sections: { orderBy: { order: 'asc' as const } } };
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
const generatedSchema = z.object({
  theme: z.object({ primary: hex, accent: hex, background: hex, text: hex, font: z.enum(['sans', 'serif']), radius: z.number().min(0).max(60) }),
  seo: z.object({ title: z.string(), description: z.string(), keywords: z.string() }),
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
    const result = generatedSchema.parse(await generateJson(`Crie o site completo de uma só vez, em português do Brasil, com tema, SEO e seções. Escolha um tema (cores primária, destaque, fundo e texto em hexadecimal, tipografia sans/serif e arredondamento) específico e adequado ao nicho. Escreva o seo com title curto, description de até 160 caracteres e keywords separadas por vírgula, sem inventar fatos. Escolha seções adequadas: restaurante pode ter cardápio; barbearia serviços e equipe; oficina especialidades; dentista tratamentos. Inclua header, hero e footer. Varie estrutura, textos e cores de acordo com o nicho. Se não conhecer os serviços/preços/pessoas, mantenha as seções sem afirmações factuais; o usuário preencherá depois. Use títulos comerciais curtos e claros. Não repita dados de contato nos textos; eles serão renderizados dos dados verificados. Não escreva depoimentos inventados. Em items, extraia somente títulos, descrições e preços copiados literalmente dos dados conhecidos. Se não existem itens conhecidos, retorne items vazio. Dados: ${JSON.stringify(facts)}`, generationSchema));
    const sections = result.sections.slice(0, 16).map(s => ({ id: randomUUID(), type: s.type, visible: true, content: contentSchema.parse({ title: s.type === 'header' || s.type === 'footer' ? business.name : s.title, subtitle: s.subtitle, eyebrow: s.eyebrow, text: s.text, items: s.items.filter(item => item.title && [item.title, item.text, item.price].every(value => !value || factStrings.includes(value))), primaryButton: { label: s.primaryLabel, href: business.whatsapp }, secondaryButton: { label: s.secondaryLabel, href: '#contato' } }), settings: settingsSchema.parse(s.type === 'hero' || s.type === 'cta' ? { background: result.theme.primary, color: '#ffffff' } : s.type === 'header' || s.type === 'footer' ? { padding: 24 } : {}) }));
    return documentSchema.parse(await this.attachImages(business, { name: business.name, business, theme: themeSchema.parse(result.theme), seo: seoSchema.parse(result.seo), sections }));
  }
  private async attachImages(business: WebsiteDocument['business'], document: WebsiteDocument): Promise<WebsiteDocument> {
    let images = hasPhotoSearch() ? await searchImages(business.category || business.name, 12).catch(() => [] as UnsplashImage[]) : [];
    if (!images.length && business.googlePlaceId && env.NODE_ENV !== 'test') {
      try {
        const place = await googlePlacesService.getPlaceDetails(business.googlePlaceId, ['id', 'photos']);
        images = (place.photos ?? []).slice(0, 4).map((photo, index) => ({
          url: `google-place://${encodeURIComponent(business.googlePlaceId)}/${index}`,
          alt: `Google Maps photo of ${business.name}`,
          credit: photo.authorAttributions?.[0]?.displayName || 'Google Maps',
          creditUrl: photo.authorAttributions?.[0]?.uri || business.mapUrl || `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(business.googlePlaceId)}`,
          provider: 'Google Maps',
        }));
      } catch { /* Optional Maps photos must not block website generation. */ }
    }

    if (!images.length) return document;
    const hero = images[0];
    const main = images[1] ?? images[0];
    const gallery = images.slice(1, 9);
    const sections = document.sections.map(s => {
      if (s.content.image) return s;
      const altFor = (img: UnsplashImage) => `${business.name}${img.alt ? ` — ${img.alt}` : ''}`.slice(0, 200);
      if (s.type === 'hero') return { ...s, content: { ...s.content, image: hero.url, imageAlt: altFor(hero), imageCredit: hero.credit, imageCreditUrl: hero.creditUrl } };
      if (s.type === 'about') return { ...s, content: { ...s.content, image: main.url, imageAlt: altFor(main), imageCredit: main.credit, imageCreditUrl: main.creditUrl } };
      if (s.type === 'gallery') {
        const items = s.content.items.map((item, i) => gallery[i] ? { ...item, image: gallery[i].url, imageAlt: item.imageAlt || `Foto ${i + 1} de ${business.name}`, imageCredit: gallery[i].credit, imageCreditUrl: gallery[i].creditUrl } : item);
        for (const img of gallery.slice(items.length)) items.push({ title: '', text: '', price: '', image: img.url, imageAlt: `Foto ${items.length + 1} de ${business.name}`, imageCredit: img.credit, imageCreditUrl: img.creditUrl, href: '' });
        return { ...s, content: { ...s.content, items } };
      }
      return s;
    });
    const hasGallery = sections.some(s => s.type === 'gallery');
    const finalSections = hasGallery ? sections : this.insertGallery(sections, business, gallery);
    return documentSchema.parse({ ...document, sections: finalSections });
  }
  private insertGallery(sections: WebsiteDocument['sections'], business: WebsiteDocument['business'], gallery: UnsplashImage[]) {
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
