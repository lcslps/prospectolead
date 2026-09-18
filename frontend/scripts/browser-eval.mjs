import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const get = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const cdp = get('--cdp') || process.env.BROWSER_CDP || 'http://localhost:9222';
const goto = get('--goto');
const file = get('--file');
const code = file ? readFileSync(file, 'utf8') : get('--js') || 'document.title';
const wait = Number(get('--wait') || 1500);
const timeout = Number(get('--timeout') || 45000);

const browser = await chromium.connectOverCDP(cdp);
const ctx = browser.contexts()[0] ?? (await browser.newContext());
const page = ctx.pages().find((p) => !p.isClosed()) ?? (await ctx.newPage());

if (goto) {
  await page.goto(goto, { waitUntil: 'domcontentloaded', timeout });
  await page.waitForTimeout(wait);
}

try {
  const result = await page.evaluate(code);
  console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`ERRO: ${error.message}`);
  process.exitCode = 1;
} finally {
  process.exit(process.exitCode ?? 0);
}
