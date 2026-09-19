import type { SiteArtefact } from '../types/website';

function escapeInlineScript(value: string): string {
  return value.replace(/<\/script/gi, '<\\/script');
}

const ANCHOR_SCRIPT = `<script>document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!t)return;var h=(t.getAttribute('href')||'').trim();if(h.charAt(0)==='#'){e.preventDefault();var id=h.slice(1);var el=id?document.getElementById(id):null;if(el){var y=el.getBoundingClientRect().top+(window.pageYOffset||0);window.scrollTo({top:Math.max(0,y),behavior:'smooth'});}else{window.scrollTo({top:0,behavior:'smooth'});}return;}if(/^(https?:|tel:|mailto:)/i.test(h)){e.preventDefault();e.stopPropagation();var a=document.createElement('a');a.href=t.href;a.target='_blank';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();a.remove();}},true);<\/script>`;
const GUARD_SCRIPT = `<script>document.addEventListener('click',function(e){var n=e.target;var a=n&&n.closest?n.closest('a[href]'):null;if(a){var h=(a.getAttribute('href')||'').trim();if(h.charAt(0)!=='#'){e.preventDefault();e.stopPropagation();}}},true);<\/script>`;

export function buildSiteDoc(artefact: SiteArtefact, opts: { interactive?: boolean } = {}): string {
  const index = artefact.files['index.html'];
  const cssTag = `<style>\n${artefact.files['styles.css'] || ''}\n</style>`;
  const scriptTagValue = artefact.files['script.js'] ? `<script>${escapeInlineScript(artefact.files['script.js'])}\n<\/script>` : '';
  const guardTagValue = opts.interactive === false ? GUARD_SCRIPT : '';
  const anchorTagValue = ANCHOR_SCRIPT;
  const hasHtmlRoot = /<html[\s>]/i.test(index);

  let out = index;
  out = out.replace(/<link\b[^>]*\brel\s*=\s*["']?stylesheet["']?[^>]*\/?>/gi, '');
  out = out.replace(/<script\b[^>]*\bsrc\s*=[^>]*>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script\b[^>]*\bsrc\s*=[^>]*\/?>/gi, '');

  if (!hasHtmlRoot) {
    return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${cssTag}</head><body>${out}${scriptTagValue}${guardTagValue}${anchorTagValue}</body></html>`;
  }

  out = out.replace(/<html\b([^>]*)>/i, (match, rest: string) => /\blang\s*=/i.test(rest) ? match : `<html lang="pt-BR"${rest}>`);
  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${cssTag}\n</head>`);
  else out = cssTag + out;
  if (scriptTagValue || guardTagValue || anchorTagValue) {
    if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${scriptTagValue}${guardTagValue}${anchorTagValue}\n</body>`);
    else out += `${scriptTagValue}${guardTagValue}${anchorTagValue}`;
  }
  return out;
}