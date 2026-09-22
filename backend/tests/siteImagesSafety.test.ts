import assert from 'node:assert/strict';
import { test } from 'node:test';
import { enforceResolvedImages, placePhotoProxyUrl, replaceTokens } from '../src/services/SiteImages';
import { inspectArtifact } from '../src/services/SiteQuality';
import type { ArtefactFiles, SiteAsset } from '../src/services/siteArtefactSchema';

const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const verifiedAsset: SiteAsset = {
  id: 'PHOTO_0',
  url: 'https://assets.example.test/verified-business-photo.jpg',
  alt: 'Foto verificada do negocio',
  credit: 'Google Maps',
  creditUrl: '',
  provider: 'Google Maps',
  kind: 'storefront',
  usage: 'hero',
  sourceType: 'business',
  isBusinessAsset: true,
};

function artefact(html: string, css = '', script = ''): ArtefactFiles {
  return { 'index.html': html, 'styles.css': css, 'script.js': script };
}

test('resolved asset manifest replaces model-invented image URLs in HTML, CSS and image script assignments', () => {
  const invented = 'https://model.invalid/invented-hero.jpg';
  const out = enforceResolvedImages(
    artefact(
      '<main><img src="' + invented + '" alt="Hero"><div style="background-image:url(' + invented + ')"></div></main>',
      '.hero{background-image:url("' + invented + '")}',
      'const image = new Image(); image.src = "' + invented + '";',
    ),
    [verifiedAsset],
  );

  assert.ok(!out['index.html'].includes(invented));
  assert.ok(!out['styles.css'].includes(invented));
  assert.ok(!out['script.js'].includes(invented));
  assert.match(out['index.html'], /https:\/\/assets\.example\.test\/verified-business-photo\.jpg/);
  assert.match(out['styles.css'], /https:\/\/assets\.example\.test\/verified-business-photo\.jpg/);
  assert.match(out['script.js'], /https:\/\/assets\.example\.test\/verified-business-photo\.jpg/);
});

test('missing assets become an explicit visual fallback instead of a transparent or broken image', () => {
  const invented = 'https://model.invalid/no-image.jpg';
  const out = enforceResolvedImages(
    artefact('<main><img src="' + invented + '" alt="Ambiente"><img src="' + transparentPixel + '" alt="Pixel"></main>', '.hero{background:url(' + invented + ')}'),
    [],
  );

  assert.ok(!out['index.html'].includes(invented));
  assert.ok(!out['index.html'].includes(transparentPixel));
  assert.ok(!out['styles.css'].includes(invented));
  assert.match(out['index.html'], /site-image-fallback/);
  assert.match(out['styles.css'], /--site-image-fallback-paint/);
  assert.match(out['styles.css'], /var\(--site-image-fallback-paint\)/);
});

test('unresolved tokens cannot survive replacement inside an image source', () => {
  const tokenized = replaceTokens('<img src="{{INTENT_missing}}" alt="Imagem">', {});
  assert.match(tokenized, /__SITE_UNRESOLVED_ASSET_INTENT_missing__/);

  const out = enforceResolvedImages(artefact(tokenized), []);
  assert.ok(!out['index.html'].includes('__SITE_UNRESOLVED_ASSET_'));
  assert.match(out['index.html'], /site-image-fallback/);
});

test('Google Places proxy URL is absolute even when a request base URL is unavailable', () => {
  const url = placePhotoProxyUrl(undefined, 'place-abc', 2);
  const parsed = new URL(url);

  assert.match(url, /^https?:\/\//);
  assert.equal(parsed.pathname, '/api/websites/place-photo');
  assert.equal(parsed.searchParams.get('placeId'), 'place-abc');
  assert.equal(parsed.searchParams.get('index'), '2');
});

test('quality guard rejects old transparent pixel and unresolved asset markers', () => {
  const issues = inspectArtifact(artefact(
    '<!doctype html><html><head><title>Teste</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main><h1>Teste</h1><img src="' + transparentPixel + '" alt="pixel"></main><nav></nav><footer></footer></body></html>',
    ':root{--background:#ffffff;--text:#111111}.hero{background:url(__SITE_UNRESOLVED_ASSET_hero__)}@media(max-width:700px){.hero{display:grid}}',
  ));
  const codes = new Set(issues.map(issue => issue.code));

  assert.ok(codes.has('transparent_image_fallback'));
  assert.ok(codes.has('unresolved_asset_marker'));
});
