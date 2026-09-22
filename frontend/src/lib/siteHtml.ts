import type { SiteArtefact } from '../types/website';
import frameRuntime from 'virtual:site-editor-frame';
import applyRuntime from 'virtual:site-editor-apply';

function escapeInlineScript(value: string): string {
  return value.replace(/<\/script/gi, '<\\/script');
}

/** Embala código JS como <script> inline seguro para srcDoc. */
function inlineScript(id: string, code: string): string {
  return `<script id="${id}">${code.replace(/<\/script/gi, '<\\/script')}\n</script>`;
}

const ANCHOR_SCRIPT = `<script id="__site_anchor">document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!t)return;var h=(t.getAttribute('href')||'').trim();if(h.charAt(0)==='#'){e.preventDefault();var id=h.slice(1);var el=id?document.getElementById(id):null;if(el){var y=el.getBoundingClientRect().top+(window.pageYOffset||0);window.scrollTo({top:Math.max(0,y),behavior:'smooth'});}else{window.scrollTo({top:0,behavior:'smooth'});}return;}if(/^(https?:|tel:|mailto:)/i.test(h)){e.preventDefault();e.stopPropagation();var a=document.createElement('a');a.href=t.href;a.target='_blank';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();a.remove();}},true);<\/script>`;
const GUARD_SCRIPT = `<script id="__site_guard">document.addEventListener('click',function(e){var n=e.target;var a=n&&n.closest?n.closest('a[href]'):null;if(a){var h=(a.getAttribute('href')||'').trim();if(h.charAt(0)!=='#'){e.preventDefault();e.stopPropagation();}}},true);<\/script>`;

// Runtime do editor visual (TypeScript real em src/lib/siteEditor, empacotado
// via esbuild pelo plugin do Vite):
// - __site_apply: reaplica offsets por breakpoint em TODOS os contextos
//   (preview + site publicado);
// - __site_edit_script: editor completo (modo "Editar direto") — seleção
//   leaf-first, drag independente por elemento, undo/redo, edição de texto,
//   links e imagens. Presença deste script = modo edição.
const APPLY_SCRIPT = inlineScript('__site_apply', applyRuntime);
const EDIT_SCRIPT = inlineScript('__site_edit_script', frameRuntime);

export function buildSiteDoc(artefact: SiteArtefact, opts: { interactive?: boolean; editable?: boolean } = {}): string {
  const index = artefact.files['index.html'];
  const cssTag = `<style id="__site_css" data-site-css>\n${artefact.files['styles.css'] || ''}\n</style>`;
  const scriptTagValue = artefact.files['script.js'] ? `<script id="__site_js" data-site-js>${escapeInlineScript(artefact.files['script.js'])}\n<\/script>` : '';
  const tail = opts.editable
    ? EDIT_SCRIPT
    : opts.interactive === false
      ? `${APPLY_SCRIPT}${GUARD_SCRIPT}${ANCHOR_SCRIPT}`
      : `${APPLY_SCRIPT}${ANCHOR_SCRIPT}`;
  const hasHtmlRoot = /<html[\s>]/i.test(index);

  let out = index;
  out = out.replace(/<link\b[^>]*\brel\s*=\s*["']?stylesheet["']?[^>]*\/?>/gi, '');
  out = out.replace(/<script\b[^>]*\bsrc\s*=[^>]*>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script\b[^>]*\bsrc\s*=[^>]*\/?>/gi, '');
  // HTML salvo pode conter o applier de uma sessão anterior: remove para
  // injetar a versão atual uma única vez (o bloco de estado é preservado).
  out = out.replace(/<script\b[^>]*\bid\s*=\s*["']__site_apply["'][^>]*>[\s\S]*?<\/script>/gi, '');

  if (!hasHtmlRoot) {
    return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${cssTag}</head><body>${out}${scriptTagValue}${tail}</body></html>`;
  }

  out = out.replace(/<html\b([^>]*)>/i, (match, rest: string) => /\blang\s*=/i.test(rest) ? match : `<html lang="pt-BR"${rest}>`);
  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${cssTag}\n</head>`);
  else out = cssTag + out;
  if (scriptTagValue || tail) {
    if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${scriptTagValue}${tail}\n</body>`);
    else out += `${scriptTagValue}${tail}`;
  }
  return out;
}
