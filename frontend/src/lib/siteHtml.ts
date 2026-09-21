import type { SiteArtefact } from '../types/website';

function escapeInlineScript(value: string): string {
  return value.replace(/<\/script/gi, '<\\/script');
}

const ANCHOR_SCRIPT = `<script id="__site_anchor">document.addEventListener('click',function(e){var t=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!t)return;var h=(t.getAttribute('href')||'').trim();if(h.charAt(0)==='#'){e.preventDefault();var id=h.slice(1);var el=id?document.getElementById(id):null;if(el){var y=el.getBoundingClientRect().top+(window.pageYOffset||0);window.scrollTo({top:Math.max(0,y),behavior:'smooth'});}else{window.scrollTo({top:0,behavior:'smooth'});}return;}if(/^(https?:|tel:|mailto:)/i.test(h)){e.preventDefault();e.stopPropagation();var a=document.createElement('a');a.href=t.href;a.target='_blank';a.rel='noopener noreferrer';document.body.appendChild(a);a.click();a.remove();}},true);<\/script>`;
const GUARD_SCRIPT = `<script id="__site_guard">document.addEventListener('click',function(e){var n=e.target;var a=n&&n.closest?n.closest('a[href]'):null;if(a){var h=(a.getAttribute('href')||'').trim();if(h.charAt(0)!=='#'){e.preventDefault();e.stopPropagation();}}},true);<\/script>`;

// Motor de edição inline: permite editar textos, trocar imagens e mover blocos
// diretamente na prévia, comunicando com o estúdio via postMessage.
// O bloco selecionado pode ser arrastado com o ponteiro (cima/baixo/lados)
// reordenando-o entre os irmãos do seu contêiner.
const EDIT_SCRIPT = `<script id="__site_edit_script">(function(){
var DIRTY=false;
function send(type,payload){try{parent.postMessage(Object.assign({source:'site-edit',type:type},payload||{}),'*');}catch(e){}}
function mark(){DIRTY=true;send('dirty');}
var hovered=null,selected=null,movable=null,editing=null,drag=null,suppressClick=false;
var style=document.createElement('style');
style.id='__site_edit_style';
style.textContent='[data-site-hover]{outline:2px dashed rgba(8,123,234,.65)!important;outline-offset:2px;cursor:text}[data-site-editing]{outline:2px solid #087bea!important;outline-offset:2px}[data-site-selected]{outline:2px solid #087bea!important;outline-offset:2px}[data-site-dragging]{opacity:.45!important;-webkit-filter:grayscale(.4)!important;filter:grayscale(.4)!important}[data-site-drop]{outline:2px dashed #12b886!important;outline-offset:2px;box-shadow:0 0 0 4px rgba(18,184,134,.2)!important}';
document.head.appendChild(style);
var toolbar=document.createElement('div');
toolbar.id='__site_edit_toolbar';
toolbar.style.cssText='position:fixed;z-index:2147483647;display:none;gap:2px;background:#111827;color:#fff;border-radius:8px;padding:3px;font:12px Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)';
document.body.appendChild(toolbar);
function button(label,title,fn){var b=document.createElement('button');b.type='button';b.textContent=label;if(title)b.title=title;b.style.cssText='border:0;background:transparent;color:#fff;padding:6px 8px;border-radius:6px;cursor:pointer;font:inherit;white-space:nowrap';b.onmouseover=function(){b.style.background='#374151';};b.onmouseout=function(){b.style.background='transparent';};b.onclick=function(e){e.preventDefault();e.stopPropagation();fn();};return b;}
function gripButton(){var b=document.createElement('button');b.type='button';b.textContent='\\u2922';b.title='Arrastar para mover';b.style.cssText='border:0;background:#3b82f6;color:#fff;padding:6px 9px;border-radius:6px;cursor:grab;font:12px Arial,sans-serif;';b.setAttribute('aria-label','Arrastar para mover');b.onmouseover=function(){b.style.background='#2563eb';};b.onmouseout=function(){b.style.background='#3b82f6';};b.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();if(!movable)return;beginDrag(movable,e);},true);return b;}
function inToolbar(el){return !!(el&&el.closest&&el.closest('#__site_edit_toolbar'));}
function target(el){if(!el||el.nodeType!==1)return null;if(el===document.body||el===document.documentElement)return null;if(inToolbar(el))return null;return el;}
function blockOf(el){var node=el,best=null;while(node&&node!==document.body){if(/^(SECTION|ARTICLE|HEADER|FOOTER|ASIDE|FORM)$/.test(node.tagName)){best=node;break;}if(node.parentElement&&/^(BODY|MAIN)$/.test(node.parentElement.tagName)){best=node;break;}node=node.parentElement;}return best;}
function meaningful(el){if(!el)return null;if(el.tagName==='IMG')return el;if(/\S/.test(el.textContent||''))return el;return null;}
function prevSibling(el){var c=el.previousElementSibling;while(c){if(meaningful(c))return c;c=c.previousElementSibling;}return null;}
function nextSibling(el){var c=el.nextElementSibling;while(c){if(meaningful(c))return c;c=c.nextElementSibling;}return null;}
function isReorderable(el){if(!el||el.nodeType!==1)return false;return /^(DIV|SECTION|ARTICLE|HEADER|FOOTER|ASIDE|FORM|NAV|MAIN|UL|OL|IMG|TABLE)$/.test(el.tagName);}
function hasSibling(node){var p=node.parentElement,i;if(!p)return false;for(i=0;i<p.children.length;i++){if(p.children[i]!==node&&meaningful(p.children[i]))return true;}return false;}
function dragNode(el){var base=blockOf(el)||el,best=null,n=el;while(n&&n.nodeType===1&&n!==document.body&&n!==base){if(isReorderable(n)&&hasSibling(n))best=n;n=n.parentElement;}if(best)return best;if(hasSibling(base))return base;return null;}
function clearHover(){if(hovered){hovered.removeAttribute('data-site-hover');hovered=null;}}
function placeToolbar(el){var r=el.getBoundingClientRect();var top=r.top-42;if(top<6)top=r.bottom+8;var left=r.left;if(left<6)left=6;if(left+260>window.innerWidth)left=Math.max(6,window.innerWidth-264);toolbar.style.top=Math.round(top)+'px';toolbar.style.left=Math.round(left)+'px';toolbar.style.display='flex';}
function clearSelection(){if(selected)selected.removeAttribute('data-site-selected');selected=null;movable=null;toolbar.style.display='none';}
function select(el,image){if(editing)finishEdit();clearSelection();selected=el;movable=dragNode(el)||null;el.setAttribute('data-site-selected','');renderToolbar(image);placeToolbar(el);}
function renderToolbar(image){toolbar.innerHTML='';if(image){toolbar.appendChild(button('Trocar imagem','',function(){send('select-image',{src:selected.getAttribute('src')||'',alt:selected.getAttribute('alt')||''});}));}if(movable){toolbar.appendChild(gripButton());if(prevSibling(movable))toolbar.appendChild(button('\\u2191','Mover para cima',function(){var p=prevSibling(movable);if(p){movable.parentNode.insertBefore(movable,p);mark();placeToolbar(selected);}}));if(nextSibling(movable))toolbar.appendChild(button('\\u2193','Mover para baixo',function(){var n=nextSibling(movable);if(n){movable.parentNode.insertBefore(n,movable);mark();placeToolbar(selected);}}));}toolbar.appendChild(button('Concluir','',function(){clearSelection();}));}
function startEdit(el){editing=el;el.setAttribute('contenteditable','true');el.setAttribute('data-site-editing','');try{el.focus();var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);}catch(e){}toolbar.innerHTML='';toolbar.appendChild(button('Concluir','Finalizar edi\\u00e7\\u00e3o',finishEdit));placeToolbar(el);}
function finishEdit(){if(!editing)return;var el=editing;editing=null;el.removeAttribute('contenteditable');el.removeAttribute('data-site-editing');mark();select(el,false);}
function beginDrag(el,e){clearDrop();if(editing)finishEdit();drag={node:el,startX:e.clientX,startY:e.clientY,axis:0,fired:false};el.setAttribute('data-site-dragging','');document.body.style.userSelect='none';document.body.style.webkitUserSelect='none';var s=window.getSelection();if(s&&s.removeAllRanges)s.removeAllRanges();}
function clearDrop(){var t=document.querySelector('[data-site-drop]');if(t)t.removeAttribute('data-site-drop');}
function nearestSlot(x,y,node,axis){var parent=node.parentElement,i,child,r,cx,cy,d,best=null,bs=1e18,before=true;if(!parent)return null;for(i=0;i<parent.children.length;i++){child=parent.children[i];if(child===node||!meaningful(child))continue;r=child.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;d=Math.abs(cx-x)+Math.abs(cy-y);if(d<bs){bs=d;best=child;if(axis){before=x<cx;}else{before=y<cy;}}}return best?{node:best,before:before}:null;}
function moveDrag(e){var dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;if(!drag.fired&&Math.abs(dx)<3&&Math.abs(dy)<3)return;drag.fired=true;drag.axis=Math.abs(dx)>=Math.abs(dy)?1:0;e.preventDefault();var t=nearestSlot(e.clientX,e.clientY,drag.node,drag.axis);clearDrop();if(t)t.node.setAttribute('data-site-drop','');}
function applyDrop(target,before,node){var parent=node.parentElement;if(!target||target.parentNode!==parent)return;if(before){parent.insertBefore(node,target);}else if(target.nextSibling){parent.insertBefore(node,target.nextSibling);}else{parent.appendChild(node);}}
function endDrag(e){var node=drag.node,did=drag.fired;if(node)node.removeAttribute('data-site-dragging');document.body.style.userSelect='';document.body.style.webkitUserSelect='';var t=did?nearestSlot(e.clientX,e.clientY,node,drag.axis):null;clearDrop();drag=null;if(did){suppressClick=true;setTimeout(function(){suppressClick=false;},80);}if(t&&t.node&&t.node.parentNode===node.parentNode){applyDrop(t.node,t.before,node);mark();if(selected)placeToolbar(selected);}}
function cancelDrag(){if(!drag)return;clearDrop();if(drag.node)drag.node.removeAttribute('data-site-dragging');document.body.style.userSelect='';document.body.style.webkitUserSelect='';drag=null;}
document.addEventListener('mouseover',function(e){var el=target(e.target);if(!el||el===selected||editing||inToolbar(e.target))return;clearHover();hovered=el;el.setAttribute('data-site-hover','');},true);
document.addEventListener('mouseout',function(){clearHover();},true);
document.addEventListener('click',function(e){if(suppressClick){e.preventDefault();e.stopPropagation();return;}if(inToolbar(e.target))return;var t=e.target;if(!t||t.nodeType!==1)return;if(editing){if(editing.contains(t))return;finishEdit();}e.preventDefault();e.stopPropagation();var el=target(t);if(!el)return;if(el.tagName==='IMG'){select(el,true);return;}var inner=el.querySelector?el.querySelector('img'):null;if(inner&&!el.textContent.replace(/\\s/g,'')){select(inner,true);return;}select(el,false);startEdit(el);},true);
document.addEventListener('submit',function(e){e.preventDefault();},true);
document.addEventListener('pointermove',function(e){if(drag)moveDrag(e);},true);
document.addEventListener('pointerup',function(e){if(drag)endDrag(e);},true);
document.addEventListener('pointercancel',function(){cancelDrag();},true);
window.addEventListener('blur',function(){cancelDrag();});
window.addEventListener('scroll',function(){if(selected&&toolbar.style.display!=='none')placeToolbar(selected);},true);
window.addEventListener('resize',function(){if(selected&&toolbar.style.display!=='none')placeToolbar(selected);});
window.addEventListener('message',function(e){var d=e.data;if(!d||d.source!=='site-editor')return;if(d.type==='serialize'){cancelDrag();if(editing)finishEdit();clearSelection();var cssEl=document.getElementById('__site_css');var jsEl=document.getElementById('__site_js');var css=cssEl?cssEl.textContent:'';var js=jsEl?jsEl.textContent:'';var clone=document.documentElement.cloneNode(true);['#__site_edit_style','#__site_edit_toolbar','#__site_css','#__site_js','#__site_edit_script','#__site_guard','#__site_anchor'].forEach(function(sel){var n=clone.querySelector(sel);if(n&&n.parentNode)n.parentNode.removeChild(n);});var nodes=clone.querySelectorAll('[contenteditable],[data-site-editing],[data-site-selected],[data-site-hover],[data-site-dragging],[data-site-drop]');for(var i=0;i<nodes.length;i++){nodes[i].removeAttribute('contenteditable');nodes[i].removeAttribute('data-site-editing');nodes[i].removeAttribute('data-site-selected');nodes[i].removeAttribute('data-site-hover');nodes[i].removeAttribute('data-site-dragging');nodes[i].removeAttribute('data-site-drop');}DIRTY=false;send('serialized',{html:'<!doctype html>\\n'+clone.outerHTML,css:css,js:js});}else if(d.type==='set-image'){if(selected&&selected.tagName==='IMG'&&d.src){selected.setAttribute('src',d.src);if(d.alt!=null)selected.setAttribute('alt',d.alt);mark();}}});
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
