import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildCreatePrompt } from '../src/services/SitePrompt';
import { professionalSkills, selectedSkillFiles } from '../src/services/PromptLibrary';
import { selectedCodemakersReferenceFiles } from '../src/services/CodemakersDesign';

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

test('skills essenciais ficam separadas das skills visuais e de nicho', () => {
  const essential = professionalSkills();
  const solar = selectedSkillFiles('Empresa de energia solar fotovoltaica');
  const veterinary = selectedSkillFiles('Clinica veterinaria');
  assert.match(essential, /data-integrity\.md/);
  assert.match(essential, /images\.md/);
  assert.ok(!essential.includes('art-director.md'));
  assert.ok(solar.includes('art-director.md'));
  assert.ok(solar.includes('niche-solar-energy.md'));
  assert.ok(solar.includes('home-industrial.md'));
  assert.ok(!solar.includes('niche-food-campaign.md'));
  assert.ok(veterinary.includes('niche-veterinary-pet.md'));
});

test('CodeMakers references are selected by category instead of loading every reference', () => {
  const solar = selectedCodemakersReferenceFiles('Energia solar');
  const veterinary = selectedCodemakersReferenceFiles('Clinica veterinaria');
  assert.ok(solar.includes('implementation-recipes.md'));
  assert.ok(solar.includes('motion-choreography.md'));
  assert.ok(!solar.includes('interaction-accessibility.md'));
  assert.ok(veterinary.includes('interaction-accessibility.md'));
  assert.ok(!veterinary.includes('implementation-recipes.md'));
  assert.ok(solar.length < 11);
  assert.ok(veterinary.length < 11);
});
