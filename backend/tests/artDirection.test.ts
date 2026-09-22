import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createArtDirectionPlan, classifyVisualNiche, visualSkillFiles } from '../src/services/ArtDirection';
import { browserVisualIssues, type BrowserVisualQA } from '../src/services/VisualRenderQA';
import { assessVisualQuality } from '../src/services/VisualQuality';
import { analyzeBusinessForWebsite, buildWebsiteGenerationContext } from '../src/services/WebsiteStrategy';

function contextFor(name: string, category: string, summary = '') {
  return buildWebsiteGenerationContext({
    googlePlaceId: `place-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name,
    category,
    categories: [category],
    city: 'Sorriso',
    state: 'MT',
    country: 'Brasil',
    address: 'Rua Verificada, 100',
    phone: '(66) 99999-0000',
    whatsapp: 'https://wa.me/5566999990000',
    website: '',
    rating: '',
    reviewCount: '',
    mapUrl: 'https://maps.google.com/?q=Sorriso',
    hours: '',
  }, {
    assets: [{
      id: 'PHOTO_0',
      url: 'https://images.example.test/business.jpg',
      alt: `Foto real de ${name}`,
      credit: 'Google Maps',
      creditUrl: '',
      provider: 'Google Maps',
      kind: 'storefront',
      usage: 'hero',
      sourceType: 'business',
      isBusinessAsset: true,
    }],
    profiles: {},
    summary,
  });
}

test('art direction classifies distinct niches into distinct visual grammars', () => {
  const cases = [
    ['Residencial Alto Padrão', 'Imobiliária de imóveis de luxo', 'luxury_real_estate'],
    ['Brasa Burger', 'Hamburgueria artesanal', 'burger_restaurant'],
    ['Sol Vivo', 'Energia solar fotovoltaica', 'solar_energy'],
    ['Fortline', 'Segurança eletrônica e monitoramento', 'electronic_security'],
    ['Patas & Cia', 'Clínica veterinária', 'veterinary'],
  ] as const;

  const plans = cases.map(([name, category, expectedArchetype]) => {
    const context = contextFor(name, category);
    assert.equal(classifyVisualNiche(context).primaryArchetype, expectedArchetype);
    return createArtDirectionPlan(context, analyzeBusinessForWebsite(context));
  });

  assert.deepEqual(plans.map(plan => plan.primaryArchetype), cases.map(([, , archetype]) => archetype));
  assert.equal(new Set(plans.map(plan => plan.imageDirection.subject)).size, plans.length);
  assert.equal(new Set(plans.map(plan => plan.typographyStrategy.display)).size >= 3, true);
  assert.ok(visualSkillFiles(plans[2]).includes('niches/solar.md'));
  assert.ok(visualSkillFiles(plans[3]).includes('niches/security.md'));
  assert.ok(visualSkillFiles(plans[4]).includes('niches/veterinary.md'));
});

test('art direction stays strategic and does not turn unknown services into facts', () => {
  const context = contextFor('Odonto Centro', 'Clínica odontológica');
  const analysis = analyzeBusinessForWebsite(context);
  const plan = createArtDirectionPlan(context, analysis);
  const serialized = JSON.stringify(plan).toLocaleLowerCase('pt-BR');

  assert.equal(plan.businessPositioning, analysis.positioning);
  assert.equal(plan.conversionStrategy, analysis.primaryGoal);
  assert.ok(!serialized.includes('implante'));
  assert.ok(!serialized.includes('clareamento'));
  assert.ok(!serialized.includes('anos de experi'));
});

test('visual quality critic rejects a generic, incomplete site artifact', () => {
  const context = contextFor('Sol Vivo', 'Energia solar fotovoltaica');
  const plan = createArtDirectionPlan(context, analyzeBusinessForWebsite(context));
  const report = assessVisualQuality({
    'index.html': '<html><body><main><section><h1>Qualidade e excelência</h1><p>Soluções personalizadas.</p><a href="#">Saiba mais sobre nossos serviços</a></section></main></body></html>',
    'styles.css': 'body { font-family: Arial, sans-serif; } .card { border-radius: 24px; }',
    'script.js': '',
  }, plan, []);

  assert.equal(report.needsRefinement, true);
  assert.ok(report.score < 8.5);
  assert.ok(report.issues.some(issue => issue.code === 'visual_missing_hero'));
  assert.ok(report.issues.some(issue => issue.code === 'visual_generic_copy'));
  assert.ok(report.issues.some(issue => issue.code === 'visual_incomplete_breakpoints'));
});

test('browser visual issue mapping identifies overflow, broken images and weak mobile hierarchy', () => {
  const result: BrowserVisualQA = {
    available: true,
    views: [
      { width: 1280, overflow: false, contentHeight: 1800, heroHeight: 560, ctaVisible: true, brokenImages: 0, imageCount: 4 },
      { width: 768, overflow: false, contentHeight: 1900, heroHeight: 430, ctaVisible: false, brokenImages: 0, imageCount: 4 },
      { width: 390, overflow: true, contentHeight: 2200, heroHeight: 220, ctaVisible: false, brokenImages: 1, imageCount: 4 },
    ],
  };

  const codes = browserVisualIssues(result).map(issue => issue.code);
  assert.ok(codes.includes('render_horizontal_overflow'));
  assert.ok(codes.includes('render_broken_image'));
  assert.ok(codes.includes('render_mobile_hero_weak'));
  assert.ok(codes.includes('render_tablet_cta_hidden'));
});

test('browser visual issue mapping degrades safely when browser QA is unavailable', () => {
  const issues = browserVisualIssues({ available: false, error: 'Chromium missing', views: [] });
  assert.deepEqual(issues.map(issue => issue.code), ['visual_browser_qa_unavailable']);
});
