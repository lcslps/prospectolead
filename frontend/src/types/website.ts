export interface SiteAsset { id: string; url: string; alt: string; credit: string; creditUrl: string; provider: string }
export interface ArtefactSeo { title: string; description: string; keywords: string }
export interface SiteArtefact {
  format: 'html-standalone';
  files: { 'index.html': string; 'styles.css': string; 'script.js': string };
  seo: ArtefactSeo;
}
export interface BusinessData {
  googlePlaceId: string; name: string; category: string; categories: string[];
  city: string; state: string; country: string; address: string;
  phone: string; whatsapp: string; website: string;
  rating: string; reviewCount: string; mapUrl: string; hours: string;
}
export interface StoredSite {
  schemaVersion: 2;
  business: BusinessData;
  artefact: SiteArtefact;
  imageMap: Record<string, SiteAsset>;
  assets: SiteAsset[];
  meta: { source: 'ai_generation' | 'ai_edit' | 'restore' | 'publish'; instruction: string; sizeBytes: number };
}
export interface Website {
  id: string; crmLeadId: string; name: string; status: 'DRAFT' | 'PUBLISHED';
  generationStatus: string; generationError: string | null; revision: number;
  publishedVersion: number | null; publishedAt: string | null; schemaVersion: number;
  currentDocument: StoredSite | null; business: BusinessData; seo: ArtefactSeo;
  legacy?: boolean;
}
export interface WebsiteVersion {
  version: number; source: string; createdAt: string; sizeBytes: number; title: string;
  isCurrent: boolean; isPublished: boolean;
}
export const VERSION_SOURCE_LABELS: Record<string, string> = {
  ai_generation: 'Criação com IA', ai_edit: 'Ajuste com IA', restore: 'Restauração', publish: 'Publicação',
};