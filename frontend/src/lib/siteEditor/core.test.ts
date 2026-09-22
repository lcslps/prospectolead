/**
 * Testes do núcleo do editor visual (itens 43/44 do escopo).
 * Exercitam exatamente o código embarcado no iframe.
 */
import { describe, expect, it } from 'vitest';
import {
  applyOverrides,
  applyPosition,
  assignEditorIds,
  breakpointForWidth,
  clearEditorTransforms,
  describeElement,
  exceedsThreshold,
  getEditableElements,
  getElementByEditorId,
  HistoryManager,
  OverridesStore,
  readStateBlock,
  resolveSelectable,
  restoreHref,
  restoreImage,
  restoreText,
  roundPosition,
  snapshotHref,
  snapshotImage,
  snapshotText,
  stripEditorAttributes,
  toDocDelta,
  writeStateBlock,
  EDITOR_ID_ATTR,
} from './core';

const TWO_BUTTONS = `<section><div class="wrap"><h1>Titulo</h1><div class="actions"><a class="wa">Chamar no WhatsApp</a><a class="phone">(66) 99620-5890</a></div><img src="a.jpg" alt="foto"></div></section>`;

function makeDoc(html = TWO_BUTTONS): Document {
  const doc = document.implementation.createHTMLDocument('t');
  doc.body.innerHTML = html;
  return doc;
}

describe('breakpoints e geometria (itens 9 e 25)', () => {
  it('mapeia larguras para mobile/tablet/desktop', () => {
    expect(breakpointForWidth(390)).toBe('mobile');
    expect(breakpointForWidth(639)).toBe('mobile');
    expect(breakpointForWidth(640)).toBe('tablet');
    expect(breakpointForWidth(768)).toBe('tablet');
    expect(breakpointForWidth(1023)).toBe('tablet');
    expect(breakpointForWidth(1024)).toBe('desktop');
    expect(breakpointForWidth(1200)).toBe('desktop');
  });

  it('converte delta de tela para delta do documento dividindo pelo zoom (item 9)', () => {
    // 100px de mouse com preview em 80% => 125px no layout.
    expect(toDocDelta(100, 0.8)).toBeCloseTo(125, 6);
    expect(toDocDelta(80, 0.8)).toBeCloseTo(100, 6);
    expect(toDocDelta(50, 1)).toBe(50);
    expect(toDocDelta(50, 0)).toBe(50);
    expect(toDocDelta(50, Number.NaN)).toBe(50);
  });

  it('diferencia clique de drag por threshold (item 12)', () => {
    expect(exceedsThreshold(2, 2)).toBe(false);
    expect(exceedsThreshold(3, 3)).toBe(true);
    expect(exceedsThreshold(5, 0)).toBe(true);
    expect(exceedsThreshold(0, 0)).toBe(false);
  });

  it('arredonda posições para 1px (precisão sem grid rígido)', () => {
    expect(roundPosition({ x: 124.6, y: -16.2 })).toEqual({ x: 125, y: -16 });
  });
});

describe('identidade por elemento (item 2)', () => {
  it('atribui id único a cada elemento', () => {
    const doc = makeDoc();
    const ids = assignEditorIds(doc);
    expect(new Set(ids).size).toBe(ids.length);
    expect(getEditableElements(doc).length).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(5);
  });

  it('é determinístico: o mesmo HTML recebe os mesmos ids', () => {
    const first = assignEditorIds(makeDoc());
    const second = assignEditorIds(makeDoc());
    expect(second).toEqual(first);
  });

  it('preserva ids existentes válidos e resolve colisões', () => {
    const doc = makeDoc(`<div><p ${EDITOR_ID_ATTR}="hero-title">a</p><p ${EDITOR_ID_ATTR}="hero-title">b</p></div>`);
    assignEditorIds(doc);
    const paragraphs = Array.from(doc.querySelectorAll('p'));
    expect(paragraphs[0].getAttribute(EDITOR_ID_ATTR)).toBe('hero-title');
    expect(paragraphs[1].getAttribute(EDITOR_ID_ATTR)).not.toBe('hero-title');
    expect(paragraphs[1].getAttribute(EDITOR_ID_ATTR)).toBeTruthy();
  });

  it('ignora scripts, estilos e UI do editor', () => {
    const doc = makeDoc(`<div><script>var a = 1;</script><style>.a{}</style><p>oi</p></div><div id="__site_edit_root"><p>x</p></div>`);
    assignEditorIds(doc);
    expect(doc.querySelector('script')?.hasAttribute(EDITOR_ID_ATTR)).toBe(false);
    expect(doc.querySelector('style')?.hasAttribute(EDITOR_ID_ATTR)).toBeFalsy();
    expect(doc.querySelector('#__site_edit_root p')?.hasAttribute(EDITOR_ID_ATTR)).toBe(false);
    expect(doc.querySelector('#__site_edit_root')?.hasAttribute(EDITOR_ID_ATTR)).toBe(false);
  });

  it('localiza elementos por id', () => {
    const doc = makeDoc();
    assignEditorIds(doc);
    const phone = doc.querySelector('.phone') as Element;
    const id = phone.getAttribute(EDITOR_ID_ATTR) as string;
    expect(getElementByEditorId(doc, id)).toBe(phone);
    expect(getElementByEditorId(doc, 'inexistente')).toBeNull();
    expect(getElementByEditorId(doc, '"><script')).toBeNull();
  });
});

describe('seleção leaf-first (itens 3, 4, 31)', () => {
  it('clicar no segundo <a> seleciona SOMENTE ele, não o container (item 43/L)', () => {
    const doc = makeDoc();
    const phone = doc.querySelector('.phone') as Element;
    const actions = doc.querySelector('.actions') as Element;
    expect(resolveSelectable(phone, doc)).toBe(phone);
    expect(resolveSelectable(phone, doc)).not.toBe(actions);
  });

  it('span interno de botão resolve para o botão', () => {
    const doc = makeDoc(`<div><button><span>Comprar</span></button></div>`);
    const span = doc.querySelector('span') as Element;
    const button = doc.querySelector('button') as Element;
    expect(resolveSelectable(span, doc)).toBe(button);
  });

  it('imagem resolve para ela mesma, não para o bloco (item 30)', () => {
    const doc = makeDoc();
    const img = doc.querySelector('img') as Element;
    expect(resolveSelectable(img, doc)).toBe(img);
  });

  it('clique em área vazia do container seleciona o container (explícito)', () => {
    const doc = makeDoc(`<section><div class="actions">   </div></section>`);
    const actions = doc.querySelector('.actions') as Element;
    expect(resolveSelectable(actions, doc)).toBe(actions);
  });

  it('clique no body não seleciona nada', () => {
    const doc = makeDoc();
    expect(resolveSelectable(doc.body, doc)).toBeNull();
  });

  it('Alt+clique sobe para o pai (item 31)', () => {
    const doc = makeDoc();
    const phone = doc.querySelector('.phone') as Element;
    const actions = doc.querySelector('.actions') as Element;
    expect(resolveSelectable(phone, doc, true)).toBe(actions);
  });

  it('ignora nós de texto via parent e UI do editor', () => {
    const doc = makeDoc();
    const phone = doc.querySelector('.phone') as Element;
    const textNode = phone.firstChild as Node;
    expect(resolveSelectable(textNode, doc)).toBe(phone);
  });

  it('descreve tipos e editabilidade', () => {
    const doc = makeDoc();
    expect(describeElement(doc.querySelector('img') as Element).kind).toBe('image');
    expect(describeElement(doc.querySelector('.phone') as Element).kind).toBe('link');
    expect(describeElement(doc.querySelector('h1') as Element).kind).toBe('heading');
    expect(describeElement(doc.querySelector('.actions') as Element).container).toBe(true);
    expect(describeElement(doc.querySelector('h1') as Element).textEditable).toBe(true);
    expect(describeElement(doc.querySelector('img') as Element).textEditable).toBe(false);
  });
});

describe('HistoryManager (itens 15-19, 36)', () => {
  it('undo/redo de texto: a -> aa -> a -> aa (item 16)', () => {
    const history = new HistoryManager();
    history.push({ type: 'TEXT', elementId: 't', label: 'Título', before: 'a', after: 'aa' });
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
    expect(history.undo()).toMatchObject({ before: 'a', after: 'aa' });
    expect(history.canRedo()).toBe(true);
    expect(history.redo()).toMatchObject({ before: 'a', after: 'aa' });
  });

  it('undo de movimento restaura x/y exatos (item 16)', () => {
    const history = new HistoryManager();
    history.push({ type: 'MOVE', elementId: 'hero-phone', label: 't', before: { x: 0, y: 0 }, after: { x: 140, y: -30 } });
    expect(history.undo()).toMatchObject({ before: { x: 0, y: 0 }, after: { x: 140, y: -30 } });
    expect(history.redo()).toMatchObject({ after: { x: 140, y: -30 } });
  });

  it('nova alteração após undo descarta o redo (item 19: A->B->C, undo, D)', () => {
    const history = new HistoryManager();
    history.push({ type: 'TEXT', elementId: 'e', label: 'l', before: 'A', after: 'B' });
    history.push({ type: 'TEXT', elementId: 'e', label: 'l', before: 'B', after: 'C' });
    history.undo();
    expect(history.canRedo()).toBe(true);
    history.push({ type: 'TEXT', elementId: 'e', label: 'l', before: 'B', after: 'D' });
    expect(history.canRedo()).toBe(false);
    expect(history.undoDepth()).toBe(2);
  });

  it('retorna null quando não há nada (botões desabilitados, item 21)', () => {
    const history = new HistoryManager();
    expect(history.undo()).toBeNull();
    expect(history.redo()).toBeNull();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it('limita o histórico (item 36)', () => {
    const history = new HistoryManager(10);
    for (let i = 0; i < 15; i += 1) history.push({ type: 'TEXT', elementId: 'e', label: 'l', before: `${i}`, after: `${i + 1}` });
    expect(history.undoDepth()).toBe(10);
  });

  it('coalesce funde nudges próximos numa entrada só', () => {
    const history = new HistoryManager();
    history.pushCoalesced({ type: 'MOVE', elementId: 'p', label: 'l', before: { x: 0, y: 0 }, after: { x: 1, y: 0 }, at: 1000 }, 'nudge:p:desktop', 1000);
    const merged = history.pushCoalesced({ type: 'MOVE', elementId: 'p', label: 'l', before: { x: 1, y: 0 }, after: { x: 2, y: 0 }, at: 1500 }, 'nudge:p:desktop', 1000);
    expect(merged).toBe(true);
    expect(history.undoDepth()).toBe(1);
    expect(history.undo()).toMatchObject({ before: { x: 0, y: 0 }, after: { x: 2, y: 0 } });
  });

  it('coalesce não funde após a janela ou com chave distinta', () => {
    const history = new HistoryManager();
    history.pushCoalesced({ type: 'MOVE', elementId: 'p', label: 'l', before: { x: 0, y: 0 }, after: { x: 1, y: 0 }, at: 1000 }, 'nudge:p:desktop', 500);
    history.pushCoalesced({ type: 'MOVE', elementId: 'p', label: 'l', before: { x: 1, y: 0 }, after: { x: 2, y: 0 }, at: 2000 }, 'nudge:p:desktop', 500);
    expect(history.undoDepth()).toBe(2);
  });
});

describe('OverridesStore por breakpoint (item 25)', () => {
  it('retorna zero por padrão e remove ao zerar', () => {
    const store = new OverridesStore();
    expect(store.get('a', 'desktop')).toEqual({ x: 0, y: 0 });
    store.set('a', 'desktop', { x: 140, y: -10 });
    expect(store.get('a', 'desktop')).toEqual({ x: 140, y: -10 });
    store.set('a', 'desktop', { x: 0, y: 0 });
    expect(store.has('a', 'desktop')).toBe(false);
    expect(store.isEmpty()).toBe(true);
  });

  it('isola desktop/tablet/mobile (item 25/K)', () => {
    const store = new OverridesStore();
    store.set('hero-phone', 'desktop', { x: 140, y: -10 });
    store.set('hero-phone', 'mobile', { x: 0, y: 0 });
    expect(store.get('hero-phone', 'desktop')).toEqual({ x: 140, y: -10 });
    expect(store.get('hero-phone', 'mobile')).toEqual({ x: 0, y: 0 });
    expect(store.get('hero-phone', 'tablet')).toEqual({ x: 0, y: 0 });
    expect(store.has('hero-phone', 'mobile')).toBe(false);
  });

  it('serializa e tolera JSON ausente/corrompido', () => {
    const store = new OverridesStore();
    store.set('a', 'desktop', { x: 5, y: 6 });
    const revived = OverridesStore.fromJSON(JSON.stringify(store.toJSON()));
    expect(revived.get('a', 'desktop')).toEqual({ x: 5, y: 6 });
    expect(OverridesStore.fromJSON('').isEmpty()).toBe(true);
    expect(OverridesStore.fromJSON('{invalid').isEmpty()).toBe(true);
  });

  it('lê/escreve o bloco de estado no documento', () => {
    const doc = makeDoc();
    expect(readStateBlock(doc).isEmpty()).toBe(true);
    const store = new OverridesStore();
    store.set('hero-phone', 'desktop', { x: 124, y: -16 });
    writeStateBlock(doc, store);
    expect(readStateBlock(doc).get('hero-phone', 'desktop')).toEqual({ x: 124, y: -16 });
  });
});

describe('transforms independentes (itens 5, 6, 23, 43)', () => {
  it('CENÁRIO OBRIGATÓRIO: mover phone 150px não move whatsapp nem actions', () => {
    const doc = makeDoc();
    assignEditorIds(doc);
    const phone = doc.querySelector('.phone') as HTMLElement;
    const whatsapp = doc.querySelector('.wa') as HTMLElement;
    const actions = doc.querySelector('.actions') as HTMLElement;
    const phoneId = phone.getAttribute(EDITOR_ID_ATTR) as string;

    const store = new OverridesStore();
    store.set(phoneId, 'desktop', { x: 150, y: 0 });
    applyOverrides(doc, store, 'desktop');

    expect(phone.style.transform).toBe('translate3d(150px, 0px, 0)');
    expect(whatsapp.style.transform).toBe('');
    expect(whatsapp.getAttribute('style') || '').toBe('');
    expect(actions.style.transform).toBe('');
    expect(actions.getAttribute('style') || '').toBe('');
  });

  it('applyPosition preserva transform inline pré-existente (composição)', () => {
    const doc = makeDoc(`<div><p style="transform: scale(1.1); color: red;">oi</p></div>`);
    const p = doc.querySelector('p') as HTMLElement;
    applyPosition(p, { x: 10, y: 20 });
    expect(p.style.transform).toBe('scale(1.1) translate3d(10px, 20px, 0)');
    expect(p.style.color).toBe('red');
    applyPosition(p, null);
    expect(p.style.transform).toBe('scale(1.1)');
  });

  it('applyOverrides só toca elementos com override ou marca aplicada', () => {
    const doc = makeDoc();
    assignEditorIds(doc);
    const before = doc.body.innerHTML;
    applyOverrides(doc, new OverridesStore(), 'desktop');
    expect(doc.body.innerHTML).toBe(before);
  });

  it('clearEditorTransforms restaura o HTML original', () => {
    const doc = makeDoc();
    assignEditorIds(doc);
    const phone = doc.querySelector('.phone') as HTMLElement;
    applyPosition(phone, { x: 150, y: 0 });
    expect(phone.style.transform).not.toBe('');
    clearEditorTransforms(doc);
    expect(phone.style.transform).toBe('');
    expect(phone.hasAttribute('data-editor-applied')).toBe(false);
  });

  it('stripEditorAttributes remove marcas de edição', () => {
    const doc = makeDoc(`<div><p contenteditable="true" data-site-selected="" data-site-editing="">oi</p></div>`);
    const p = doc.querySelector('p') as Element;
    stripEditorAttributes(p);
    expect(p.outerHTML).toBe('<p>oi</p>');
  });
});

describe('snapshots de conteúdo (item 34: undo exato)', () => {
  it('texto: innerHTML vai e volta', () => {
    const doc = makeDoc(`<div><h1>a</h1></div>`);
    const h1 = doc.querySelector('h1') as Element;
    const before = snapshotText(h1);
    h1.innerHTML = 'aa';
    expect(snapshotText(h1)).not.toBe(before);
    restoreText(h1, before);
    expect(h1.innerHTML).toBe('a');
  });

  it('imagem: src/alt vão e voltam', () => {
    const doc = makeDoc();
    const img = doc.querySelector('img') as Element;
    const before = snapshotImage(img);
    img.setAttribute('src', 'nova.jpg');
    restoreImage(img, before);
    expect(img.getAttribute('src')).toBe('a.jpg');
    expect(snapshotHref(img)).toBe('');
    restoreHref(img, 'https://x.com');
    expect(img.getAttribute('href')).toBe('https://x.com');
  });
});
