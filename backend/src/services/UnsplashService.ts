import { env } from '../config/env';

const QUERY_MAP: Record<string, string> = {
  restaurante: 'restaurant food',
  'bar de vinhos': 'wine bar',
  bar: 'bar drinks',
  hamburgueria: 'burger restaurant',
  pizzaria: 'pizza',
  churrascaria: 'barbecue grill',
  'comida caseira': 'homemade food',
  panificadora: 'bakery',
  padaria: 'bakery',
  confeitaria: 'cake pastry',
  sorveteria: 'ice cream shop',
  cafeteria: 'coffee shop',
  'cozinha japonesa': 'japanese sushi restaurant',
  'cozinha italiana': 'italian restaurant',
  'comida rápida': 'fast food',
  'lanchonete': 'snack bar',
  açaí: 'açai bowl',
  barbearia: 'barber shop',
  cabeleireiro: 'hair salon',
  'salão de beleza': 'beauty salon',
  'salão de cabeleireiro': 'hair salon',
  estética: 'beauty salon',
  'clínica de estética': 'beauty clinic',
  'centro de estética': 'beauty clinic',
  sobrancelhas: 'eyebrow beauty',
  manicure: 'nail salon',
  'estúdio de tatuagem': 'tattoo studio',
  dentista: 'dentist office',
  'clínica odontológica': 'dentist clinic',
  'consultório odontológico': 'dentist clinic',
  'clínica médica': 'medical clinic',
  médico: 'doctor office',
  hospital: 'hospital building',
  'clínica veterinária': 'veterinary clinic',
  veterinário: 'veterinarian',
  petshop: 'pet shop',
  'banho e tosa': 'pet grooming',
  'academia': 'gym fitness',
  'estúdio de crossfit': 'crossfit gym',
  'estúdio de pilates': 'pilates studio',
  'escola de dança': 'dance studio',
  'escola de música': 'music school',
  escola: 'school classroom',
  'curso de idiomas': 'language school',
  'colégio': 'school students',
  'universidade': 'university campus',
  'auto escola': 'driving school',
  'oficina mecânica': 'car mechanic garage',
  'oficina automotiva': 'car repair shop',
  'auto peças': 'car parts store',
  'pneus': 'tires car workshop',
  'lavagem de carros': 'car wash',
  'estética automotiva': 'car detailing',
  concessionária: 'car dealership',
  'loja de carros': 'used car dealership',
  advogado: 'lawyer office',
  advocacia: 'law firm',
  contador: 'accountant office',
  'contabilidade': 'accounting office',
  'imobiliária': 'real estate agency',
  'corretor de imóveis': 'realtor house',
  'engenharia civil': 'construction engineer',
  'arquitetura': 'architecture modern building',
  'design de interiores': 'interior design',
  'escritório de arquitetura': 'architecture office',
  'mercado': 'supermarket groceries',
  supermercado: 'supermarket',
  'mercearia': 'grocery store',
  'loja de roupas': 'clothing store fashion',
  'loja de sapatos': 'shoe store',
  'loja de móveis': 'furniture store',
  'loja de eletrodomésticos': 'appliance store',
  'loja de celulares': 'smartphone store',
  'joalheria': 'jewelry store',
  'ótica': 'eyewear store',
  'farmacia': 'pharmacy',
  'drogaria': 'pharmacy',
  'floricultura': 'flower shop',
  'materiais de construção': 'hardware store construction materials',
  'ferragens': 'hardware store',
  'papelaria': 'stationery store',
  livraria: 'bookstore',
  brinquedos: 'toys store',
  'jogos': 'board games',
  'hotel': 'hotel building',
  pousada: 'cozy inn guesthouse',
  'casa de eventos': 'event venue',
  'buffet': 'catering buffet',
  'salão de festas': 'party venue',
  'espaco de eventos': 'event hall',
  'igreja': 'church',
  'box': 'boxing gym',
  'loja de games': 'video game store',
  'casa noturna': 'nightclub',
  'barber shop': 'barber shop',
  restaurant: 'restaurant food',
  'auto repair': 'car mechanic garage',
  dentist: 'dentist office',
  'hair salon': 'hair salon',
  'beauty salon': 'beauty salon',
  gym: 'gym fitness',
  clinic: 'medical clinic',
  'pet store': 'pet shop',
  pharmacy: 'pharmacy',
  lawyer: 'lawyer office',
  'real estate': 'real estate agency',
  supermarket: 'supermarket',
  school: 'school classroom',
  bakery: 'bakery',
  'coffee shop': 'coffee shop',
};

function findMap(query: string): string {
  const q = query.toLowerCase().trim();
  if (QUERY_MAP[q]) return QUERY_MAP[q];
  if (q.length < 3) return 'business';
  for (const [key, value] of Object.entries(QUERY_MAP)) if (q.includes(key)) return value;
  return q;
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
  const norm = `${term.toLowerCase()}:${Math.min(30, Math.max(1, perPage))}`;
  const cached = cache.get(norm);
  if (cached && Date.now() - cached.at < TTL) return cached.images;
  const count = Math.min(30, Math.max(1, perPage));
  const result = await searchPexels(term, count) || await searchPixabay(term, count) || await searchUnsplash(term, count);
  if (result.length) cache.set(norm, { at: Date.now(), images: result });
    return result;
}

async function searchPexels(term: string, perPage: number): Promise<UnsplashImage[] | null> {
  if (!env.PEXELS_API_KEY) return null;
  try {
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=${perPage}&orientation=landscape`, { headers: { Authorization: env.PEXELS_API_KEY }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    const data = await response.json() as { photos?: { alt?: string; photographer?: string; photographer_url?: string; src?: { large2x?: string; large?: string; landscape?: string } }[] };
    const images = (data.photos ?? []).flatMap(photo => { const url = photo.src?.large2x || photo.src?.large || photo.src?.landscape; return url ? [{ url, alt: photo.alt || term, credit: photo.photographer || 'Pexels', creditUrl: photo.photographer_url || 'https://www.pexels.com/', provider: 'Pexels' as const }] : []; });
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
    const images = (data.hits ?? []).flatMap(photo => { const url = photo.largeImageURL || photo.webformatURL; return url ? [{ url, alt: photo.tags || term, credit: photo.user || 'Pixabay', creditUrl: photo.user_id ? `https://pixabay.com/users/${photo.user}-${photo.user_id}/` : 'https://pixabay.com/', provider: 'Pixabay' as const }] : []; });
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
    return (data.results ?? []).flatMap(photo => { const raw = photo.urls?.raw; return raw ? [{ url: `${raw}${params(1600)}`, alt: photo.alt_description || photo.description || term, credit: photo.user?.name || 'Unsplash', creditUrl: photo.user?.links?.html || 'https://unsplash.com/', provider: 'Unsplash' as const }] : []; });
  } catch { return []; }
}

export const unsplashService = {
  hasKey: hasUnsplash,
  search: searchImages,
};
