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
  orientation: z.enum(['landscape', 'portrait', 'square']).default('landscape'),
  direction: z.object({
    subject: z.string().min(3).max(180),
    camera: z.string().min(3).max(120),
    lighting: z.string().min(3).max(120),
    composition: z.string().min(3).max(180),
    negativeSpace: z.string().min(3).max(180),
    palette: z.string().min(3).max(180),
    avoid: z.array(z.string().min(2).max(100)).min(1).max(8),
  }).optional(),
});
export type ImageIntent = z.infer<typeof imageIntentSchema>;

export const siteAssetSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,60}$/),
  url: z.string(),
  alt: z.string().default(''),
  credit: z.string().default(''),
  creditUrl: z.string().default(''),
  provider: z.string().default(''),
  kind: z.string().max(40).default(''),
  usage: z.string().max(60).default(''),
  sourceType: z.enum(['business', 'social', 'stock', 'generated']).default('stock'),
  isBusinessAsset: z.boolean().default(false),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  score: z.number().finite().optional(),
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
  source: z.enum(['ai_generation', 'ai_edit', 'manual_edit', 'restore', 'publish']).default('ai_edit'),
  instruction: z.string().max(2000).default(''),
  sizeBytes: z.number().int().nonnegative().default(0),
});
export type VersionMeta = z.infer<typeof versionMetaSchema>;

export const designSystemSchema = z.object({
  palette: z.object({
    primary: z.string().max(40).default(''),
    secondary: z.string().max(40).default(''),
    accent: z.string().max(40).default(''),
    background: z.string().max(40).default(''),
    surface: z.string().max(40).default(''),
    text: z.string().max(40).default(''),
    muted: z.string().max(40).default(''),
  }).default({}),
  typography: z.object({
    family: z.string().max(120).default(''),
    display: z.string().max(120).default(''),
    headings: z.string().max(120).default(''),
    body: z.string().max(120).default(''),
  }).default({}),
  shape: z.object({
    radius: z.string().max(40).default(''),
    shadow: z.string().max(120).default(''),
    border: z.string().max(40).default(''),
  }).default({}),
  spacing: z.string().max(120).default(''),
  motion: z.object({
    easing: z.string().max(80).default(''),
    duration: z.string().max(80).default(''),
    reveal: z.string().max(120).default(''),
  }).default({}),
}).default({});
export type DesignSystem = z.infer<typeof designSystemSchema>;

export const planComponentSchema = z.object({
  name: z.string().max(60).default(''),
  purpose: z.string().max(240).default(''),
  content: z.string().max(240).default(''),
  responsive: z.string().max(240).default(''),
});
export type PlanComponent = z.infer<typeof planComponentSchema>;

export const designPlanSchema = z.object({
  businessInsight: z.string().max(700).default(''),
  targetAudience: z.string().max(300).default(''),
  creativeDirection: z.string().max(700).default(''),
  designSystem: designSystemSchema,
  components: z.array(planComponentSchema).max(24).default([]),
  pageFlow: z.array(z.string().max(60)).max(30).default([]),
  primaryAction: z.string().max(140).default(''),
  whatsappStrategy: z.string().max(300).default(''),
  contentDecisions: z.string().max(500).default(''),
  variationNote: z.string().max(500).default(''),
}).default({});
export type DesignPlan = z.infer<typeof designPlanSchema>;

export const storedSiteSchema = z.object({
  schemaVersion: z.literal(2),
  business: businessSchema,
  artefact: artefactSchema,
  imageMap: z.record(z.string(), siteAssetSchema).default({}),
  assets: z.array(siteAssetSchema).default([]),
  designPlan: designPlanSchema,
  generation: z.object({
    promptVersion: z.string().max(80),
    businessAnalysis: z.record(z.string(), z.unknown()),
    creativeBrief: z.record(z.string(), z.unknown()),
    artDirectionPlan: z.record(z.string(), z.unknown()).optional(),
    assetManifest: z.record(z.string(), z.unknown()),
    qualityScore: z.number().min(0).max(100),
    visualQuality: z.object({
      score: z.number().min(0).max(10),
      dimensions: z.record(z.string(), z.number().min(0).max(10)),
      issues: z.array(z.object({ severity: z.enum(['critical', 'warning']), code: z.string(), message: z.string(), recommendation: z.string() })).max(60),
    }).optional(),
    auditIssues: z.array(z.object({ severity: z.enum(['critical', 'warning']), code: z.string(), message: z.string() })).max(60),
  }).optional(),
  meta: versionMetaSchema.default({}),
});
export type StoredSite = z.infer<typeof storedSiteSchema>;

export const siteCreateSchema = z.object({
  seo: artefactSeoSchema,
  files: artefactFilesSchema,
  imageIntents: z.array(imageIntentSchema).max(12).default([]),
  designPlan: designPlanSchema,
});
export type SiteCreate = z.infer<typeof siteCreateSchema>;

export const siteEditSchema = z.object({
  files: z.record(z.string(), z.string().max(220_000)).default({}),
  seo: artefactSeoSchema.optional(),
});
export type SiteEdit = z.infer<typeof siteEditSchema>;
