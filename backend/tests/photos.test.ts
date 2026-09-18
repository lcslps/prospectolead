import assert from 'node:assert/strict';
import { before, test } from 'node:test';

process.env.PEXELS_API_KEY = 'test-pexels-key';
process.env.PIXABAY_API_KEY = 'test-pixabay-key';
process.env.UNSPLASH_ACCESS_KEY = 'test-unsplash-key';
let searchImages: typeof import('../src/services/UnsplashService').searchImages;
before(async () => { ({ searchImages } = await import('../src/services/UnsplashService')); });

test('photo search prefers Pexels and retains author attribution', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.match(String(input), /^https:\/\/api\.pexels\.com\/v1\/search\?/);
    assert.equal((init?.headers as Record<string, string>).Authorization, 'test-pexels-key');
    return new Response(JSON.stringify({ photos: [{ alt: 'Sushi artesanal', photographer: 'Foto Autora', photographer_url: 'https://www.pexels.com/@foto-autora/', src: { large: 'https://images.pexels.com/sushi.jpg' } }] }));
  };
  try {
    const result = await searchImages(`pexels-${crypto.randomUUID()}`, 6);
    assert.equal(result[0]?.provider, 'Pexels'); assert.equal(result[0]?.credit, 'Foto Autora');
    assert.equal(result[0]?.creditUrl, 'https://www.pexels.com/@foto-autora/');
  } finally { globalThis.fetch = original; }
});

test('empty Pexels search falls back to Pixabay and then Unsplash', async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async input => {
    calls.push(String(input));
    if (String(input).startsWith('https://api.pexels.com/')) return new Response('{}', { status: 503 });
    if (String(input).startsWith('https://pixabay.com/')) return new Response(JSON.stringify({ hits: [{ largeImageURL: 'https://pixabay.com/photo.jpg', tags: 'fresh bread', user: 'Baker', user_id: 42 }] }));
    throw new Error('Unsplash should not run when Pixabay has results');
  };
  try {
    const result = await searchImages(`pixabay-${crypto.randomUUID()}`);
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
    return new Response(JSON.stringify({ results: [{ urls: { raw: 'https://images.unsplash.com/food' }, alt_description: 'Pasta fresca', user: { name: 'Chef Photo', links: { html: 'https://unsplash.com/@chefphoto' } } }] }));
  };
  try {
    const result = await searchImages(`unsplash-${crypto.randomUUID()}`);
    assert.equal(result[0]?.provider, 'Unsplash'); assert.equal(result[0]?.credit, 'Chef Photo');
    assert.match(result[0]?.url || '', /w=1600/);
  } finally { globalThis.fetch = original; }
});
