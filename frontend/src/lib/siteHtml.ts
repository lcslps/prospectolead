import type { SiteArtefact } from '../types/website';

function escapeInlineScript(value: string): string {
  return value.replace(/<\/script/gi, '<\\/script');
}

const GUARD_SCRIPT = `<script>document.addEventListener('click',function(e){var n=e.target;var a=n&&n.closest?n.closest('a[href]'):null;if(a){var h=(a.getAttribute('href')||'').trim();if(h.charAt(0)!=='#'){e.preventDefault();e.stopPropagation();}}},true);<\/script>`;

export function buildSiteDoc(artefact: SiteArtefact, opts: { interactive?: boolean } = {}): string {
  const index = artefact.files['index.html'];
  const cssTag = `<style>\n${artefact.files['styles.css'] || ''}\n</style>`;
  const scriptTagValue = artefact.files['script.js'] ? `<script>${escapeInlineScript(artefact.files['script.js'])}\n<\/script>` : '';
  const guardTagValue = opts.interactive === false ? GUARD_SCRIPT : '';
  const hasHtmlRoot = /<html[\s>]/i.test(index);

  let out = index;
  out = out.replace(/<link\b[^>]*\brel\s*=\s*["']?stylesheet["']?[^>]*\/?>/gi, '');
  out = out.replace(/<script\b[^>]*\bsrc\s*=[^>]*>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script\b[^>]*\bsrc\s*=[^>]*\/?>/gi, '');

  if (!hasHtmlRoot) {
    return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${cssTag}</head><body>${out}${scriptTagValue}${guardTagValue}</body></html>`;
  }

  out = out.replace(/<html\b([^>]*)>/i, (match, rest: string) => /\blang\s*=/i.test(rest) ? match : `<html lang="pt-BR"${rest}>`);
  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${cssTag}\n</head>`);
  else out = cssTag + out;
  if (scriptTagValue || guardTagValue) {
    if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${scriptTagValue}${guardTagValue}\n</body>`);
    else out += `${scriptTagValue}${guardTagValue}`;
  }
  return out;
}