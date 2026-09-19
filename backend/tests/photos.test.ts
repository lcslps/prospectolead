import assert from 'node:assert/strict';
import { before, test } from 'node:test';

process.env.PEXELS_API_KEY = 'test-pexels-key';
process.env.PIXABAY_API_KEY = 'test-pixabay-key';
process.env.UNSPLASH_ACCESS_KEY = 'test-unsplash-key';
let searchImages: typeof import('../src/services/UnsplashService').searchImages;
let replaceTokens: typeof import('../src/services/SiteImages').replaceTokens;
before(async () => {
  ({ searchImages } = await import('../src/services/UnsplashService'));
  ({ replaceTokens } = await import('../src/services/SiteImages'));
});

test('photo search prefers Pexels and retains author attribution', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.match(String(input), /^https:\/\/api\.pexels\.com\/v1\/search\?/);
    assert.equal((init?.headers as Record<string, string>).Authorization, 'test-pexels-key');
    return new Response(JSON.stringify({ photos: [{ alt: 'Restaurant food dining with sushi', photographer: 'Foto Autora', photographer_url: 'https://www.pexels.com/@foto-autora/', src: { large: 'https://images.pexels.com/sushi.jpg' } }] }));
  };
  try {
    const result = await searchImages(`restaurante-${crypto.randomUUID()}`, 6);
    assert.equal(result[0]?.provider, 'Pexels'); assert.equal(result[0]?.credit, 'Foto Autora');
    assert.equal(result[0]?.creditUrl, 'https://www.pexels.com/@foto-autora/');
  } finally { globalThis.fetch = original; }
});

test('empty Pexels search falls back to Pixabay and then Unsplash', async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async input => {
    calls.push(String(input));
    if (String(input).startsWith('https://api.pexels.com/')) return new Response(JSON.stringify({ photos: [{ alt: 'worker stocking a warehouse', src: { large: 'https://images.pexels.com/irrelevant.jpg' } }] }));
    if (String(input).startsWith('https://pixabay.com/')) return new Response(JSON.stringify({ hits: [{ largeImageURL: 'https://pixabay.com/photo.jpg', tags: 'granite marble slab countertop', user: 'Baker', user_id: 42 }] }));
    throw new Error('Unsplash should not run when Pixabay has results');
  };
  try {
    const result = await searchImages(`marmoraria-${crypto.randomUUID()}`);
    assert.equal(result[0]?.provider, 'Pixabay'); assert.equal(result[0]?.credit, 'Baker');
    assert.equal(calls.length, 2);
  } finally { globalThis.fetch = original; }
});

test('empty Pexels and Pixabay searches fall back to Unsplash', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async input => {
    if (String(input).startsWith('https://api.pexels.com/')) return new Response('{}', { status: 503 });
    if (String(input).startsWith('https://pixabay.com/')) return new Response('{}', { status: 503 });
    assert.match(String(input), /^https:\/\/api\.unsplash\.com\/search\/photos/);
    return new Response(JSON.stringify({ results: [{ urls: { raw: 'https://images.unsplash.com/food' }, alt_description: 'Polished granite marble countertop stone slabs', user: { name: 'Chef Photo', links: { html: 'https://unsplash.com/@chefphoto' } } }] }));
  };
  try {
    const result = await searchImages(`granito-${crypto.randomUUID()}`);
    assert.equal(result[0]?.provider, 'Unsplash'); assert.equal(result[0]?.credit, 'Chef Photo');
    assert.match(result[0]?.url || '', /w=1600/);
  } finally { globalThis.fetch = original; }
});

test('{{INTENT_<id>}} tokens resolve to real photos, never the transparent pixel', async () => {
  const pixel = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  const original = globalThis.fetch;
  globalThis.fetch = async input => {
    assert.match(String(input), /^https:\/\/api\.pexels\.com\/v1\/search\?/);
    return new Response(JSON.stringify({ photos: [{ alt: 'Polished granite marble countertop stone', photographer: 'Granite Photo', photographer_url: 'https://www.pexels.com/@granite-photo/', src: { large: 'https://images.pexels.com/hero.jpg' } }] }));
  };
  const html = `<img src="{{INTENT_hero-bg}}" alt="hero"><img src="{{PHOTO_0}}" alt="real">`;
  try {
    const resolved = await import('../src/services/SiteImages').then(m =>
      m.resolveSiteImages(
        { 'index.html': html, 'styles.css': `.hero{background:url('{{INTENT_hero-bg}}')}`, 'script.js': '' },
        { googlePlaceId: '', name: 'X', category: '', categories: [], city: '', state: '', country: 'Brasil', address: '', phone: '', whatsapp: '', website: '', rating: '', reviewCount: '', mapUrl: '', hours: '' },
        [{ id: 'PHOTO_0', url: 'https://maps.x/photo0.jpg', alt: 'foto real', credit: 'Google Maps', creditUrl: '', provider: 'Google Maps' }],
        [{ id: 'hero-bg', intent: 'hero granite marble stone', usage: 'hero' }],
      ),
    );
    const out = resolved.files['index.html'];
    const css = resolved.files['styles.css'];
    assert.ok(!out.includes(pixel), 'no transparent pixel should remain in HTML');
    assert.ok(!css.includes(pixel), 'no transparent pixel should remain in CSS');
    assert.match(out, /src="https:\/\/images\./);
    assert.match(out, /src="https:\/\/maps\.x\/photo0\.jpg/);
    assert.equal(resolved.imageMap['INTENT_hero-bg']?.provider, 'Pexels');
    assert.equal(resolved.imageMap['hero-bg']?.provider, 'Pexels');
  } finally { globalThis.fetch = original; }
});
