import { z } from 'zod';

export const businessSchema = z.object({
  googlePlaceId: z.string().default(''),
  name: z.string().default(''),
  category: z.string().default(''),
  categories: z.array(z.string()).default([]),
  city: z.string().default(''),
  state: z.string().default(''),
  country: z.string().default('Brasil'),
  address: z.string().default(''),
  phone: z.string().default(''),
  whatsapp: z.string().default(''),
  website: z.string().default(''),
  rating: z.string().default(''),
  reviewCount: z.string().default(''),
  mapUrl: z.string().default(''),
  hours: z.string().default(''),
});
export type BusinessData = z.infer<typeof businessSchema>;

export const artefactSeoSchema = z.object({
  title: z.string().max(200).default(''),
  description: z.string().max(500).default(''),
  keywords: z.string().max(500).default(''),
});
export type ArtefactSeo = z.infer<typeof artefactSeoSchema>;

export const imageIntentSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,40}$/),
  intent: z.string().min(3).max(240),
  usage: z.enum(['hero', 'about', 'gallery', 'decor', 'product']).default('hero'),
});
export type ImageIntent = z.infer<typeof imageIntentSchema>;

export const siteAssetSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,60}$/),
  url: z.string(),
  alt: z.string().default(''),
  credit: z.string().default(''),
  creditUrl: z.string().default(''),
  provider: z.string().default(''),
});
export type SiteAsset = z.infer<typeof siteAssetSchema>;

export const artefactFilesSchema = z.object({
  'index.html': z.string().min(1).max(220_000),
  'styles.css': z.string().max(180_000).default(''),
  'script.js': z.string().max(90_000).default(''),
});
export type ArtefactFiles = z.infer<typeof artefactFilesSchema>;

export const artefactSchema = z.object({
  format: z.literal('html-standalone'),
  files: artefactFilesSchema,
  seo: artefactSeoSchema,
});
export type SiteArtefact = z.infer<typeof artefactSchema>;

export const versionMetaSchema = z.object({
  source: z.enum(['ai_generation', 'ai_edit', 'restore', 'publish']).default('ai_edit'),
  instruction: z.string().max(2000).default(''),
  sizeBytes: z.number().int().nonnegative().default(0),
});
export type VersionMeta = z.infer<typeof versionMetaSchema>;

export const storedSiteSchema = z.object({
  schemaVersion: z.literal(2),
  business: businessSchema,
  artefact: artefactSchema,
  imageMap: z.record(z.string(), siteAssetSchema).default({}),
  assets: z.array(siteAssetSchema).default([]),
  meta: versionMetaSchema.default({}),
});
export type StoredSite = z.infer<typeof storedSiteSchema>;

export const siteCreateSchema = z.object({
  seo: artefactSeoSchema,
  files: artefactFilesSchema,
  imageIntents: z.array(imageIntentSchema).max(12).default([]),
});
export type SiteCreate = z.infer<typeof siteCreateSchema>;

export const siteEditSchema = z.object({
  files: z.record(z.string(), z.string().max(220_000)).default({}),
  seo: artefactSeoSchema.optional(),
});
export type SiteEdit = z.infer<typeof siteEditSchema>;