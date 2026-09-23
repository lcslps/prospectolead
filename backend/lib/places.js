const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.location',
  'places.googleMapsUri',
  'places.primaryTypeDisplayName',
  'places.businessStatus',
  'nextPageToken',
].join(',');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Busca lugares via Places API (New) - Text Search, paginando até `limit`
 * resultados ou até a API não retornar mais páginas.
 */
export async function searchPlacesText({ apiKey, query, limit = 20 }) {
  const results = [];
  let pageToken;
  let guard = 0;

  while (results.length < limit && guard < 5) {
    guard += 1;
    const body = {
      textQuery: query,
      languageCode: 'pt-BR',
      maxResultCount: Math.min(20, limit - results.length),
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || `Places API retornou HTTP ${res.status}`;
      throw new Error(msg);
    }

    const places = Array.isArray(data.places) ? data.places : [];
    results.push(...places);

    if (data.nextPageToken && results.length < limit) {
      pageToken = data.nextPageToken;
      // o token só fica válido depois de alguns segundos
      await sleep(2000);
    } else {
      break;
    }
  }

  return results.slice(0, limit);
}

export function mapPlaceToLead(place, { niche, city, state }) {
  const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
  const hasSite = Boolean(place.websiteUri);
  return {
    placeId: place.id,
    name: place.displayName?.text || 'Sem nome',
    niche,
    city,
    state,
    address: place.formattedAddress || '',
    phone,
    email: '', // Places API não retorna e-mail
    hasSite,
    websiteUrl: place.websiteUri || '',
    rating: typeof place.rating === 'number' ? place.rating : null,
    reviewCount: place.userRatingCount || 0,
    googleMapsUri: place.googleMapsUri || '',
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
  };
}

export function scoreLead(lead) {
  let score = 35;
  if (typeof lead.rating === 'number') score += Math.round(lead.rating * 8); // até +40
  score += Math.min(lead.reviewCount || 0, 30); // até +30
  score += !lead.hasSite ? 20 : -15; // sem site = mais oportunidade
  if (lead.phone) score += 5;
  score = Math.max(0, Math.min(100, score));

  let tier = 'Frio';
  if (score >= 85) tier = 'Quente';
  else if (score >= 60) tier = 'Morno';

  return { score, tier };
}
