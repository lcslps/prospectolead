import { z } from 'zod';

export const sectionTypes = ['header', 'hero', 'services', 'about', 'gallery', 'testimonials', 'faq', 'contact', 'map', 'prices', 'menu', 'team', 'cta', 'hours', 'logos', 'features', 'form', 'footer'] as const;
const text = z.string().max(12000).default('');
const link = z.string().max(2048).refine(v => !v || /^(https?:\/\/|tel:|mailto:|#[\w-])/i.test(v), 'Link inválido').default('');
const image = z.string().max(2800000).refine(v => !v || /^https:\/\//i.test(v) || /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(v), 'Imagem inválida').default('');
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
export const buttonSchema = z.object({ label: text, href: link, newTab: z.boolean().default(false) });
export const contentSchema = z.object({
  eyebrow: text, title: text, subtitle: text, text,
  image, imageAlt: text,
  primaryButton: buttonSchema.default({}), secondaryButton: buttonSchema.default({}),
  items: z.array(z.object({ title: text, text, price: text, image, imageAlt: text, href: link })).max(60).default([]),
});
export const settingsSchema = z.object({ background: color.default('#ffffff'), color: color.default('#172033'), align: z.enum(['left', 'center', 'right']).default('left'), padding: z.number().min(0).max(180).default(72), radius: z.number().min(0).max(80).default(16), overlay: z.number().min(0).max(0.9).default(0.45) });
export const sectionSchema = z.object({ id: z.string().min(1).max(100), type: z.enum(sectionTypes), visible: z.boolean().default(true), content: contentSchema, settings: settingsSchema.default({}) });
export const businessSchema = z.object({ name: text, category: text, city: text, address: text, phone: text, whatsapp: link, hours: text, rating: text, reviewCount: text, mapUrl: link });
export const themeSchema = z.object({ primary: color.default('#0f766e'), accent: color.default('#0891b2'), background: color.default('#ffffff'), text: color.default('#172033'), font: z.enum(['sans', 'serif']).default('sans'), radius: z.number().min(0).max(60).default(24) });
export const documentSchema = z.object({ name: z.string().min(1).max(200), business: businessSchema, theme: themeSchema, sections: z.array(sectionSchema).min(1).max(60) }).superRefine((d, ctx) => {
  if (new Set(d.sections.map(s => s.id)).size !== d.sections.length) ctx.addIssue({ code: 'custom', message: 'Seções com identificadores repetidos' });
});
export type WebsiteDocument = z.infer<typeof documentSchema>;
