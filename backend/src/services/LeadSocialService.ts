import { env } from '../config/env';
import type { BusinessData, SiteAsset } from './siteArtefactSchema';

const MAX_ASSETS = 8;
const FACEBOOK_GRAPH_VERSION = 'v21.0';
const TIMEOUT_MS = 9000;

export interface SocialProfiles { instagram?: string; facebook?: string; }
export interface SocialDiscovery { assets: SiteAsset[]; profiles: SocialProfiles; unavailable: Array<'facebook' | 'instagram'>; }

function socialAsset(id: string, url: string, alt: string, provider: 'Facebook' | 'Instagram', kind: string, usage: string, creditUrl: string): SiteAsset {
  return { id, url, alt, credit: provider, creditUrl, provider, kind, usage, sourceType: 'social', isBusinessAsset: true };
}
function host(url: string): string { try { return new URL(url).hostname.replace(/^www\.|^m\./, ''); } catch { return ''; } }
function isFacebook(url: string): boolean { return ['facebook.com', 'fb.com'].includes(host(url)); }
function isInstagram(url: string): boolean { return host(url) === 'instagram.com'; }
function facebookPage(url: string): string | null {
  if (!isFacebook(url)) return null;
  const value = new URL(url).pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
  return value && !/^(share|photo|watch|reel|groups)$/i.test(value) ? value : null;
}
function instagramUsername(url: string): string | null {
  if (!isInstagram(url)) return null;
  const value = new URL(url).pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
  return value && !/^(p|reel|explore|stories)$/i.test(value) ? value : null;
}

async function graph(path: string, params: Record<string, string>): Promise<unknown | null> {
  if (!env.FACEBOOK_ACCESS_TOKEN) return null;
  const query = new URLSearchParams({ ...params, access_token: env.FACEBOOK_ACCESS_TOKEN });
  try {
    const response = await fetch(`https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${path}?${query}`, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: 'application/json' } });
    return response.ok ? await response.json() : null;
  } catch { return null; }
}

async function facebookAssets(page: string): Promise<SiteAsset[]> {
  const data = await graph(encodeURIComponent(page), { fields: 'picture.type(large),cover{source},link' }) as { picture?: { data?: { url?: string } }; cover?: { source?: string }; link?: string } | null;
  if (!data) return [];
  const creditUrl = data.link || `https://www.facebook.com/${page}`;
  const assets: SiteAsset[] = [];
  if (data.picture?.data?.url) assets.push(socialAsset('FB_PROFILE', data.picture.data.url, 'Foto de perfil oficial no Facebook', 'Facebook', 'logo', 'logo', creditUrl));
  if (data.cover?.source) assets.push(socialAsset('FB_COVER', data.cover.source, 'Imagem de capa oficial no Facebook', 'Facebook', 'cover', 'hero', creditUrl));
  return assets;
}

async function instagramAssets(username: string): Promise<SiteAsset[]> {
  if (!env.INSTAGRAM_BUSINESS_ACCOUNT_ID) return [];
  const fields = `business_discovery.username(${username}){profile_picture_url,media.limit(${MAX_ASSETS}){media_type,media_url,thumbnail_url,caption,permalink}}`;
  const data = await graph(encodeURIComponent(env.INSTAGRAM_BUSINESS_ACCOUNT_ID), { fields }) as { business_discovery?: { profile_picture_url?: string; media?: { data?: Array<{ media_type?: string; media_url?: string; thumbnail_url?: string; caption?: string; permalink?: string }> } } } | null;
  const discovery = data?.business_discovery;
  if (!discovery) return [];
  const page = `https://www.instagram.com/${username}/`;
  const assets: SiteAsset[] = [];
  if (discovery.profile_picture_url) assets.push(socialAsset('IG_PROFILE', discovery.profile_picture_url, 'Foto de perfil oficial no Instagram', 'Instagram', 'logo', 'logo', page));
  for (const [index, media] of (discovery.media?.data ?? []).entries()) {
    const url = media.media_type === 'VIDEO' ? media.thumbnail_url : media.media_url;
    if (!url) continue;
    assets.push(socialAsset(`IG_MEDIA_${index}`, url, media.caption?.slice(0, 180) || 'Publicação oficial no Instagram', 'Instagram', 'gallery', index === 0 ? 'hero' : 'gallery', media.permalink || page));
  }
  return assets;
}

/** Apenas APIs oficiais. Nunca faz scraping, leitura de meta tags ou bypass de login em redes sociais. */
export async function discoverSocial(business: BusinessData): Promise<SocialDiscovery> {
  const website = business.website || '';
  const profiles: SocialProfiles = {};
  const unavailable: Array<'facebook' | 'instagram'> = [];
  const jobs: Promise<SiteAsset[]>[] = [];
  if (isFacebook(website)) {
    profiles.facebook = website;
    const page = facebookPage(website);
    if (page && env.FACEBOOK_ACCESS_TOKEN) jobs.push(facebookAssets(page)); else unavailable.push('facebook');
  }
  if (isInstagram(website)) {
    profiles.instagram = website;
    const username = instagramUsername(website);
    if (username && env.FACEBOOK_ACCESS_TOKEN && env.INSTAGRAM_BUSINESS_ACCOUNT_ID) jobs.push(instagramAssets(username)); else unavailable.push('instagram');
  }
  const settled = await Promise.allSettled(jobs);
  const seen = new Set<string>();
  const assets = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []).filter(asset => {
    if (seen.has(asset.url)) return false; seen.add(asset.url); return true;
  }).slice(0, MAX_ASSETS);
  return { assets, profiles, unavailable };
}

export const leadSocialService = { discover: discoverSocial };
