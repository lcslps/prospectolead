/**
 * Smoke test do editor visual em Chromium real (layout, pointer capture,
 * overlay, contenteditable). Requer a fixture gerada por:
 *   npx vitest run src/lib/siteEditor/editor-smoke-fixture.test.ts
 * ou pelo script `npm run test:smoke`.
 */
import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = pathToFileURL(resolve(here, './fixtures/editor-smoke.html')).href;

test.beforeEach(async ({ page }) => {
  await page.goto(FIXTURE);
  await expect(page.locator('.phone[data-editor-id]')).toBeAttached();
});

test('seleciona exatamente o telefone e mostra overlay alinhado', async ({ page }) => {
  await page.click('.phone');
  const box = page.locator('#__site_edit_box');
  await expect(box).toBeVisible();
  const aligned = await page.evaluate(() => {
    const phone = document.querySelector('.phone') as HTMLElement;
    const boxEl = document.querySelector('#__site_edit_box') as HTMLElement;
    const r = phone.getBoundingClientRect();
    return {
      left: Number.parseFloat(boxEl.style.left),
      top: Number.parseFloat(boxEl.style.top),
      rectLeft: r.left,
      rectTop: r.top,
    };
  });
  expect(Math.abs(aligned.left - aligned.rectLeft)).toBeLessThan(2);
  expect(Math.abs(aligned.top - aligned.rectTop)).toBeLessThan(2);
});

test('drag com mouse real move SÓ o telefone (vizinhos imóveis)', async ({ page }) => {
  const start = (await page.locator('.phone').boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 150, start.y + start.height / 2, { steps: 12 });
  await page.mouse.up();
  // Chromium normaliza translate3d(...,0) para (...,0px): compara normalizado.
  const Normalize = (value: string): string => value.replace(/\b0px\b/g, '0');
  expect(Normalize(await page.locator('.phone').evaluate(el => (el as HTMLElement).style.transform))).toBe('translate3d(150px, 0, 0)');
  expect(await page.locator('.wa').evaluate(el => (el as HTMLElement).style.transform)).toBe('');
  expect(await page.locator('.actions').evaluate(el => (el as HTMLElement).style.transform)).toBe('');
  await page.screenshot({ path: 'test-results/editor-smoke-drag.png' });
});

test('Ctrl+Z desfaz e Ctrl+Shift+Z refaz o movimento', async ({ page }) => {
  const start = (await page.locator('.phone').boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 120, start.y + start.height / 2, { steps: 8 });
  await page.mouse.up();
  const moved = await page.locator('.phone').evaluate(el => (el as HTMLElement).style.transform);
  expect(moved).toContain('translate3d(120px');
  await page.keyboard.press('Control+z');
  expect(await page.locator('.phone').evaluate(el => (el as HTMLElement).style.transform)).toBe('');
  await page.keyboard.press('Control+Shift+z');
  expect(await page.locator('.phone').evaluate(el => (el as HTMLElement).style.transform)).toBe(moved);
});

test('zoom do preview é compensado no drag e no overlay', async ({ page }) => {
  await page.evaluate(() => window.postMessage({ source: 'site-editor', type: 'viewport', zoom: 0.5, breakpoint: 'desktop' }, '*'));
  const rect = (await page.locator('.phone').boundingBox())!;
  const start = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 100, start.y, { steps: 8 });
  await page.mouse.up();
  // 100px de mouse com zoom 50% => 200px no layout.
  expect((await page.locator('.phone').evaluate(el => (el as HTMLElement).style.transform)).replace(/\b0px\b/g, '0')).toBe('translate3d(200px, 0, 0)');
  const aligned = await page.evaluate(() => {
    const phone = document.querySelector('.phone') as HTMLElement;
    const boxEl = document.querySelector('#__site_edit_box') as HTMLElement;
    const r = phone.getBoundingClientRect();
    return { left: Number.parseFloat(boxEl.style.left), rectLeft: r.left / 0.5 };
  });
  expect(Math.abs(aligned.left - aligned.rectLeft)).toBeLessThan(2);
});

test('edição inline de texto com undo', async ({ page }) => {
  await page.click('h1');
  await expect(page.locator('h1[contenteditable="true"]')).toBeAttached();
  const before = (await page.locator('h1').textContent()) ?? '';
  await page.keyboard.type(' INESQUECÍVEL');
  const typed = (await page.locator('h1').textContent()) ?? '';
  expect(typed).toContain('INESQUECÍVEL');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+z');
  expect(await page.locator('h1').textContent()).toBe(before);
});

test('serialize gera HTML limpo com estado preservado', async ({ page }) => {
  const start = (await page.locator('.phone').boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 60, start.y, { steps: 5 });
  await page.mouse.up();
  const html = await page.evaluate(
    () =>
      new Promise<string>((resolvePromise, rejectPromise) => {
        const timer = setTimeout(() => rejectPromise(new Error('serialize sem resposta')), 5000);
        window.addEventListener('message', event => {
          const data = event.data as { source?: string; type?: string; html?: string };
          if (data?.source === 'site-edit' && data.type === 'serialized' && data.html) {
            clearTimeout(timer);
            resolvePromise(data.html);
          }
        });
        window.postMessage({ source: 'site-editor', type: 'serialize' }, '*');
      }),
  );
  expect(html).toContain('data-editor-id');
  expect(html).toContain('__site_editor_state');
  expect(html).toContain('"x":60');
  expect(html).not.toContain('__site_edit_script');
  expect(html).not.toContain('__site_edit_root');
  expect(html).not.toContain('translate3d');
});
