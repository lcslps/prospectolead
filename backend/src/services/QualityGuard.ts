import { randomUUID } from 'node:crypto';
import { documentSchema, type WebsiteDocument } from './websiteSchema';
import { isKnownVariant } from './SectionRegistry';

const unsafe = /(?:javascript:|data:text\/html|<script|on\w+\s*=)/i;
export function guardDocument(input: WebsiteDocument): WebsiteDocument {
  const seenImages = new Set<string>();
  const sections = input.sections.filter(section => {
    if (!isKnownVariant(section.type, section.variant)) section.variant = 'standard';
    if (section.content.title && unsafe.test(section.content.title + section.content.subtitle + section.content.text)) return false;
    section.content.primaryButton.href = unsafe.test(section.content.primaryButton.href) ? '' : section.content.primaryButton.href;
    section.content.secondaryButton.href = unsafe.test(section.content.secondaryButton.href) ? '' : section.content.secondaryButton.href;
    section.content.items = section.content.items.filter(item => {
      if (unsafe.test(item.href) || (item.image && seenImages.has(item.image))) return false;
      if (item.image) seenImages.add(item.image);
      return true;
    });
    return true;
  });
  if (!sections.some(section => section.type === 'hero')) sections.unshift({ ...sections[0], id: `hero_${randomUUID()}`, type: 'hero', variant: 'minimal', content: { ...sections[0].content, title: input.business.name } });
  if (!sections.some(section => section.type === 'footer')) sections.push({ ...sections.at(-1)!, id: `footer_${randomUUID()}`, type: 'footer', variant: 'standard', content: { ...sections.at(-1)!.content, title: input.business.name } });
  return documentSchema.parse({ ...input, sections: sections.slice(0, 16) });
}
