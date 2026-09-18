export const SECTION_LABELS = { header: 'Menu do topo', hero: 'Capa (primeira dobra)', services: 'Serviços', about: 'Sobre', gallery: 'Galeria de fotos', testimonials: 'Depoimentos', faq: 'Perguntas frequentes', contact: 'Contato', map: 'Localização (mapa)', prices: 'Planos e preços', menu: 'Cardápio / lista de preços', team: 'Equipe', cta: 'Chamada de destaque', hours: 'Horários', logos: 'Logos', features: 'Diferenciais', form: 'Formulário', footer: 'Rodapé' } as const;
export type SectionType = keyof typeof SECTION_LABELS;
export interface SiteButton { label: string; href: string; newTab: boolean }
export interface SiteItem { title: string; text: string; price: string; image: string; imageAlt: string; imageCredit?: string; imageCreditUrl?: string; href: string }
export interface SiteContent { eyebrow: string; title: string; subtitle: string; text: string; image: string; imageAlt: string; imageCredit?: string; imageCreditUrl?: string; primaryButton: SiteButton; secondaryButton: SiteButton; items: SiteItem[] }
export interface SiteSection { id: string; type: SectionType; visible: boolean; content: SiteContent; settings: { background: string; color: string; align: 'left' | 'center' | 'right'; padding: number; radius: number; overlay: number } }
export interface SiteSeo { title: string; description: string; keywords: string }
export interface SiteDocument {
  name: string;
  business: { googlePlaceId?: string; name: string; category: string; city: string; address: string; phone: string; whatsapp: string; hours: string; rating: string; reviewCount: string; mapUrl: string };
  theme: { primary: string; accent: string; background: string; text: string; font: 'sans' | 'serif'; radius: number };
  seo: SiteSeo;
  sections: SiteSection[];
}
export interface SitePhoto { url: string; alt: string; credit: string; creditUrl: string; provider: string }
export interface Website extends SiteDocument { id: string; crmLeadId: string; revision: number; status: 'DRAFT' | 'PUBLISHED'; generationStatus: string; generationError: string | null; publishedAt: string | null }
export function emptyItem(): SiteItem { return { title: '', text: '', price: '', image: '', imageAlt: '', href: '' }; }
export function newSection(type: SectionType): SiteSection {
  return { id: crypto.randomUUID(), type, visible: true, content: { eyebrow: '', title: SECTION_LABELS[type], subtitle: '', text: '', image: '', imageAlt: '', primaryButton: { label: '', href: '', newTab: false }, secondaryButton: { label: '', href: '', newTab: false }, items: [] }, settings: { background: '#ffffff', color: '#172033', align: 'left', padding: type === 'header' || type === 'footer' ? 24 : 72, radius: 16, overlay: 0.45 } };
}
