/**
 * Testes do runtime de edição (frame): seleção, drag independente,
 * overlay, texto, link, imagem, nudge, breakpoints, undo/redo, serialize.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createEditor, type EditorApi, type EditorHooks } from './frame';
import { EDITOR_ID_ATTR, type FrameToParent } from './core';

const FIXTURE = `
<section><div class="wrap"><h1>Titulo a</h1>
<div class="actions"><a class="wa" href="https://wa.me/1">Chamar no WhatsApp</a><a class="phone" href="tel:+5566996205890">(66) 99620-5890</a></div>
<img class="photo" src="a.jpg" alt="foto">
</div></section>`;

interface Fixture {
  editor: EditorApi;
  sent: FrameToParent[];
  phone: HTMLElement;
  whatsapp: HTMLElement;
  actions: HTMLElement;
  title: HTMLElement;
  photo: HTMLElement;
  phoneId: string;
  advance: (ms: number) => void;
  lastOf: (type: FrameToParent['type']) => FrameToParent | undefined;
}

let editor: EditorApi | null = null;

function setup(html = FIXTURE): Fixture {
  document.body.innerHTML = html;
  const sent: FrameToParent[] = [];
  let now = 1000;
  const hooks: EditorHooks = { send: msg => sent.push(msg), now: () => now };
  editor = createEditor(document, window, hooks);
  const phone = document.querySelector('.phone') as HTMLElement;
  const fixture: Fixture = {
    editor,
    sent,
    phone,
    whatsapp: document.querySelector('.wa') as HTMLElement,
    actions: document.querySelector('.actions') as HTMLElement,
    title: document.querySelector('h1') as HTMLElement,
    photo: document.querySelector('.photo') as HTMLElement,
    phoneId: phone.getAttribute(EDITOR_ID_ATTR) as string,
    advance: ms => {
      now += ms;
    },
    lastOf: type => {
      const matches = sent.filter(m => m.type === type);
      return matches[matches.length - 1];
    },
  };
  return fixture;
}

afterEach(() => {
  editor?.destroy();
  editor = null;
  document.body.innerHTML = '';
});

function pointerDown(el: Element, x = 0, y = 0, extra: MouseEventInit = {}): void {
  el.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: x, clientY: y, ...extra }));
}

function pointerMove(x: number, y: number): void {
  document.dispatchEvent(new window.MouseEvent('pointermove', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
}

function pointerUp(x = 0, y = 0): void {
  document.dispatchEvent(new window.MouseEvent('pointerup', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
}

function clickOn(el: Element): void {
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

function key(keyName: string, init: KeyboardEventInit = {}): void {
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true, ...init }));
}

function clickBarButton(label: string): HTMLButtonElement {
  const bar = document.getElementById('__site_edit_bar') as HTMLElement;
  const button = Array.from(bar.querySelectorAll('button')).find(b => b.textContent === label);
  if (!button) throw new Error(`botão "${label}" não encontrado na toolbar`);
  (button as HTMLButtonElement).click();
  return button as HTMLButtonElement;
}

describe('boot e seleção', () => {
  it('atribui ids, anuncia ready e estado do histórico', () => {
    const fx = setup();
    expect(fx.phoneId).toBeTruthy();
    expect(fx.sent[0]).toMatchObject({ source: 'site-edit', type: 'ready' });
    expect(fx.lastOf('history-state')).toMatchObject({ canUndo: false, canRedo: false });
    expect(fx.editor.canUndo()).toBe(false);
  });

  it('clicar no telefone seleciona SOMENTE ele (overlay exato)', () => {
    const fx = setup();
    pointerDown(fx.phone, 10, 10);
    expect(fx.editor.selectedId()).toBe(fx.phoneId);
    expect(fx.editor.selectedInfo()).toMatchObject({ kind: 'link' });
    const box = document.getElementById('__site_edit_box') as HTMLElement;
    expect(box.style.display).toBe('block');
    pointerUp(10, 10);
    clickOn(fx.phone);
    expect(fx.editor.selectedId()).toBe(fx.phoneId);
  });

  it('Alt+clique seleciona o container pai explicitamente', () => {
    const fx = setup();
    pointerDown(fx.phone, 10, 10, { altKey: true });
    expect(fx.editor.selectedId()).toBe(fx.actions.getAttribute(EDITOR_ID_ATTR));
  });

  it('pointerdown em elemento selecionável previne o DnD nativo do browser', () => {
    const fx = setup();
    const event = new window.MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 });
    fx.phone.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(fx.editor.selectedId()).toBe(fx.phoneId);
  });

  it('Escape limpa a seleção; clique no vazio também', () => {
    const fx = setup();
    pointerDown(fx.phone, 10, 10);
    expect(fx.editor.selectedId()).toBeTruthy();
    key('Escape');
    expect(fx.editor.selectedId()).toBeNull();
    pointerDown(fx.phone, 10, 10);
    pointerDown(document.body, 5, 500);
    expect(fx.editor.selectedId()).toBeNull();
  });
});

describe('drag independente (itens 5-7, 43)', () => {
  it('arrastar o telefone 150px move SÓ ele; undo/redo funcionam', () => {
    const fx = setup();
    pointerDown(fx.phone, 0, 0);
    pointerMove(150, 5);
    pointerUp(150, 5);

    expect(fx.phone.style.transform).toBe('translate3d(150px, 5px, 0)');
    expect(fx.whatsapp.style.transform).toBe('');
    expect((fx.whatsapp.getAttribute('style') || '')).toBe('');
    expect(fx.actions.style.transform).toBe('');
    expect(fx.editor.overridesSnapshot().elements[fx.phoneId]?.desktop).toEqual({ x: 150, y: 5 });
    expect(fx.lastOf('dirty')).toBeTruthy();
    expect(fx.editor.canUndo()).toBe(true);

    // Um drag = UMA entrada: um único undo desfaz tudo.
    expect(fx.editor.undo()).toBe(true);
    expect(fx.phone.style.transform).toBe('');
    expect(fx.editor.canUndo()).toBe(false);
    expect(fx.editor.canRedo()).toBe(true);
    expect(fx.editor.redo()).toBe(true);
    expect(fx.phone.style.transform).toBe('translate3d(150px, 5px, 0)');
  });

  it('clique logo após o drag é suprimido (não entra em edição)', () => {
    const fx = setup();
    pointerDown(fx.phone, 0, 0);
    pointerMove(150, 0);
    pointerUp(150, 0);
    expect(fx.editor.isEditingText()).toBe(false);
  });

  it('mover título e imagem também é independente (itens 44 A/B)', () => {
    const fx = setup();
    const titleId = fx.title.getAttribute(EDITOR_ID_ATTR) as string;
    const photoId = fx.photo.getAttribute(EDITOR_ID_ATTR) as string;
    fx.editor.selectById(titleId);
    pointerDown(fx.title, 0, 0);
    pointerMove(0, 40);
    pointerUp(0, 40);
    expect(fx.title.style.transform).toBe('translate3d(0px, 40px, 0)');
    expect(fx.phone.style.transform).toBe('');
    fx.editor.selectById(photoId);
    pointerDown(fx.photo, 0, 0);
    pointerMove(-30, 0);
    pointerUp(-30, 0);
    expect(fx.photo.style.transform).toBe('translate3d(-30px, 0px, 0)');
    expect(fx.title.style.transform).toBe('translate3d(0px, 40px, 0)');
    // Dois undos restauram tudo, na ordem.
    fx.editor.undo();
    expect(fx.photo.style.transform).toBe('');
    fx.editor.undo();
    expect(fx.title.style.transform).toBe('');
  });

  it('mover o container (seleção explícita) não cria transforms nos filhos', () => {
    const fx = setup();
    pointerDown(fx.actions, 0, 0);
    expect(fx.editor.selectedId()).toBe(fx.actions.getAttribute(EDITOR_ID_ATTR));
    pointerMove(20, 20);
    pointerUp(20, 20);
    expect(fx.actions.style.transform).toBe('translate3d(20px, 20px, 0)');
    expect(fx.phone.style.transform).toBe('');
    expect(fx.whatsapp.style.transform).toBe('');
  });

  it('alça de movimento arrasta o elemento selecionado (item 11)', () => {
    const fx = setup();
    fx.editor.selectById(fx.phoneId);
    const grip = document.getElementById('__site_edit_grip') as HTMLElement;
    grip.dispatchEvent(new window.MouseEvent('pointerdown', { bubbles: true, cancelable: true, clientX: 0, clientY: 0 }));
    pointerMove(60, 0);
    pointerUp(60, 0);
    expect(fx.phone.style.transform).toBe('translate3d(60px, 0px, 0)');
    expect(fx.whatsapp.style.transform).toBe('');
  });

  it('zoom 80%: 80px de mouse = 100px no layout e acompanha o ponteiro (item 9/J)', () => {
    const fx = setup();
    fx.editor.setViewport({ zoom: 0.8 });
    pointerDown(fx.phone, 0, 0);
    pointerMove(80, 40);
    pointerUp(80, 40);
    expect(fx.phone.style.transform).toBe('translate3d(100px, 50px, 0)');
  });
});

describe('edição de texto com histórico (itens 13, 18)', () => {
  it('clicar edita; blur commita UMA entrada; undo/redo (a/aa)', () => {
    const fx = setup();
    pointerDown(fx.title, 5, 5);
    pointerUp(5, 5);
    clickOn(fx.title);
    expect(fx.editor.isEditingText()).toBe(true);
    fx.title.innerHTML = 'aa';
    expect(fx.editor.commitTextEdit()).toBe(true);
    expect(fx.editor.canUndo()).toBe(true);
    expect(fx.editor.undo()).toBe(true);
    expect(fx.title.innerHTML).toBe('Titulo a');
    expect(fx.editor.redo()).toBe(true);
    expect(fx.title.innerHTML).toBe('aa');
  });

  it('Ctrl+Z durante a edição commita e desfaz de uma vez', () => {
    const fx = setup();
    pointerDown(fx.title, 5, 5);
    pointerUp(5, 5);
    fx.title.innerHTML = 'aa';
    key('z', { ctrlKey: true });
    expect(fx.title.innerHTML).toBe('Titulo a');
    expect(fx.editor.isEditingText()).toBe(false);
  });
});

describe('nudge pelo teclado (item 28)', () => {
  it('setas movem 1px, Shift 10px, grupo único no undo', () => {
    const fx = setup();
    fx.editor.selectById(fx.phoneId);
    key('ArrowRight');
    key('ArrowRight');
    key('ArrowDown', { shiftKey: true });
    expect(fx.phone.style.transform).toBe('translate3d(2px, 10px, 0)');
    fx.editor.undo();
    expect(fx.phone.style.transform).toBe('');
    fx.editor.redo();
    expect(fx.phone.style.transform).toBe('translate3d(2px, 10px, 0)');
    // Após a janela de coalescência, novo grupo.
    fx.advance(5000);
    key('ArrowRight');
    fx.editor.undo();
    expect(fx.phone.style.transform).toBe('translate3d(2px, 10px, 0)');
  });

  it('setas não movem elemento enquanto edita texto', () => {
    const fx = setup();
    pointerDown(fx.title, 5, 5);
    pointerUp(5, 5);
    expect(fx.editor.isEditingText()).toBe(true);
    key('ArrowRight');
    expect(fx.title.style.transform).toBe('');
  });
});

describe('atalhos undo/redo (item 20)', () => {
  it('Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y', () => {
    const fx = setup();
    pointerDown(fx.phone, 0, 0);
    pointerMove(50, 0);
    pointerUp(50, 0);
    key('z', { ctrlKey: true });
    expect(fx.phone.style.transform).toBe('');
    key('Z', { ctrlKey: true, shiftKey: true });
    expect(fx.phone.style.transform).toBe('translate3d(50px, 0px, 0)');
    key('z', { ctrlKey: true });
    key('y', { ctrlKey: true });
    expect(fx.phone.style.transform).toBe('translate3d(50px, 0px, 0)');
    key('z', {});
    expect(fx.phone.style.transform).toBe('translate3d(50px, 0px, 0)');
  });

  it('undo/redo via mensagens do Studio', () => {
    const fx = setup();
    pointerDown(fx.phone, 0, 0);
    pointerMove(50, 0);
    pointerUp(50, 0);
    fx.editor.handleParentMessage({ source: 'site-editor', type: 'undo' });
    expect(fx.phone.style.transform).toBe('');
    fx.editor.handleParentMessage({ source: 'site-editor', type: 'redo' });
    expect(fx.phone.style.transform).toBe('translate3d(50px, 0px, 0)');
  });
});

describe('breakpoints isolados (item 25/K)', () => {
  it('mover no desktop não afeta o mobile e vice-versa', () => {
    const fx = setup();
    pointerDown(fx.phone, 0, 0);
    pointerMove(150, 0);
    pointerUp(150, 0);
    fx.editor.setViewport({ breakpoint: 'mobile' });
    expect(fx.phone.style.transform).toBe('');
    pointerDown(fx.phone, 0, 0);
    pointerMove(0, 30);
    pointerUp(0, 30);
    const snap = fx.editor.overridesSnapshot().elements[fx.phoneId];
    expect(snap?.desktop).toEqual({ x: 150, y: 0 });
    expect(snap?.mobile).toEqual({ x: 0, y: 30 });
    fx.editor.setViewport({ breakpoint: 'desktop' });
    expect(fx.phone.style.transform).toBe('translate3d(150px, 0px, 0)');
    fx.editor.undo();
    // Undo desfaz o movimento mobile, desktop intacto.
    expect(fx.editor.overridesSnapshot().elements[fx.phoneId]?.desktop).toEqual({ x: 150, y: 0 });
  });
});

describe('link e imagem (itens 15, 30)', () => {
  it('edita href pela toolbar com undo/redo', () => {
    const fx = setup();
    fx.editor.selectById(fx.phoneId);
    clickBarButton('Link');
    const input = document.querySelector('#__site_edit_bar input') as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = 'https://novo.exemplo/contato';
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fx.phone.getAttribute('href')).toBe('https://novo.exemplo/contato');
    fx.editor.undo();
    expect(fx.phone.getAttribute('href')).toBe('tel:+5566996205890');
    fx.editor.redo();
    expect(fx.phone.getAttribute('href')).toBe('https://novo.exemplo/contato');
  });

  it('cancelar edição de link (✕) não altera o href', () => {
    const fx = setup();
    const before = fx.phone.getAttribute('href');
    fx.editor.selectById(fx.phoneId);
    clickBarButton('Link');
    const input = document.querySelector('#__site_edit_bar input') as HTMLInputElement;
    input.value = 'https://descartado.exemplo/';
    clickBarButton('✕');
    expect(fx.phone.getAttribute('href')).toBe(before);
    expect(fx.editor.canUndo()).toBe(false);
  });

  it('Escape no input de link cancela sem commitar', () => {
    const fx = setup();
    const before = fx.phone.getAttribute('href');
    fx.editor.selectById(fx.phoneId);
    clickBarButton('Link');
    const input = document.querySelector('#__site_edit_bar input') as HTMLInputElement;
    input.value = 'https://descartado.exemplo/';
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(fx.phone.getAttribute('href')).toBe(before);
    expect(fx.editor.canUndo()).toBe(false);
  });

  it('trocar imagem gera entrada e undo restaura src/alt', () => {
    const fx = setup();
    const photoId = fx.photo.getAttribute(EDITOR_ID_ATTR) as string;
    fx.editor.selectById(photoId);
    clickBarButton('Trocar imagem');
    expect(fx.lastOf('select-image')).toMatchObject({ targetId: photoId, src: 'a.jpg' });
    fx.editor.handleParentMessage({ source: 'site-editor', type: 'set-image', targetId: photoId, src: 'nova.jpg', alt: 'nova foto' });
    expect(fx.photo.getAttribute('src')).toBe('nova.jpg');
    fx.editor.undo();
    expect(fx.photo.getAttribute('src')).toBe('a.jpg');
    expect(fx.photo.getAttribute('alt')).toBe('foto');
  });
});

describe('serialize (itens 22, 46)', () => {
  it('salva limpo: mantém ids+estado, remove UI e transforms aplicados', () => {
    const fx = setup();
    document.head.insertAdjacentHTML('beforeend', '<style id="__site_css">.a{}</style>');
    document.body.insertAdjacentHTML('beforeend', '<script id="__site_js">var a=1;</script>');
    pointerDown(fx.phone, 0, 0);
    pointerMove(150, 0);
    pointerUp(150, 0);
    fx.editor.handleParentMessage({ source: 'site-editor', type: 'serialize' });
    const msg = fx.lastOf('serialized');
    expect(msg).toBeTruthy();
    if (msg?.type !== 'serialized') throw new Error('sem serialized');
    expect(msg.css).toBe('.a{}');
    expect(msg.js).toBe('var a=1;');
    expect(msg.html).toContain('data-editor-id');
    expect(msg.html).toContain('__site_editor_state');
    expect(msg.html).toContain('"x":150');
    expect(msg.html).not.toContain('__site_edit_root');
    expect(msg.html).not.toContain('__site_edit_script');
    expect(msg.html).not.toContain('translate3d');
    expect(msg.html).not.toContain('__site_css');
  });
});
