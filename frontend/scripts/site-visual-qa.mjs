/*
 * Browser-side QA for a generated artefact. Invoked by the backend only when
 * VISUAL_QA_ENABLED is on. JavaScript is disabled in the page context so this
 * measures layout and assets without executing model-produced script.
 */
import { chromium } from 'playwright';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', async () => {
  try {
    const payload = JSON.parse(raw);
    const result = await inspect(payload.files, Boolean(payload.includeScreenshots));
    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    process.stdout.write(JSON.stringify({ available: false, error: error instanceof Error ? error.message : 'visual QA failed', views: [] }));
  }
});

function documentFor(files) {
  const css = String(files?.['styles.css'] || '').replace(/<\/style/gi, '<\\/style');
  let html = String(files?.['index.html'] || '');
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<script\b[^>]*\/>/gi, '');
  html = html.replace(/<link\b[^>]*\brel\s*=\s*["']?stylesheet["']?[^>]*>/gi, '');
  const style = `<style>${css}</style>`;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${style}</head>`);
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${style}</head><body>${html}</body></html>`;
}

async function inspect(files, includeScreenshots) {
  const browser = await chromium.launch({ headless: true });
  try {
    const views = [];
    for (const width of [1440, 1280, 1024, 768, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false, deviceScaleFactor: 1 });
      const page = await context.newPage();
      await page.setContent(documentFor(files), { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(180);
      const metrics = await page.evaluate(() => {
        const html = document.documentElement;
        const body = document.body;
        const hero = document.querySelector('[id="hero"], .hero, header + main > section');
        const action = Array.from(document.querySelectorAll('a[href], button')).find(element => {
          const rect = element.getBoundingClientRect();
          return rect.width > 28 && rect.height > 24 && getComputedStyle(element).visibility !== 'hidden';
        });
        const images = Array.from(document.images).map(image => ({ src: image.currentSrc || image.src, complete: image.complete, width: image.naturalWidth, height: image.naturalHeight }));
        const overflow = Math.max(html.scrollWidth, body.scrollWidth) > window.innerWidth + 2;
        const heroRect = hero?.getBoundingClientRect();
        const actionRect = action?.getBoundingClientRect();
        return {
          overflow,
          contentHeight: Math.max(html.scrollHeight, body.scrollHeight),
          heroHeight: heroRect ? Math.round(heroRect.height) : 0,
          ctaVisible: Boolean(actionRect && actionRect.bottom > 0 && actionRect.top < window.innerHeight && actionRect.left >= -2 && actionRect.right <= window.innerWidth + 2),
          brokenImages: images.filter(image => image.src && image.complete && image.width === 0).length,
          imageCount: images.length,
        };
      });
      const screenshot = includeScreenshots && (width === 1280 || width === 390)
        ? (await page.screenshot({ type: 'jpeg', quality: 72, fullPage: false })).toString('base64')
        : undefined;
      views.push({ width, ...metrics, ...(screenshot ? { screenshot } : {}) });
      await context.close();
    }
    return { available: true, views };
  } finally {
    await browser.close();
  }
}
