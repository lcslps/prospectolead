import { env } from '../config/env';
import { googlePlacesService } from './GooglePlacesService';
import { searchImages } from './UnsplashService';
import { discoverSocial, type SocialProfiles } from './LeadSocialService';
import { rankAssets } from './AssetRanking';
import type { ArtefactFiles, BusinessData, ImageIntent, SiteAsset } from './siteArtefactSchema';

const TOKEN = /\{\{([A-Za-z0-9_-]+)\}\}/g;
const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const IMAGE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

export interface ImageResolution {
  files: ArtefactFiles;
  imageMap: Record<string, SiteAsset>;
  assets: SiteAsset[];
}

export interface LeadImageCollection {
  assets: SiteAsset[];
  profiles: SocialProfiles;
  unavailableSocial?: Array<'facebook' | 'instagram'>;
  summary?: string;
  reviews?: ReviewEntry[];
}

export interface ReviewEntry {
  author: string;
  rating?: number;
  text: string;
  when?: string;
}

export interface PlaceContext {
  summary?: string;
  reviews: ReviewEntry[];
}

export interface VisionImage {
  mimeType: string;
  data: string;
}

function proxyUrl(baseUrl: string | undefined, placeId: string, index: number): string {
  const base = (baseUrl || '').replace(/\/+$/, '');
  return `${base}/api/websites/place-photo?placeId=${encodeURIComponent(placeId)}&index=${index}`;
}

export async function collectPlaceContext(business: BusinessData): Promise<PlaceContext> {
  if (!business.googlePlaceId || !env.GOOGLE_MAPS_API_KEY) return { reviews: [] };
  if (env.NODE_ENV === 'test') return { reviews: [] };
  try {
    const place = await googlePlacesService.getPlaceDetails(business.googlePlaceId, ['id', 'editorialSummary', 'reviews']);
    const reviews = (place.reviews ?? [])
      .filter(review => review.text?.text?.trim())
      .slice(0, 6)
      .map(review => ({
        author: review.authorAttribution?.displayName?.trim() || 'Cliente do Google',
        rating: review.rating,
        text: review.text!.text!.trim(),
        when: review.relativePublishTimeDescription,
      }));
    return { summary: place.editorialSummary?.text?.trim() || undefined, reviews };
  } catch {
    return { reviews: [] };
  }
}

export async function collectPlacePhotos(business: BusinessData, baseUrl?: string): Promise<SiteAsset[]> {
  if (!business.googlePlaceId || !env.GOOGLE_MAPS_API_KEY) return [];
  if (env.NODE_ENV === 'test') return [];
  try {
    const place = await googlePlacesService.getPlaceDetails(business.googlePlaceId, ['id', 'photos']);
    return (place.photos ?? []).slice(0, 12).map((photo, index) => ({
      id: `PHOTO_${index}`,
      url: proxyUrl(baseUrl, business.googlePlaceId!, index),
      alt: index === 0
        ? `Melhor foto real de ${business.name}, tirada do Google Maps`
        : `Foto real de ${business.name}, tirada do Google Maps`,
      credit: photo.authorAttributions?.[0]?.displayName || 'Google Maps',
      creditUrl: photo.authorAttributions?.[0]?.uri || business.mapUrl || `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(business.googlePlaceId!)}`,
      provider: 'Google Maps',
      kind: index === 0 ? 'storefront' : 'interior',
      usage: index === 0 ? 'hero' : 'gallery',
      sourceType: 'business',
      isBusinessAsset: true,
      width: photo.widthPx,
      height: photo.heightPx,
    }));
  } catch {
    return [];
  }
}

export async function collectLeadImages(business: BusinessData, baseUrl?: string): Promise<LeadImageCollection> {
  if (env.NODE_ENV === 'test') return { assets: [], profiles: {} };
  const [placeAssets, social, context] = await Promise.all([
    collectPlacePhotos(business, baseUrl).catch(() => []),
    discoverSocial(business).catch(() => ({ assets: [], profiles: {} as SocialProfiles, unavailable: [] as Array<'facebook' | 'instagram'> })),
    collectPlaceContext(business).catch(() => ({ reviews: [] } as PlaceContext)),
  ]);
  return {
    assets: rankAssets([...placeAssets, ...social.assets]),
    profiles: social.profiles || {},
    unavailableSocial: social.unavailable,
    summary: context.summary,
    reviews: context.reviews,
  };
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif',
};

function mimeFromUrl(url: string): string {
  const ext = url.split(/[?#]/)[0].split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] || 'image/jpeg';
}

async function fetchVisionBytes(asset: SiteAsset, placePhotos: Record<string, { name?: string; authorAttributions?: Array<{ displayName?: string; uri?: string }> }>): Promise<VisionImage | null> {
  let buffer: Buffer;
  let mimeType: string;
  try {
    if (asset.provider === 'Google Maps') {
      const photo = placePhotos[asset.id];
      if (!photo?.name) return null;
      const response = await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1200`, {
        signal: AbortSignal.timeout(9000),
        headers: { 'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY },
      });
      if (!response.ok) return null;
      buffer = Buffer.from(await response.arrayBuffer());
      mimeType = (response.headers.get('content-type') || '').split(';')[0].trim() || 'image/jpeg';
    } else {
      if (!/^https?:\/\//i.test(asset.url)) return null;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);
      try {
        const response = await fetch(asset.url, { signal: controller.signal, redirect: 'follow', headers: { 'user-agent': IMAGE_USER_AGENT } });
        if (!response.ok) return null;
        buffer = Buffer.from(await response.arrayBuffer());
        mimeType = (response.headers.get('content-type') || '').split(';')[0].trim() || mimeFromUrl(asset.url);
      } finally {
        clearTimeout(timer);
      }
    }
  } catch {
    return null;
  }
  if (buffer.length === 0 || buffer.length > 1_200_000) return null;
  if (!/^image\/(jpeg|png|webp|gif|avif)$/i.test(mimeType)) return null;
  return { mimeType: mimeType.toLowerCase(), data: buffer.toString('base64') };
}

export async function collectImageBytes(assets: SiteAsset[], business: BusinessData): Promise<VisionImage[]> {
  const candidates = assets.slice(0, 6);
  const googleAssets = candidates.filter(asset => asset.provider === 'Google Maps');
  const placePhotos: Record<string, { name?: string }> = {};
  if (googleAssets.length && business.googlePlaceId && env.GOOGLE_MAPS_API_KEY) {
    try {
      const place = await googlePlacesService.getPlaceDetails(business.googlePlaceId, ['id', 'photos']);
      googleAssets.forEach((asset, index) => {
        const photo = place.photos?.[index];
        if (photo?.name) placePhotos[asset.id] = { name: photo.name };
      });
    } catch {
      /* segue sem fotos do Google para o Gemini */
    }
  }
  const settled = await Promise.allSettled(candidates.map(asset => fetchVisionBytes(asset, placePhotos)));
  const images = settled
    .flatMap(result => (result.status === 'fulfilled' && result.value ? [result.value] : []))
    .slice(0, 6);
  const totalBytes = images.reduce((sum, image) => sum + (image.data.length * 3) / 4, 0);
  return totalBytes > 3_500_000 ? images.slice(0, 3) : images;
}

async function resolveIntents(intents: ImageIntent[], usedUrls: Set<string>): Promise<Map<string, SiteAsset>> {
  const resolved = new Map<string, SiteAsset>();
  for (const intent of intents) {
    const results = await searchImages(intent.intent, 8).catch(() => []);
    const image = results.find(candidate => candidate.url && !usedUrls.has(candidate.url));
    if (!image) continue;
    resolved.set(intent.id, {
      id: `INTENT_${intent.id}`,
      url: image.url,
      alt: image.alt || intent.intent.slice(0, 120),
      credit: image.credit,
      creditUrl: image.creditUrl,
      provider: image.provider,
      kind: 'stock',
      usage: intent.usage,
      sourceType: 'stock',
      isBusinessAsset: false,
    });
    usedUrls.add(image.url);
  }
  return resolved;
}

export async function resolveSiteImages(
  files: ArtefactFiles,
  _business: BusinessData,
  assets: SiteAsset[],
  intents: ImageIntent[],
): Promise<ImageResolution> {
  const usedUrls = new Set<string>(assets.map(asset => asset.url));
  const intentsMap = await resolveIntents(intents, usedUrls);
  const imageMap: Record<string, SiteAsset> = {};
  for (const asset of assets) if (asset.id) imageMap[asset.id] = asset;
  for (const [id, asset] of intentsMap) {
    imageMap[id] = asset;
    imageMap[`INTENT_${id}`] = asset;
  }

  const filesOut: ArtefactFiles = {
    'index.html': replaceTokens(files['index.html'], imageMap),
    'styles.css': replaceTokens(files['styles.css'] || '', imageMap),
    'script.js': replaceTokens(files['script.js'] || '', imageMap),
  };
  return {
    files: filesOut,
    imageMap,
    assets: rankAssets(Object.values(imageMap), 20),
  };
}

export function replaceTokens(content: string, imageMap: Record<string, SiteAsset>): string {
  return content.replace(TOKEN, (_whole, id: string) => imageMap[id]?.url ?? TRANSPARENT_PIXEL);
}
