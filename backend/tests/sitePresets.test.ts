import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CLIMAS,
  GENERIC_PRESET,
  NICHO_PRESETS,
  PECAS,
  PECAS_SISTEMA,
  climaTheme,
  presetPrompt,
  resolveNiche,
  tokenToHex,
} from '../src/services/sitePresets';

test('climas replicam os quatro kits e convertem para hex válido', () => {
  assert.deepEqual(Object.keys(CLIMAS).sort(), ['clean', 'premium', 'sobrio', 'vibrante']);
  assert.equal(CLIMAS.vibrante.cores.primary, '16 85% 52%');
  assert.equal(CLIMAS.premium.fontes.display, 'Cormorant Garamond');
  assert.equal(tokenToHex('0 0% 100%'), '#ffffff');
  for (const clima of Object.values(CLIMAS)) {
    for (const token of Object.values(clima.cores)) assert.match(tokenToHex(token), /^#[0-9a-f]{6}$/);
  }
});

test('climaTheme entrega tema aceito pelo schema do documento', () => {
  const theme = climaTheme('vibrante');
  assert.equal(theme.background, '#ffffff');
  assert.equal(theme.font, 'sans');
  assert.ok(Number.isFinite(theme.radius));
  assert.match(theme.primary, /^#[0-9a-f]{6}$/);
  assert.equal(climaTheme('clean').font, 'serif');
});

test('resolveNiche escolhe o preset pelo nicho e cai no genérico', () => {
  assert.equal(resolveNiche('Restaurante').slug, 'restaurante');
  assert.equal(resolveNiche('Pizzaria').slug, 'pizzaria');
  assert.equal(resolveNiche('Barbearia').slug, 'beleza');
  assert.equal(resolveNiche('Oficina mecânica').slug, 'auto');
  assert.equal(resolveNiche('Dentista').slug, 'saude');
  assert.equal(resolveNiche('Marmoraria').slug, 'servicos');
  assert.equal(resolveNiche('Igreja').slug, GENERIC_PRESET.slug);
  assert.equal(resolveNiche().slug, GENERIC_PRESET.slug);
});

test('todos os presets referenciam peças existentes e mantêm header, hero e footer', () => {
  for (const preset of [...NICHO_PRESETS, GENERIC_PRESET]) {
    for (const key of preset.pecas) assert.ok(PECAS[key], `peça ausente: ${key}`);
    assert.ok(preset.pecas.includes('Nav'));
    assert.ok(preset.pecas.includes('Hero'));
    assert.ok(preset.pecas.includes('Footer'));
  }
  assert.deepEqual([...PECAS_SISTEMA], ['Agendamento', 'PainelAdmin']);
  assert.equal(PECAS.Nav.tipo, 'header');
  assert.equal(PECAS.Footer.tipo, 'footer');
});

test('presetPrompt lista clima e estrutura na ordem do preset', () => {
  const prompt = presetPrompt(resolveNiche('Restaurante'));
  assert.match(prompt, /Clima de marca obrigatório: Vibrante/);
  assert.match(prompt, /1\. Nav/);
  assert.match(prompt, /Cardapio/);
});
