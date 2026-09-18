import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const profileDir = process.env.BROWSER_PROFILE || path.resolve(here, '..', '..', '.browser-profile');
const url = process.argv[2] || 'http://localhost:5173';
const port = process.env.BROWSER_DEBUG_PORT || '9222';
const channel = process.env.BROWSER_CHANNEL || 'chrome';

mkdirSync(profileDir, { recursive: true });

const context = await chromium.launchPersistentContext(profileDir, {
  headless: false,
  channel,
  viewport: null,
  locale: 'pt-BR',
  timezoneId: 'America/Sao_Paulo',
  ignoreDefaultArgs: ['--enable-automation'],
  args: [
    '--start-maximized',
    `--remote-debugging-port=${port}`,
    '--disable-blink-features=AutomationControlled',
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

await context.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
});

const page = context.pages()[0] ?? (await context.newPage());
await page.goto(url).catch(() => {});

console.log(`Navegador de testes aberto em ${url}`);
console.log(`Perfil persistente: ${profileDir}`);
console.log(`Depuracao (CDP): http://localhost:${port}`);
console.log('Feche a janela do navegador para encerrar.');

await new Promise((resolve) => context.on('close', resolve));
