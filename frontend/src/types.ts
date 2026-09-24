export interface BusinessFormData {
  name: string;
  niche: string;
  desc: string;
  perks: string;
  cta: string;
  phone: string;
  city: string;
  colors: string;
}

export interface ImagePromptSpec {
  id: string;
  prompt: string;
}

export interface ParsedSite {
  images: ImagePromptSpec[];
  html: string;
}

export type LogKind = 'ok' | 'go' | 'err' | 'muted';

export interface LogEntry {
  id: number;
  text: string;
  kind: LogKind;
}

export const TEXT_MODELS = [
  { value: 'gemini-3.1-pro-preview', label: 'gemini-3.1-pro-preview (máxima qualidade)' },
  { value: 'gemini-3.8-flash', label: 'gemini-3.8-flash (recomendado: rápido e forte)' },
  { value: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite (fallback econômico)' },
] as const;

export const IMAGE_MODELS = [
  { value: '@cf/black-forest-labs/flux-2-klein-4b', label: 'FLUX.2 Klein 4B — recomendado / rápido / econômico' },
  { value: '@cf/black-forest-labs/flux-2-klein-9b', label: 'FLUX.2 Klein 9B — mais qualidade, consome mais cota' },
  { value: '@cf/black-forest-labs/flux-2-dev', label: 'FLUX.2 Dev — premium / realismo alto' },
] as const;

export const NICHES = [
  { value: 'imobiliaria', label: 'Imobiliária / imóveis de alto padrão' },
  { value: 'fastfood', label: 'Delivery / hamburgueria / fast-food' },
  { value: 'restaurante', label: 'Restaurante / pizzaria' },
  { value: 'petshop', label: 'Pet shop' },
  { value: 'energiasolar', label: 'Energia solar' },
  { value: 'seguranca', label: 'Segurança eletrônica / vigilância' },
  { value: 'consultoria', label: 'Consultoria / B2B / SaaS' },
  { value: 'outro', label: 'Outro (descreva abaixo)' },
] as const;

/* -------------------------------------------------------------------- */
/* Leads / CRM                                                          */
/* -------------------------------------------------------------------- */

export interface GeoState {
  uf: string;
  name: string;
}

export interface NicheOption {
  value: string;
  label: string;
  keyword: string;
}

export type LeadStage = 'Base' | 'Abordado' | 'Agendado' | 'Follow Up' | 'Convertido' | 'Perdido';
export type LeadStatus = 'Em aberto' | 'Ganho' | 'Perdido';
export type LeadTier = 'Quente' | 'Morno' | 'Frio';

// Campos que já vêm prontos de uma busca no Google Places (antes de entrar no CRM)
export interface LeadSearchResult {
  placeId: string | null;
  name: string;
  niche: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  hasSite: boolean;
  websiteUrl: string;
  rating: number | null;
  reviewCount: number;
  googleMapsUri: string;
  score: number;
  tier: LeadTier;
}

// Lead já salvo no CRM (com etapa, status, notas etc.)
export interface Lead extends LeadSearchResult {
  id: string;
  stage: LeadStage;
  status: LeadStatus;
  notes: string;
  siteUrl: string | null;
  siteGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const CRM_STAGES: LeadStage[] = ['Base', 'Abordado', 'Agendado', 'Follow Up', 'Convertido', 'Perdido'];

export const STAGE_COLORS: Record<LeadStage, string> = {
  Base: '#9aa0ab',
  Abordado: '#2f5fe0',
  Agendado: '#0e9f6e',
  'Follow Up': '#e08a2f',
  Convertido: '#6d5ce0',
  Perdido: '#d64545',
};

export const TIER_COLORS: Record<LeadTier, { bg: string; text: string }> = {
  Quente: { bg: '#e7f6ee', text: '#0e7c5b' },
  Morno: { bg: '#fdf1e0', text: '#b5720d' },
  Frio: { bg: '#eef1f5', text: '#5f6570' },
};
