/**
 * Gera a fixture HTML do smoke test em browser real
 * (tests/fixtures/editor-smoke.html — fora do outputDir do Playwright).
 * O spec Playwright correspondente está em tests/editor-smoke.spec.ts.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildSiteDoc } from '../siteHtml';
import type { SiteArtefact } from '../../types/website';

const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==';

export function smokeArtefact(): SiteArtefact {
  return {
    format: 'html-standalone',
    files: {
      'index.html': `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Confeitaria Teste</title></head><body>
<section class="hero"><div class="wrap"><h1>Momentos doces</h1><p>Feitos com carinho todos os dias.</p>
<div class="actions" style="display:flex;gap:12px"><a class="wa" href="https://wa.me/5566999999999">Chamar no WhatsApp</a><a class="phone" href="tel:+5566996205890">(66) 99620-5890</a></div>
<img class="photo" src="${PIXEL}" alt="vitrine" width="320" height="200">
</div></section></body></html>`,
      'styles.css': '.hero{padding:48px}.actions{display:flex;gap:12px}.actions a{padding:12px 18px;background:#0e7490;color:#fff;border-radius:8px;text-decoration:none}',
      'script.js': '',
    },
    seo: { title: 'Confeitaria Teste', description: 'd', keywords: 'k' },
  };
}

describe('smoke fixture (browser real)', () => {
  it('gera tests/fixtures/editor-smoke.html com o bundle embarcado', () => {
    const out = resolve(dirname(fileURLToPath(import.meta.url)), '../../../tests/fixtures/editor-smoke.html');
    mkdirSync(dirname(out), { recursive: true });
    const html = buildSiteDoc(smokeArtefact(), { editable: true });
    expect(html).toContain('id="__site_edit_script"');
    writeFileSync(out, html);
  });
});
