export interface BusinessFormData {
  name: string;
  niche: string;
  desc: string;
  perks: string;
  cta: string;
  phone: string;
  city: string;
  colors: string;
  sections: string[];
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

export const DEFAULT_SECTIONS = ['Hero', 'Destaques/Produtos', 'Sobre', 'Depoimentos', 'Contato/CTA final'];
