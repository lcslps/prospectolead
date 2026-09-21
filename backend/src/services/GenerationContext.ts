import type { BusinessData, SiteAsset } from './siteArtefactSchema';
import type { ReviewEntry } from './SiteImages';

const limit = (value: string | undefined, size: number) => (value || '').trim().slice(0, size);

/** Contexto compacto e determinístico para a chamada criativa principal. */
export function compactGenerationContext(input: {
  business: BusinessData;
  assets: SiteAsset[];
  summary?: string;
  reviews?: ReviewEntry[];
  notes?: string | null;
}) {
  const assets = input.assets
    .filter(asset => asset.usage === 'hero' || asset.usage === 'gallery' || asset.usage === 'logo')
    .slice(0, 6)
    .map(asset => ({ ...asset, alt: limit(asset.alt, 140), credit: limit(asset.credit, 80) }));
  const reviews = (input.reviews ?? []).slice(0, 3).map(review => ({ ...review, author: limit(review.author, 70), text: limit(review.text, 280) }));
  return {
    business: { ...input.business, address: limit(input.business.address, 180), hours: limit(input.business.hours, 300) },
    assets,
    summary: limit(input.summary, 700) || undefined,
    reviews,
    notes: limit(input.notes || undefined, 400) || undefined,
    estimatedChars: JSON.stringify({ business: input.business, assets, summary: limit(input.summary, 700), reviews }).length,
  };
}
