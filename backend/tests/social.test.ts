import assert from 'node:assert/strict';
import { test } from 'node:test';
import { env } from '../src/config/env';
import { discoverSocial } from '../src/services/LeadSocialService';
import { collectImageBytes } from '../src/services/SiteImages';
import { rankAssets } from '../src/services/AssetRanking';
import type { BusinessData } from '../src/services/siteArtefactSchema';

function business(overrides: Partial<BusinessData> = {}): BusinessData {
  return { googlePlaceId: '', name: 'Empresa Teste', category: 'Restaurante', categories: ['Restaurante'], city: 'Teste', state: 'MT', country: 'Brasil', address: '', phone: '', whatsapp: '', website: '', rating: '', reviewCount: '', mapUrl: '', hours: '', ...overrides };
}

test('rede social sem credencial não é coletada por scraping', async () => {
  const original = globalThis.fetch; const token = env.FACEBOOK_ACCESS_TOKEN;
  globalThis.fetch = async () => { throw new Error('não deve chamar a rede'); };
  try {
    env.FACEBOOK_ACCESS_TOKEN = '';
    const result = await discoverSocial(business({ website: 'https://www.instagram.com/empresa.teste/' }));
    assert.equal(result.assets.length, 0);
    assert.equal(result.profiles.instagram, 'https://www.instagram.com/empresa.teste/');
    assert.deepEqual(result.unavailable, ['instagram']);
  } finally { globalThis.fetch = original; env.FACEBOOK_ACCESS_TOKEN = token; }
});

test('Facebook Graph API retorna capa e perfil oficiais', async () => {
  const original = globalThis.fetch; const token = env.FACEBOOK_ACCESS_TOKEN;
  globalThis.fetch = async input => {
    assert.match(String(input), /^https:\/\/graph\.facebook\.com\/v21\.0\/minhapagina/);
    return new Response(JSON.stringify({ link: 'https://www.facebook.com/minhapagina', picture: { data: { url: 'https://cdn.test/profile.jpg' } }, cover: { source: 'https://cdn.test/cover.jpg' } }));
  };
  try {
    env.FACEBOOK_ACCESS_TOKEN = 'test-token';
    const result = await discoverSocial(business({ website: 'https://www.facebook.com/minhapagina' }));
    assert.equal(result.assets.length, 2);
    assert.ok(result.assets.every(asset => asset.sourceType === 'social' && asset.isBusinessAsset));
    assert.equal(result.assets.find(asset => asset.id === 'FB_COVER')?.usage, 'hero');
  } finally { globalThis.fetch = original; env.FACEBOOK_ACCESS_TOKEN = token; }
});

test('ranking prioriza fotos reais do negócio e remove repetição', () => {
  const ranked = rankAssets([
    { id: 'stock', url: 'https://cdn.test/stock.jpg', alt: '', credit: '', creditUrl: '', provider: 'Pexels', kind: 'stock', usage: 'hero', sourceType: 'stock', isBusinessAsset: false },
    { id: 'real', url: 'https://cdn.test/real.jpg', alt: '', credit: '', creditUrl: '', provider: 'Google Maps', kind: 'storefront', usage: 'hero', sourceType: 'business', isBusinessAsset: true },
    { id: 'dup', url: 'https://cdn.test/stock.jpg?size=large', alt: '', credit: '', creditUrl: '', provider: 'Pexels', kind: 'stock', usage: 'gallery', sourceType: 'stock', isBusinessAsset: false },
  ]);
  assert.equal(ranked[0]?.id, 'real');
  assert.equal(ranked.length, 2);
});

test('coleciona bytes das imagens reais para o Gemini', async () => {
  const original = globalThis.fetch; const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  globalThis.fetch = async () => new Response(png, { status: 200, headers: { 'content-type': 'image/png' } });
  try {
    const vision = await collectImageBytes([{ id: 'REAL_0', url: 'https://cdn.test/logo.png', alt: 'logo', credit: 'Empresa', creditUrl: '', provider: 'Website da empresa', kind: 'logo', usage: 'logo', sourceType: 'business', isBusinessAsset: true }], business());
    assert.equal(vision.length, 1); assert.equal(vision[0].mimeType, 'image/png');
  } finally { globalThis.fetch = original; }
});
