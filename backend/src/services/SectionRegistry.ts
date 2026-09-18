import { z } from 'zod';
import { sectionTypes } from './websiteSchema';

export const variantMap = {
  header: ['standard'] , hero: ['background', 'split', 'centered', 'minimal'],
  services: ['cards3', 'cards2', 'icon-grid', 'list'], about: ['image-left', 'image-right', 'editorial'],
  gallery: ['grid3', 'grid2', 'mosaic', 'featured'], testimonials: ['cards', 'centered', 'google-rating'],
  stats: ['row', 'cards'], cta: ['accent', 'dark', 'gradient', 'image'], faq: ['accordion'],
  contact: ['split', 'map', 'simple'], map: ['map'], team: ['cards3', 'cards4'],
  prices: ['cards', 'featured'], menu: ['list'], hours: ['list'], logos: ['row'], features: ['cards3'], form: ['simple'], footer: ['standard'],
} as const;

export type RegistryType = keyof typeof variantMap;
export const sectionRegistry = Object.fromEntries(sectionTypes.map(type => [type, {
  type, variants: (variantMap[type as RegistryType] ?? ['standard']) as readonly string[],
  maxItems: ['gallery', 'services', 'team', 'prices', 'menu'].includes(type) ? 12 : 8,
  required: ['header', 'hero', 'footer'].includes(type),
}])) as Record<string, { type: string; variants: readonly string[]; maxItems: number; required: boolean }>;

export const plannerCatalog = Object.values(sectionRegistry).map(({ type, variants, maxItems }) => ({ type, variants, maxItems }));
export function variantsFor(type: string) { return sectionRegistry[type]?.variants ?? []; }
export function isKnownVariant(type: string, variant: string) { return variantsFor(type).includes(variant); }
export const plannerSectionSchema = z.object({ type: z.enum(sectionTypes), variant: z.string(), title: z.string(), subtitle: z.string(), eyebrow: z.string(), text: z.string(), primaryLabel: z.string(), secondaryLabel: z.string(), items: z.array(z.object({ title: z.string(), text: z.string(), price: z.string() })).max(20).default([]) });
