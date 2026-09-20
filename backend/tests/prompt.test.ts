import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCreatePrompt } from '../src/services/SitePrompt';

const business = { name: 'Marmoraria Mundo dos Granitos', category: 'Marmoraria', city: 'Sorriso', state: 'MT', rating: '4.9', reviewCount: '78' };

test('prompt inclui fatos, reviews reais e uma skill adequada ao nicho', () => {
  const prompt = buildCreatePrompt({ business, assets: [], summary: 'Marmoraria que atua com bancadas de quartzo e granito.', reviews: [{ author: 'Maria Silva', rating: 5, text: 'Excelente atendimento, bancada ficou perfeita.', when: 'há 2 meses' }] });
  assert.match(prompt, /Maria Silva/); assert.match(prompt, /Excelente atendimento/);
  assert.match(prompt, /Google Places/); assert.match(prompt, /home-industrial/);
});

test('prompt sem reviews não introduz depoimentos inexistentes', () => {
  const prompt = buildCreatePrompt({ business, assets: [] });
  assert.ok(!prompt.includes('Maria Silva'));
  assert.match(prompt, /AVALIA/); assert.match(prompt, /N/);
});
