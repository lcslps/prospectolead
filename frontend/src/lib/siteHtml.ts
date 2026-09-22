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

/**
 * O documento do site fica em um iframe sandboxed e, por isso, não pode
 * confiar em mensagens enviadas por janelas irmãs/popups. `srcDoc` possui
 * origem opaca, logo `event.origin` é `null`; a relação pai-filho é a única
 * verificação estável que podemos fazer aqui.
 */
const MESSAGE_GATE_SCRIPT = `<script id="__site_message_gate">window.addEventListener('message',function(e){if(window.parent!==window&&e.source!==window.parent){e.stopImmediatePropagation();}},true);<\/script>`;

const GOOGLE_FONT_CATALOG = [
  { name: 'Inter', query: 'Inter:wght@400;500;600;700' },
  { name: 'DM Sans', query: 'DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700' },
  { name: 'Manrope', query: 'Manrope:wght@400;500;600;700;800' },
  { name: 'Plus Jakarta Sans', query: 'Plus+Jakarta+Sans:wght@400;500;600;700;800' },
  { name: 'Poppins', query: 'Poppins:wght@400;500;600;700;800' },
  { name: 'Montserrat', query: 'Montserrat:wght@400;500;600;700;800' },
  { name: 'Playfair Display', query: 'Playfair+Display:wght@400;500;600;700;800;900' },
  { name: 'DM Serif Display', query: 'DM+Serif+Display:ital@0;1' },
  { name: 'Cormorant Garamond', query: 'Cormorant+Garamond:wght@400;500;600;700' },
  { name: 'Fraunces', query: 'Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700' },
  { name: 'Lora', query: 'Lora:wght@400;500;600;700' },
  { name: 'Libre Baskerville', query: 'Libre+Baskerville:wght@400;700' },
  { name: 'Merriweather', query: 'Merriweather:wght@400;700;900' },
  { name: 'Space Grotesk', query: 'Space+Grotesk:wght@400;500;600;700' },
  { name: 'Sora', query: 'Sora:wght@400;500;600;700' },
  { name: 'Outfit', query: 'Outfit:wght@400;500;600;700;800' },
  { name: 'Archivo', query: 'Archivo:wght@400;500;600;700;800' },
  { name: 'Bebas Neue', query: 'Bebas+Neue' },
  { name: 'Oswald', query: 'Oswald:wght@400;500;600;700' },
] as const;

type GoogleFont = (typeof GOOGLE_FONT_CATALOG)[number];

function normaliseFontName(value: string): string {
  return value.trim().replace(/["']/g, '').replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

/**
 * Somente fontes explicitamente permitidas são carregadas. Isto preserva o
 * isolamento de CSS externo, mas devolve a tipografia que o plano visual
 * escolheu quando ela aparece no HTML/CSS salvo.
 */
function findGoogleFonts(index: string, css: string): GoogleFont[] {
  const source = `${index}\n${css}`.toLocaleLowerCase('en-US');
  return GOOGLE_FONT_CATALOG.filter(font => source.includes(normaliseFontName(font.name)));
}

function fontLoader(fonts: GoogleFont[]): string {
  if (!fonts.length) return '';
  const knownFonts = JSON.stringify(fonts);
  return inlineScript('__site_fonts', `(()=>{const fonts=${knownFonts};const head=document.head||document.documentElement;if(!head||document.querySelector('link[data-site-google-fonts]'))return;for(const origin of ['https://fonts.googleapis.com','https://fonts.gstatic.com']){const preconnect=document.createElement('link');preconnect.rel='preconnect';preconnect.href=origin;if(origin.includes('gstatic'))preconnect.crossOrigin='anonymous';preconnect.dataset.siteGoogleFonts='preconnect';head.appendChild(preconnect);}const link=document.createElement('link');link.rel='stylesheet';link.href='https://fonts.googleapis.com/css2?'+fonts.map(font=>'family='+encodeURIComponent(font.query)).join('&')+'&display=swap';link.dataset.siteGoogleFonts='true';head.appendChild(link);})();`);
}

/**
 * Fallback visual local para qualquer imagem que deixe de carregar depois da
 * publicação. O SVG é data URL, portanto não depende de outro provedor e
 * mantém o espaço/ratio do elemento original em vez de deixar uma caixa vazia.
 */
const IMAGE_RESILIENCE_SCRIPT = inlineScript('__site_image_resilience', `(()=>{const fallback='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" y1="0" x2="1" y2="1"%3E%3Cstop stop-color="%23e2e8f0"/%3E%3Cstop offset="1" stop-color="%23cbd5e1"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1200" height="800" fill="url(%23g)"/%3E%3Cpath d="M0 620 310 380l170 140 205-220 515 320v180H0Z" fill="%2394a3b8" opacity=".42"/%3E%3Ccircle cx="830" cy="245" r="74" fill="%23f8fafc" opacity=".72"/%3E%3C/svg%3E';const fallbackBackground='linear-gradient(135deg,#e2e8f0 0%,#cbd5e1 100%)';const reported=new Set;const backgroundUrls=new Map;const report=(kind,detail)=>{const key=kind+'|'+detail.src;if(reported.has(key))return;reported.add(key);const message={source:'site-runtime',type:'image-fallback',kind,...detail};try{window.parent.postMessage(message,'*')}catch{}try{console.warn('[site-image-resilience]',message)}catch{}};const fallbackImage=(image,reason)=>{if(!(image instanceof HTMLImageElement)||image.dataset.siteImageFallback==='1')return;const src=(image.getAttribute('src')||'').trim();image.dataset.siteImageFallback='1';image.classList.add('site-image-fallback');if(!image.getAttribute('alt'))image.setAttribute('alt','Imagem ilustrativa indisponível');image.setAttribute('decoding','async');image.src=fallback;report('image',{src,alt:image.alt||'',reason})};const inspectImage=image=>{if(!(image instanceof HTMLImageElement)||image.dataset.siteImageObserved==='1')return;image.dataset.siteImageObserved='1';image.addEventListener('error',()=>fallbackImage(image,'load-error'));const src=(image.getAttribute('src')||'').trim();if(!src||/^javascript:/i.test(src)){fallbackImage(image,'invalid-src');return}if(image.complete&&image.naturalWidth===0)window.setTimeout(()=>{if(image.complete&&image.naturalWidth===0)fallbackImage(image,'empty-resource')},0)};const urlsFrom=value=>{const urls=[];String(value||'').replace(/url\\(\\s*(['"]?)(.*?)\\1\\s*\\)/g,(_all,_quote,url)=>{if(url&&url!=='none')urls.push(url.trim());return _all});return urls};const inspectBackground=element=>{if(!(element instanceof HTMLElement)||element.dataset.siteBackgroundObserved==='1')return;const urls=urlsFrom(getComputedStyle(element).backgroundImage);if(!urls.length)return;element.dataset.siteBackgroundObserved='1';for(const src of urls){if(backgroundUrls.has(src))continue;backgroundUrls.set(src,true);const probe=new Image;probe.addEventListener('error',()=>{backgroundUrls.set(src,false);for(const node of document.querySelectorAll('[data-site-background-observed="1"]')){if(!(node instanceof HTMLElement)||!urlsFrom(getComputedStyle(node).backgroundImage).includes(src))continue;node.classList.add('site-background-fallback');node.style.backgroundImage=fallbackBackground;report('background',{src,alt:'',reason:'load-error'})}});probe.src=src}};const inspectTree=root=>{if(root instanceof HTMLImageElement)inspectImage(root);if(root instanceof HTMLElement)inspectBackground(root);if(!root.querySelectorAll)return;for(const image of root.querySelectorAll('img'))inspectImage(image);for(const node of root.querySelectorAll('*'))inspectBackground(node)};const start=()=>{const style=document.createElement('style');style.id='__site_image_resilience_style';style.textContent='.site-image-fallback{background:#e2e8f0!important;object-fit:cover!important;color:transparent}.site-background-fallback{background-color:#cbd5e1!important;background-size:cover!important;background-position:center!important}';document.head?.appendChild(style);inspectTree(document.documentElement);new MutationObserver(records=>{for(const record of records){if(record.type==='attributes'&&record.target instanceof HTMLImageElement){if(record.target.dataset.siteImageFallback==='1'&&record.target.getAttribute('src')===fallback)continue;record.target.dataset.siteImageObserved='';record.target.dataset.siteImageFallback='';inspectImage(record.target)}for(const node of record.addedNodes)if(node.nodeType===1)inspectTree(node)}}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','style','class']})};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start()})();`);

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
  const fontTag = fontLoader(findGoogleFonts(index, artefact.files['styles.css'] || ''));
  const scriptTagValue = artefact.files['script.js'] ? `<script id="__site_js" data-site-js>${escapeInlineScript(artefact.files['script.js'])}\n<\/script>` : '';
  const tail = opts.editable
    ? `${MESSAGE_GATE_SCRIPT}${EDIT_SCRIPT}${IMAGE_RESILIENCE_SCRIPT}`
    : opts.interactive === false
      ? `${APPLY_SCRIPT}${MESSAGE_GATE_SCRIPT}${GUARD_SCRIPT}${ANCHOR_SCRIPT}${IMAGE_RESILIENCE_SCRIPT}`
      : `${APPLY_SCRIPT}${MESSAGE_GATE_SCRIPT}${ANCHOR_SCRIPT}${IMAGE_RESILIENCE_SCRIPT}`;
  const hasHtmlRoot = /<html[\s>]/i.test(index);

  let out = index;
  out = out.replace(/<link\b[^>]*\brel\s*=\s*["']?stylesheet["']?[^>]*\/?>/gi, '');
  out = out.replace(/<script\b[^>]*\bsrc\s*=[^>]*>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script\b[^>]*\bsrc\s*=[^>]*\/?>/gi, '');
  // HTML salvo pode conter runtimes de uma sessão anterior: remove para
  // injetar a versão atual uma única vez (o bloco de estado é preservado).
  out = out.replace(/<script\b[^>]*\bid\s*=\s*["']__(?:site_apply|site_edit_script|site_anchor|site_guard|site_message_gate|site_image_resilience|site_fonts)["'][^>]*>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<style\b[^>]*\bid\s*=\s*["']__site_image_resilience_style["'][^>]*>[\s\S]*?<\/style>/gi, '');

  if (!hasHtmlRoot) {
    return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${cssTag}${fontTag}</head><body>${out}${scriptTagValue}${tail}</body></html>`;
  }

  out = out.replace(/<html\b([^>]*)>/i, (match, rest: string) => /\blang\s*=/i.test(rest) ? match : `<html lang="pt-BR"${rest}>`);
  if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, `${cssTag}${fontTag}\n</head>`);
  else out = `${cssTag}${fontTag}${out}`;
  if (scriptTagValue || tail) {
    if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, `${scriptTagValue}${tail}\n</body>`);
    else out += `${scriptTagValue}${tail}`;
  }
  return out;
}
