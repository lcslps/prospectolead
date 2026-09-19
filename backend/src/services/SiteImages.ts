import { env } from '../config/env';
import { googlePlacesService } from './GooglePlacesService';
import { searchImages } from './UnsplashService';
import type { ArtefactFiles, BusinessData, ImageIntent, SiteAsset } from './siteArtefactSchema';

const TOKEN = /\{\{([A-Za-z0-9_-]+)\}\}/g;
const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

export interface ImageResolution {
  files: ArtefactFiles;
  imageMap: Record<string, SiteAsset>;
  assets: SiteAsset[];
}

function proxyUrl(baseUrl: string | undefined, placeId: string, index: number): string {
  const base = (baseUrl || '').replace(/\/+$/, '');
  return `${base}/api/websites/place-photo?placeId=${encodeURIComponent(placeId)}&index=${index}`;
}

export async function collectPlacePhotos(business: BusinessData, baseUrl?: string): Promise<SiteAsset[]> {
  if (!business.googlePlaceId || !env.GOOGLE_MAPS_API_KEY) return [];
  if (env.NODE_ENV === 'test') return [];
  try {
    const place = await googlePlacesService.getPlaceDetails(business.googlePlaceId, ['id', 'photos']);
    return (place.photos ?? []).slice(0, 8).map((photo, index) => ({
      id: `PHOTO_${index}`,
      url: proxyUrl(baseUrl, business.googlePlaceId!, index),
      alt: `Foto real de ${business.name}`,
      credit: photo.authorAttributions?.[0]?.displayName || 'Google Maps',
      creditUrl: photo.authorAttributions?.[0]?.uri || business.mapUrl || `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(business.googlePlaceId!)}`,
      provider: 'Google Maps',
    }));
  } catch {
    return [];
  }
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
    assets: Object.values(imageMap),
  };
}

export function replaceTokens(content: string, imageMap: Record<string, SiteAsset>): string {
  return content.replace(TOKEN, (_whole, id: string) => imageMap[id]?.url ?? TRANSPARENT_PIXEL);
}