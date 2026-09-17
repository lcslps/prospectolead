import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError, notFound } from '../utils/apiError';
import { generateJson, generationSchema, requireGemini } from './GeminiService';
import { businessSchema, contentSchema, documentSchema, sectionTypes, settingsSchema, themeSchema, type WebsiteDocument } from './websiteSchema';

const include = { sections: { orderBy: { order: 'asc' as const } } };
const generatedSchema = z.object({ primary: z.string().regex(/^#[0-9a-f]{6}$/i), accent: z.string().regex(/^#[0-9a-f]{6}$/i), sections: z.array(z.object({ type: z.enum(sectionTypes), title: z.string(), subtitle: z.string(), eyebrow: z.string(), text: z.string(), primaryLabel: z.string(), secondaryLabel: z.string(), items: z.array(z.object({ title: z.string(), text: z.string(), price: z.string() })).max(20).default([]) })).min(3).max(16) });
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
    const business = businessSchema.parse({ name: l.nome, category: l.categoria || l.nicho || '', city: [l.cidade, l.estado].filter(Boolean).join(' / '), address: l.endereco || '', phone: l.telefone || l.telefoneInternacional || '', whatsapp: digits ? `https://wa.me/${digits}` : '', rating: l.nota == null ? '' : String(l.nota), reviewCount: l.quantidadeAvaliacoes == null ? '' : String(l.quantidadeAvaliacoes), mapUrl: l.googleMapsUrl || '' });
    const site = await prisma.website.upsert({ where: { crmLeadId }, create: { crmLeadId, name: l.nome, business, theme: themeSchema.parse({}) }, update: {} });
    if (site.generationStatus === 'completed') return this.get(site.id);
    const lock = await prisma.website.updateMany({ where: { id: site.id, OR: [{ generationStatus: { in: ['pending', 'failed'] } }, { generationStatus: 'generating', updatedAt: { lt: new Date(Date.now() - 150000) } }] }, data: { generationStatus: 'generating', generationError: null } });
    if (!lock.count) throw new AppError(409, 'Este site já está sendo gerado. Aguarde alguns instantes.');
    try {
      const document = await this.generateDocument(business, { ...l, crmNotes: crm.notes });
      await prisma.$transaction(async tx => {
        await tx.websiteSection.deleteMany({ where: { websiteId: site.id } });
        await tx.website.update({ where: { id: site.id }, data: { name: document.name, business: asJson(document.business), theme: asJson(document.theme), generationStatus: 'completed', revision: { increment: 1 }, sections: { create: document.sections.map((s, order) => ({ ...s, order, content: asJson(s.content), settings: asJson(s.settings) })) } } });
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
    const result = generatedSchema.parse(await generateJson(`Crie uma estrutura de site profissional específica para o nicho deste negócio. Escolha seções adequadas: restaurante pode ter cardápio; barbearia serviços e equipe; oficina especialidades; dentista tratamentos. Inclua header, hero e footer. Varie estrutura, textos e cores de acordo com o nicho. Se não conhecer os serviços/preços/pessoas, mantenha as seções sem afirmações factuais; o usuário preencherá depois. Use títulos comerciais curtos e claros. Não repita dados de contato nos textos; eles serão renderizados dos dados verificados. Não escreva depoimentos inventados. Em items, extraia somente títulos, descrições e preços copiados literalmente dos dados conhecidos. Se não existem itens conhecidos, retorne items vazio. Dados: ${JSON.stringify(facts)}`, generationSchema));
    return documentSchema.parse({ name: business.name, business, theme: themeSchema.parse({ primary: result.primary, accent: result.accent }), sections: result.sections.map(s => ({ id: randomUUID(), type: s.type, visible: true, content: contentSchema.parse({ title: s.type === 'header' || s.type === 'footer' ? business.name : s.title, subtitle: s.subtitle, eyebrow: s.eyebrow, text: s.text, items: s.items.filter(item => item.title && [item.title, item.text, item.price].every(value => !value || factStrings.includes(value))), primaryButton: { label: s.primaryLabel, href: business.whatsapp }, secondaryButton: { label: s.secondaryLabel, href: '#contato' } }), settings: settingsSchema.parse(s.type === 'hero' || s.type === 'cta' ? { background: result.primary, color: '#ffffff', padding: 100 } : s.type === 'header' || s.type === 'footer' ? { padding: 24 } : {}) })) });
  }
  async save(id: string, revision: number, document: WebsiteDocument, publish = false) {
    await prisma.$transaction(async tx => {
      const changed = await tx.website.updateMany({ where: { id, revision, generationStatus: 'completed' }, data: { name: document.name, business: asJson(document.business), theme: asJson(document.theme), revision: { increment: 1 }, ...(publish ? { status: 'PUBLISHED', published: asJson(document), publishedAt: new Date() } : {}) } });
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
