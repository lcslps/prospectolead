import type { SiteAsset } from './siteArtefactSchema';

const sourceWeight: Record<string, number> = {
  'Google Maps': 100,
  Facebook: 85,
  Instagram: 85,
  'Website da empresa': 80,
  Pexels: 45,
  Pixabay: 40,
  Unsplash: 35,
};

const useWeight: Record<string, number> = { hero: 18, gallery: 12, about: 10, logo: 16, product: 8, decor: 0 };

export function assetScore(asset: SiteAsset): number {
  const source = sourceWeight[asset.provider] ?? 20;
  const usage = useWeight[asset.usage] ?? 0;
  const real = asset.isBusinessAsset === false ? 0 : 15;
  const dimensions = asset.width && asset.height ? Math.min(10, Math.round((asset.width * asset.height) / 300_000)) : 0;
  return source + usage + real + dimensions;
}

export function rankAssets(assets: SiteAsset[], limit = 14): SiteAsset[] {
  const seen = new Set<string>();
  return assets
    .filter(asset => /^https?:\/\//i.test(asset.url) || asset.url.startsWith('/'))
    .map(asset => ({ ...asset, score: assetScore(asset) }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .filter(asset => {
      const key = asset.url.replace(/[?#].*$/, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}
