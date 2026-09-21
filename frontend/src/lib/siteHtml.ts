import type { SiteArtefact } from '../types/website';

function escapeInlineScript(value: string): string {
  return value.replace(/<\/script/gi, '<\\/script');
}

const ANCHOR_SCRIPT = `<script id="__site_anchor">document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!t)return;var h=(t.getAttribute('href')||'').trim();if(h.charAt(0)==='#'){e.preventDefault();var id=h.slice(1);var el=id?document.getElementById(id):null;if(el){var y=el.getBoundingClientRect().top+(window.pageYOffset||0);window.scrollTo({top:Math.max(0,y),behavior:'smooth'});}else{window.scrollTo({top:0,behavior:'smooth'});}return;}if(/^(https?:|tel:|mailto:)/i.test(h)){e.preventDefault();e.stopPropagation();var a=document.createElement('a');a.href=t.href;a.target='_blank';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();a.remove();}},true);<\/script>`;
const GUARD_SCRIPT = `<script id="__site_guard">document.addEventListener('click',function(e){var n=e.target;var a=n&&n.closest?n.closest('a[href]'):null;if(a){var h=(a.getAttribute('href')||'').trim();if(h.charAt(0)!=='#'){e.preventDefault();e.stopPropagation();}}},true);<\/script>`;

// Motor de edição inline: permite editar textos, trocar imagens e mover blocos
// diretamente na prévia, comunicando com o estúdio via postMessage.
const EDIT_SCRIPT = `<script id="__site_edit_script">(function(){
var DIRTY=false;
function send(type,payload){try{parent.postMessage(Object.assign({source:'site-edit',type:type},payload||{}),'*');}catch(e){}}
function mark(){DIRTY=true;send('dirty');}
var hovered=null,selected=null,movable=null,editing=null;
var style=document.createElement('style');
style.id='__site_edit_style';
style.textContent='[data-site-hover]{outline:2px dashed rgba(8,123,234,.65)!important;outline-offset:2px;cursor:text}[data-site-editing]{outline:2px solid #087bea!important;outline-offset:2px}[data-site-selected]{outline:2px solid #087bea!important;outline-offset:2px}';
document.head.appendChild(style);
var toolbar=document.createElement('div');
toolbar.id='__site_edit_toolbar';
toolbar.style.cssText='position:fixed;z-index:2147483647;display:none;gap:2px;background:#111827;color:#fff;border-radius:8px;padding:3px;font:12px Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)';
toolbar.addEventListener('mousedown',function(e){e.preventDefault();});
document.body.appendChild(toolbar);
function button(label,title,fn){var b=document.createElement('button');b.type='button';b.textContent=label;if(title)b.title=title;b.style.cssText='border:0;background:transparent;color:#fff;padding:6px 8px;border-radius:6px;cursor:pointer;font:inherit;white-space:nowrap';b.onmouseover=function(){b.style.background='#374151';};b.onmouseout=function(){b.style.background='transparent';};b.onclick=function(e){e.preventDefault();e.stopPropagation();fn();};return b;}
function inToolbar(el){return !!(el&&el.closest&&el.closest('#__site_edit_toolbar'));}
function target(el){if(!el||el.nodeType!==1)return null;if(el===document.body||el===document.documentElement)return null;if(inToolbar(el))return null;return el;}
function blockOf(el){var node=el,best=null;while(node&&node!==document.body){if(/^(SECTION|ARTICLE|HEADER|FOOTER|ASIDE|FORM)$/.test(node.tagName)){best=node;break;}if(node.parentElement&&/^(BODY|MAIN)$/.test(node.parentElement.tagName)){best=node;break;}node=node.parentElement;}return best;}
function meaningful(el){if(!el)return null;if(el.tagName==='IMG')return el;if(/\S/.test(el.textContent||''))return el;return null;}
function prevSibling(el){var c=el.previousElementSibling;while(c){if(meaningful(c))return c;c=c.previousElementSibling;}return null;}
function nextSibling(el){var c=el.nextElementSibling;while(c){if(meaningful(c))return c;c=c.nextElementSibling;}return null;}
function clearHover(){if(hovered){hovered.removeAttribute('data-site-hover');hovered=null;}}
function placeToolbar(el){var r=el.getBoundingClientRect();var top=r.top-42;if(top<6)top=r.bottom+8;var left=r.left;if(left<6)left=6;if(left+260>window.innerWidth)left=Math.max(6,window.innerWidth-264);toolbar.style.top=Math.round(top)+'px';toolbar.style.left=Math.round(left)+'px';toolbar.style.display='flex';}
function clearSelection(){if(selected)selected.removeAttribute('data-site-selected');selected=null;movable=null;toolbar.style.display='none';}
function select(el,image){if(editing)finishEdit();clearSelection();selected=el;movable=blockOf(el);el.setAttribute('data-site-selected','');renderToolbar(image);placeToolbar(el);}
function renderToolbar(image){toolbar.innerHTML='';if(image){toolbar.appendChild(button('Trocar imagem','',function(){send('select-image',{src:selected.getAttribute('src')||'',alt:selected.getAttribute('alt')||''});}));}if(movable&&movable!==document.body){toolbar.appendChild(button('\\u2191','Mover para cima',function(){var p=prevSibling(movable);if(p){movable.parentNode.insertBefore(movable,p);mark();placeToolbar(selected);}}));toolbar.appendChild(button('\\u2193','Mover para baixo',function(){var n=nextSibling(movable);if(n){movable.parentNode.insertBefore(n,movable);mark();placeToolbar(selected);}}));}toolbar.appendChild(button('Concluir','',function(){clearSelection();}));}
function startEdit(el){editing=el;el.setAttribute('contenteditable','true');el.setAttribute('data-site-editing','');try{el.focus();var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);}catch(e){}toolbar.innerHTML='';toolbar.appendChild(button('Concluir','Finalizar edi\\u00e7\\u00e3o',finishEdit));placeToolbar(el);}
function finishEdit(){if(!editing)return;var el=editing;editing=null;el.removeAttribute('contenteditable');el.removeAttribute('data-site-editing');mark();select(el,false);}
document.addEventListener('mouseover',function(e){var el=target(e.target);if(!el||el===selected||editing||inToolbar(e.target))return;clearHover();hovered=el;el.setAttribute('data-site-hover','');},true);
document.addEventListener('mouseout',function(){clearHover();},true);
document.addEventListener('click',function(e){if(inToolbar(e.target))return;var t=e.target;if(!t||t.nodeType!==1)return;if(editing){if(editing.contains(t))return;finishEdit();}e.preventDefault();e.stopPropagation();var el=target(t);if(!el)return;if(el.tagName==='IMG'){select(el,true);return;}var inner=el.querySelector?el.querySelector('img'):null;if(inner&&!el.textContent.replace(/\\s/g,'')){select(inner,true);return;}select(el,false);startEdit(el);},true);
document.addEventListener('submit',function(e){e.preventDefault();},true);
window.addEventListener('scroll',function(){if(selected&&toolbar.style.display!=='none')placeToolbar(selected);},true);
window.addEventListener('resize',function(){if(selected&&toolbar.style.display!=='none')placeToolbar(selected);});
window.addEventListener('message',function(e){var d=e.data;if(!d||d.source!=='site-editor')return;if(d.type==='serialize'){if(editing)finishEdit();clearSelection();var cssEl=document.getElementById('__site_css');var jsEl=document.getElementById('__site_js');var css=cssEl?cssEl.textContent:'';var js=jsEl?jsEl.textContent:'';var clone=document.documentElement.cloneNode(true);['#__site_edit_style','#__site_edit_toolbar','#__site_css','#__site_js','#__site_edit_script','#__site_guard','#__site_anchor'].forEach(function(sel){var n=clone.querySelector(sel);if(n&&n.parentNode)n.parentNode.removeChild(n);});var nodes=clone.querySelectorAll('[contenteditable],[data-site-editing],[data-site-selected],[data-site-hover]');for(var i=0;i<nodes.length;i++){nodes[i].removeAttribute('contenteditable');nodes[i].removeAttribute('data-site-editing');nodes[i].removeAttribute('data-site-selected');nodes[i].removeAttribute('data-site-hover');}DIRTY=false;send('serialized',{html:'<!doctype html>\\n'+clone.outerHTML,css:css,js:js});}else if(d.type==='set-image'){if(selected&&selected.tagName==='IMG'&&d.src){selected.setAttribute('src',d.src);if(d.alt!=null)selected.setAttribute('alt',d.alt);mark();}}});
})();<\/script>`;

export function buildSiteDoc(artefact: SiteArtefact, opts: { interactive?: boolean; editable?: boolean } = {}): string {
  const index = artefact.files['index.html'];
  const cssTag = `<style id="__site_css" data-site-css>\n${artefact.files['styles.css'] || ''}\n</style>`;
  const scriptTagValue = artefact.files['script.js'] ? `<script id="__site_js" data-site-js>${escapeInlineScript(artefact.files['script.js'])}\n<\/script>` : '';
  const tail = opts.editable
    ? EDIT_SCRIPT
    : opts.interactive === false
      ? `${GUARD_SCRIPT}${ANCHOR_SCRIPT}`
      : ANCHOR_SCRIPT;
  const hasHtmlRoot = /<html[\s>]/i.test(index);

  let out = index;
  out = out.replace(/<link\b[^>]*\brel\s*=\s*["']?stylesheet["']?[^>]*\/?>/gi, '');
  out = out.replace(/<script\b[^>]*\bsrc\s*=[^>]*>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<script\b[^>]*\bsrc\s*=[^>]*\/?>/gi, '');

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
