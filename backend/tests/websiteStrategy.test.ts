import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeBusinessForWebsite, buildAssetManifest, buildWebsiteGenerationContext, createCreativeBrief } from '../src/services/WebsiteStrategy';
import { auditArtifact } from '../src/services/SiteQuality';
import { enforceResolvedImages } from '../src/services/SiteImages';

const business = {
  googlePlaceId: 'place-1', name: 'Mundo dos Granitos', category: 'Marmoraria', categories: ['Marmoraria'],
  city: 'Sorriso', state: 'MT', country: 'Brasil', address: 'Rua Real, 10', phone: '(66) 99999-0000',
  whatsapp: 'https://wa.me/5566999990000', website: '', rating: '4.9', reviewCount: '78', mapUrl: 'https://maps.google.com/real', hours: '',
};

test('strategy creates a niche-specific brief without inventing missing facts', () => {
  const context = buildWebsiteGenerationContext(business, { profiles: {}, assets: [{ id: 'PHOTO_0', url: 'https://real.test/photo.jpg', alt: 'Fachada real', credit: 'Google', creditUrl: '', provider: 'Google Maps', kind: 'storefront', usage: 'hero', sourceType: 'business', isBusinessAsset: true }] });
  const analysis = analyzeBusinessForWebsite(context);
  const brief = createCreativeBrief(context, analysis);
  assert.match(brief.concept, /Precisão|Matéria/);
  assert.ok(analysis.missingFacts.includes('horários de atendimento'));
  assert.ok(!JSON.stringify(analysis).includes('10 anos'));
});

test('asset manifest prioritizes and labels real business photography', () => {
  const context = buildWebsiteGenerationContext(business, { profiles: {}, assets: [{ id: 'PHOTO_0', url: 'https://real.test/photo.jpg', alt: 'Fachada real', credit: 'Google', creditUrl: '', provider: 'Google Maps', kind: 'storefront', usage: 'hero', sourceType: 'business', isBusinessAsset: true }] });
  const manifest = buildAssetManifest(context);
  assert.equal(manifest.assets[0]?.role, 'REAL_BUSINESS_PHOTO');
  assert.deepEqual(manifest.allowedTokens, ['{{PHOTO_0}}']);
});

test('unknown model image URLs are replaced by a resolved asset', () => {
  const files = enforceResolvedImages({ 'index.html': '<img src="https://invented.test/fake.jpg" alt="Teste">', 'styles.css': '.hero{background:url("https://invented.test/bg.jpg")}', 'script.js': '' }, [{ id: 'PHOTO_0', url: 'https://real.test/photo.jpg', alt: 'Real', credit: '', creditUrl: '', provider: 'Google Maps', sourceType: 'business', isBusinessAsset: true }]);
  assert.ok(!files['index.html'].includes('invented.test'));
  assert.ok(!files['styles.css'].includes('invented.test'));
  assert.match(files['index.html'], /real\.test/);
});

test('premium audit catches responsive and accessibility omissions', () => {
  const audit = auditArtifact({ 'index.html': '<html><head><title>X</title><meta name="viewport" content="width=device-width"></head><body><nav></nav><main><h1>X</h1><img src="x.jpg"></main><footer></footer></body></html>', 'styles.css': ':root{--c:#000}.x{animation:fade 1s}', 'script.js': '' });
  assert.ok(audit.score < 84);
  assert.ok(audit.issues.some(issue => issue.code === 'missing_image_alt'));
  assert.ok(audit.dimensions.accessibility < 100);
});
