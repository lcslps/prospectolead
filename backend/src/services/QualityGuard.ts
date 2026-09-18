import { randomUUID } from 'node:crypto';
import { contentSchema, documentSchema, settingsSchema, type WebsiteDocument } from './websiteSchema';
import { isKnownVariant, variantsFor } from './SectionRegistry';

const unsafe = /(?:javascript:|data:text\/html|<script|on\w+\s*=)/i;
const REQUIRED = new Set(['header', 'hero', 'footer']);
const ITEM_SECTIONS = new Set(['services', 'gallery', 'testimonials', 'stats', 'prices', 'menu', 'team', 'features', 'faq', 'hours', 'logos']);

function cleanHref(value: string): string {
  return unsafe.test(value) ? '' : value;
}

function itemHasContent(item: { title: string; text: string; price: string; image: string }): boolean {
  return Boolean(item.title || item.image);
}

function sectionHasContent(section: WebsiteDocument['sections'][number], business: WebsiteDocument['business'], isRequired: boolean): boolean {
  if (isRequired) return true;
  const c = section.content;
  const hasTitles = Boolean(c.eyebrow || c.title || c.subtitle || c.text || c.image || c.primaryButton?.label || c.secondaryButton?.label);
  const hasItems = (c.items ?? []).some(itemHasContent);
  if (ITEM_SECTIONS.has(section.type)) {
    if (hasItems || c.text) return true;
    if (section.type === 'testimonials' && business.rating) return true;
    if (section.type === 'hours' && business.hours) return true;
    return false;
  }
  return hasTitles || hasItems;
}

/**
 * Auditoria estrutural e visual. Nunca lança exceção: enumera problemas para
 * o pipeline corrigir (reparo) e registrar (diagnóstico).
 */
export function auditDocument(input: WebsiteDocument): string[] {
  const issues: string[] = [];
  const seenImages = new Set<string>();
  for (const section of input.sections) {
    if (!isKnownVariant(section.type, section.variant)) issues.push(`variante_desconhecida:${section.type}/${section.variant}`);
    if (!REQUIRED.has(section.type) && !sectionHasContent(section, input.business, false)) issues.push(`secao_vazia:${section.type}`);
    const c = section.content;
    if (c.title && unsafe.test(c.title + c.subtitle + c.text)) issues.push(`conteudo_inseguro:${section.type}`);
    if (c.primaryButton?.label && !/^(https?:\/\/|tel:|mailto:|#[\w-]|$)/i.test(c.primaryButton.href) && !unsafe.test(c.primaryButton.href)) issues.push(`botao_sem_link:${section.type}`);
    if (c.secondaryButton?.label && !/^(https?:\/\/|tel:|mailto:|#[\w-]|$)/i.test(c.secondaryButton.href) && !unsafe.test(c.secondaryButton.href)) issues.push(`botao_sem_link:${section.type}`);
    if (c.image) {
      if (seenImages.has(c.image)) issues.push(`imagem_repetida:${section.type}`);
      seenImages.add(c.image);
    }
    for (const [index, item] of (c.items ?? []).entries()) {
      if (item.title && unsafe.test(item.title + item.text)) issues.push(`item_inseguro:${section.type}:${index}`);
      if (item.image && seenImages.has(item.image)) issues.push(`imagem_repetida:${section.type}:${index}`);
      if (item.image) seenImages.add(item.image);
      if (!itemHasContent(item)) issues.push(`item_vazio:${section.type}:${index}`);
    }
  }
  if (!input.sections.some(s => s.type === 'hero')) issues.push('hero_ausente');
  if (!input.sections.some(s => s.type === 'footer')) issues.push('footer_ausente');
  if (input.sections.length > 16) issues.push(`excesso_secoes:${input.sections.length}`);
  return issues;
}

export function guardDocument(input: WebsiteDocument): WebsiteDocument {
  const seenImages = new Set<string>();
  const hasAnchor = (type: string) => input.sections.some(s => s.type === type && s.visible);
  const contactAnchor = hasAnchor('contact') || hasAnchor('map');

  const sections = input.sections
    .map(section => {
      if (!isKnownVariant(section.type, section.variant)) section.variant = (variantsFor(section.type)[0] || 'standard');
      if (section.content.title && unsafe.test(section.content.title + section.content.subtitle + section.content.text)) return null;
      section.content.primaryButton.href = cleanHref(section.content.primaryButton.href);
      section.content.secondaryButton.href = cleanHref(section.content.secondaryButton.href);
      if (section.content.primaryButton.label && !section.content.primaryButton.href) section.content.primaryButton.href = contactAnchor ? '#contato' : '';
      if (section.content.secondaryButton.label && !section.content.secondaryButton.href) section.content.secondaryButton.href = contactAnchor ? '#contato' : '';
      if (section.content.primaryButton.label && !section.content.primaryButton.href) section.content.primaryButton.label = '';
      if (section.content.secondaryButton.label && !section.content.secondaryButton.href) section.content.secondaryButton.label = '';
      if (section.content.image && seenImages.has(section.content.image)) section.content.image = '';
      if (section.content.image && !seenImages.has(section.content.image)) seenImages.add(section.content.image);
      section.content.items = section.content.items.filter(item => {
        if (!itemHasContent(item)) return false;
        if (unsafe.test(item.href)) return false;
        if (item.image && seenImages.has(item.image)) return false;
        if (item.image) seenImages.add(item.image);
        return true;
      });
      return section;
    })
    .filter((section): section is WebsiteDocument['sections'][number] => section !== null && (REQUIRED.has(section.type) || sectionHasContent(section, input.business, false)));

  const hero = sections.find(s => s.type === 'hero');
  if (hero && !hero.content.title) hero.content.title = input.business.name;
  const header = sections.find(s => s.type === 'header');
  if (header && !header.content.title) header.content.title = input.business.name;
  const footer = sections.find(s => s.type === 'footer');
  if (footer && !footer.content.title) footer.content.title = input.business.name;
  const last = sections.at(-1);

  if (!sections.some(section => section.type === 'hero')) {
    sections.unshift({ id: `hero_${randomUUID()}`, type: 'hero', variant: 'minimal', visible: true, content: contentSchema.parse({ ...last?.content, title: input.business.name }), settings: settingsSchema.parse({}) });
  }
  if (!sections.some(section => section.type === 'footer')) {
    sections.push({ id: `footer_${randomUUID()}`, type: 'footer', variant: 'standard', visible: true, content: contentSchema.parse({ ...last?.content, title: input.business.name }), settings: settingsSchema.parse({}) });
  }
  return documentSchema.parse({ ...input, sections: sections.slice(0, 16) });
}