import { env } from '../config/env';

const QUERY_MAP: Record<string, string> = {
  marmoraria: 'granite marble stone slab countertop',
  marmore: 'marble slab countertop stone',
  granito: 'granite slab countertop stone',
  restaurante: 'restaurant food dining',
  pizzaria: 'pizza pizzeria wood fired',
  hamburgueria: 'hamburger burger restaurant',
  churrascaria: 'barbecue grilled meat',
  cafeteria: 'coffee cafe pastry',
  padaria: 'bakery bread pastry',
  confeitaria: 'cake pastry bakery',
  barbearia: 'barber haircut barbershop',
  cabeleireiro: 'hair salon haircut stylist',
  estetica: 'beauty salon skincare',
  manicure: 'nail salon manicure',
  dentista: 'dentist dental clinic',
  clinica: 'medical clinic doctor',
  veterinario: 'veterinary clinic pets',
  petshop: 'pet shop grooming dogs',
  academia: 'gym fitness training',
  oficina: 'auto repair mechanic car workshop',
  farmacia: 'pharmacy drugstore',
  floricultura: 'flower shop florist bouquet',
  imobiliaria: 'real estate house property',
  hotel: 'hotel room hospitality',
  pousada: 'inn guesthouse room',
  supermercado: 'supermarket groceries shelves',
  escola: 'school classroom education',
  advocacia: 'law office lawyer',
  eletricista: 'electrician repairing electrical panel tools',
  eletrica: 'electrician electrical installation cables',
  eletrico: 'electric motor generator industrial',
  eletromecanica: 'industrial electric motor workshop',
  motor: 'industrial electric motor engine',
  motores: 'industrial electric motors workshop',
  gerador: 'diesel generator power unit',
  geradores: 'industrial generators equipment',
  motobomba: 'water pump motor industrial',
  bomba: 'industrial water pump',
  bombas: 'industrial water pumps equipment',
  energia: 'solar panel roof renewable energy',
  solar: 'solar panels installation roof',
  compressor: 'industrial air compressor machine',
  construcao: 'construction site workers building brick',
  'construcao civil': 'construction bricks building site',
  obra: 'construction site building framework',
  reforma: 'home renovation construction tools',
  pedreiro: 'mason bricklayer building wall',
  engenharia: 'engineer blueprint construction plans',
  arquitet: 'architecture building blueprint model',
  piso: 'tile floor installation construction',
  telhado: 'roof tiles construction house',
  agro: 'tractor agricultural farm field',
  agricola: 'tractor harvesting farm field',
  fazenda: 'farm countryside field cattle',
  plantio: 'seedling planting farm field',
  colheita: 'harvest crops combine tractor',
  trator: 'tractor field agriculture',
  pecuaria: 'cattle farm pasture livestock',
  usinagem: 'metal lathe machining workshop',
  metalurgica: 'steel factory metal industry worker',
  fundicao: 'metal foundry casting factory',
  serralheria: 'metal work welding workshop',
  caldeiraria: 'industrial welding metal fabrication',
  fab: 'industrial factory manufacturing',
  industrial: 'industrial factory machinery',
  furn: 'furniture store sofa interior display',
  fotografo: 'photographer camera studio photoshoot',
  fotografia: 'photographer camera studio',
  escritorio: 'modern office desk meeting room',
  seguranca: 'security guard monitoring cameras',
  'auto pecas': 'car parts tires mechanics shelf',
  autopecas: 'car spare parts accessories tires',
  loja: 'retail store interior product shelves',
  roupas: 'clothing store apparel rack',
  moda: 'clothing fashion boutique store',
  moveis: 'furniture store sofa living room',
  calcado: 'shoe store sneakers display',
  bijuteria: 'jewelry store rings display',
  otica: 'eyewear glasses optical store',
  presentes: 'gift shop products display',
  variedades: 'general store retail products shelves',
  ferramenta: 'tools hardware store',
  material: 'construction materials hardware store',
  brinquedo: 'toys store colorful display',
  papelaria: 'stationery store notebooks pens',
};

function normalize(query: string): string {
  return query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findMap(query: string): string {
  const normalized = normalize(query);
  for (const [key, value] of Object.entries(QUERY_MAP)) if (normalized.includes(key)) return value;
  return normalized.split(' ').filter(word => word.length > 2).slice(0, 9).join(' ');
}

const REJECT_WORDS = new Set(['guitar', 'concert', 'music', 'musician', 'fashion model', 'modelo', 'scooter', 'skateboard', 'surfing', 'wedding dress', 'makeup model', 'celebrity', 'cowboy', 'rock band', 'drum']);

function isRelevant(alt: string, term: string): boolean {
  const stopWords = new Set(['business', 'professional', 'modern', 'beautiful', 'quality', 'natural', 'stock', 'photo', 'picture', 'image', 'person', 'people', 'man', 'woman', 'hand', 'background']);
  const terms = normalize(term).split(' ').filter(word => word.length >= 4 && !stopWords.has(word));
  const description = normalize(alt);
  if (!description || !terms.length) return false;
  const matched = terms.filter(word => description.includes(word)).length;
  if (matched >= 2) return true;
  if (terms.length < 3 && matched === 1) {
    for (const reject of REJECT_WORDS) if (description.includes(reject)) return false;
    return true;
  }
  return false;
}

export type PhotoProvider = 'Pexels' | 'Pixabay' | 'Unsplash' | 'Google Maps';
export interface UnsplashImage { url: string; alt: string; credit: string; creditUrl: string; provider: PhotoProvider; }
interface Cached { at: number; images: UnsplashImage[]; }

const TTL = 1000 * 60 * 60;
const cache = new Map<string, Cached>();
const params = (w: number) => `?auto=format&fit=crop&w=${w}&q=80`;

export function hasPhotoSearch() {
  return Boolean(env.PEXELS_API_KEY || env.PIXABAY_API_KEY || env.UNSPLASH_ACCESS_KEY);
}

export function hasUnsplash() {
  return hasPhotoSearch();
}

export async function searchImages(query: string, perPage = 12): Promise<UnsplashImage[]> {
  if (!hasPhotoSearch()) return [];
  const term = findMap(query);
  if (!term) return [];
  const count = Math.min(30, Math.max(1, perPage));
  const key = `${term.toLowerCase()}:${count}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL) return cached.images;
  const result = await searchPexels(term, count) || await searchPixabay(term, count) || await searchUnsplash(term, count);
  if (result.length) {
    if (cache.size >= 300) { const oldest = cache.keys().next(); if (!oldest.done) cache.delete(oldest.value); }
    cache.set(key, { at: Date.now(), images: result });
  }
  return result;
}

async function searchPexels(term: string, perPage: number): Promise<UnsplashImage[] | null> {
  if (!env.PEXELS_API_KEY) return null;
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=${perPage}&orientation=landscape`, { headers: { Authorization: env.PEXELS_API_KEY }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    const data = await response.json() as { photos?: { alt?: string; photographer?: string; photographer_url?: string; src?: { large2x?: string; large?: string; landscape?: string } }[] };
    const images = (data.photos ?? []).flatMap(photo => { const url = photo.src?.large2x || photo.src?.large || photo.src?.landscape; const alt = photo.alt || ''; return url && isRelevant(alt, term) ? [{ url, alt, credit: photo.photographer || 'Pexels', creditUrl: photo.photographer_url || 'https://www.pexels.com/', provider: 'Pexels' as const }] : []; });
    return images.length ? images : null;
  } catch { return null; }
}

async function searchPixabay(term: string, perPage: number): Promise<UnsplashImage[] | null> {
  if (!env.PIXABAY_API_KEY) return null;
  try {
    const params = new URLSearchParams({ key: env.PIXABAY_API_KEY, q: term, image_type: 'photo', safesearch: 'true', per_page: String(perPage), orientation: 'horizontal' });
    const response = await fetch(`https://pixabay.com/api/?${params}`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    const data = await response.json() as { hits?: { largeImageURL?: string; webformatURL?: string; tags?: string; user?: string; user_id?: number }[] };
    const images = (data.hits ?? []).flatMap(photo => { const url = photo.largeImageURL || photo.webformatURL; const alt = photo.tags || ''; return url && isRelevant(alt, term) ? [{ url, alt, credit: photo.user || 'Pixabay', creditUrl: photo.user_id ? `https://pixabay.com/users/${photo.user}-${photo.user_id}/` : 'https://pixabay.com/', provider: 'Pixabay' as const }] : []; });
    return images.length ? images : null;
  } catch { return null; }
}

async function searchUnsplash(term: string, perPage: number): Promise<UnsplashImage[]> {
  if (!env.UNSPLASH_ACCESS_KEY) return [];
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(term)}&per_page=${perPage}&orientation=landscape`;
    const response = await fetch(url, { headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) return [];
    const data = await response.json() as { results?: { urls?: { raw?: string }; user?: { name?: string; links?: { html?: string } }; alt_description?: string | null; description?: string | null }[] };
    return (data.results ?? []).flatMap(photo => { const raw = photo.urls?.raw; const alt = photo.alt_description || photo.description || ''; return raw && isRelevant(alt, term) ? [{ url: `${raw}${params(1600)}`, alt, credit: photo.user?.name || 'Unsplash', creditUrl: photo.user?.links?.html || 'https://unsplash.com/', provider: 'Unsplash' as const }] : []; });
  } catch { return []; }
}

export const unsplashService = {
  hasKey: hasUnsplash,
  search: searchImages,
};
