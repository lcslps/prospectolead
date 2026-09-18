import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { resolveNiche } from '../src/services/sitePresets';
import { auditDocument, guardDocument } from '../src/services/QualityGuard';
import { documentSchema } from '../src/services/websiteSchema';

test('Elétrica Lucas com categoria "Loja" e nicho "Energia solar" resolve para elétrica/motores, não comércio genérico', () => {
  const preset = resolveNiche(
    'Loja',
    'Energia solar',
    'Loja',
    'Elétrica Lucas | Motores | Geradores | Bombas de piscina | Bombas Submersas | Motobombas',
  );
  assert.equal(preset.slug, 'eletrico');
  assert.match(preset.imageHints.hero, /motor|gerador/i);
  assert.equal(preset.ctaLabel, 'Solicitar orçamento');
});

test('guarda Documento remove seções vazias e mantém as obrigatórias', () => {
  const doc = documentSchema.parse({
    name: 'Elétrica Lucas',
    theme: {},
    business: { name: 'Elétrica Lucas', category: 'Loja' },
    sections: [
      { id: 'header', type: 'header', content: {} },
      { id: 'hero', type: 'hero', content: { title: '' } },
      { id: 'services', type: 'services', content: { title: 'Nossos Produtos' } },
      { id: 'about', type: 'about', content: { title: 'Sobre', text: 'Trabalhamos com motores e geradores.' } },
      { id: 'gallery', type: 'gallery', content: { title: 'Galeria' } },
      { id: 'footer', type: 'footer', content: {} },
    ],
  });
  const guarded = guardDocument(doc);
  assert.deepEqual(guarded.sections.map(s => s.type), ['header', 'hero', 'about', 'footer']);
  assert.equal(guarded.sections.find(s => s.type === 'hero')?.content.title, 'Elétrica Lucas');
  assert.deepEqual(auditDocument(guarded), []);
});

test('auditoria acusa seções vazias, itens vazios e imagens repetidas', () => {
  const doc = documentSchema.parse({
    name: 'Marmoraria Atlas',
    theme: {},
    business: { name: 'Marmoraria Atlas', category: 'Marmoraria' },
    sections: [
      { id: 'header', type: 'header', content: {} },
      { id: 'hero', type: 'hero', content: { title: 'Mármores e granitos' } },
      { id: 'services', type: 'services', content: { title: 'Serviços', items: [{ title: 'Pia', image: 'https://x.photo/1' }, { title: '', image: '' }] } },
      { id: 'gallery', type: 'gallery', content: { image: 'https://x.photo/1', items: [{ title: '', image: 'https://x.photo/1' }] } },
      { id: 'footer', type: 'footer', content: {} },
    ],
  });
  const issues = auditDocument(doc);
  assert.ok(issues.some(i => i.startsWith('secao_vazia') || i.startsWith('item_vazio')));
  assert.ok(issues.filter(i => i.startsWith('imagem_repetida')).length >= 2);
  const guarded = guardDocument(doc);
  const services = guarded.sections.find(s => s.type === 'services');
  assert.ok(services);
  assert.deepEqual(services!.content.items.length, 1);
  for (const section of guarded.sections) {
    assert.ok(!section.content.image || section.content.image !== 'https://x.photo/1' || section.type === 'services');
  }
});

test('imagens fora do tema são descartadas e as coerentes são mantidas', async () => {
  process.env.PEXELS_API_KEY = 'test-pexels-key';
  process.env.PIXABAY_API_KEY = '';
  process.env.UNSPLASH_ACCESS_KEY = '';
  const { searchImages } = await import('../src/services/UnsplashService');
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ photos: [
    { alt: 'industrial electric motor engine parts', src: { large: 'https://images.pexels.com/motor.jpg' } },
    { alt: 'person playing electric guitar on stage', src: { large: 'https://images.pexels.com/guitar.jpg' } },
    { alt: 'orange scooter on street at sunset', src: { large: 'https://images.pexels.com/scooter.jpg' } },
    { alt: 'womens fashion clothing rack in store', src: { large: 'https://images.pexels.com/clothes.jpg' } },
  ] }));
  try {
    const result = await searchImages(`motor ${randomUUID()}`, 6);
    assert.equal(result.length, 1);
    assert.equal(result[0]?.url, 'https://images.pexels.com/motor.jpg');
    assert.equal(result[0]?.provider, 'Pexels');
  } finally { globalThis.fetch = original; }
});