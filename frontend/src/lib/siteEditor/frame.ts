/**
 * Runtime de edição do preview (executa dentro do iframe, modo "Editar direto").
 *
 * Arquitetura:
 * - SelectionManager: clique (leaf-first) => exatamente um elemento; overlay
 *   visual (bounding box + etiqueta + alça) por cima, sem afetar o layout;
 * - DragManager: pointer events com threshold, transform individual
 *   `translate3d` SOMENTE no elemento arrastado, compensação de zoom,
 *   commit único no pointerup;
 * - HistoryManager (core): MOVE/TEXT/IMAGE/LINK com undo/redo;
 * - Persistence: OverridesStore por elementId+breakpoint no bloco JSON.
 *
 * Criado via `createEditor(doc, win, hooks)` para ser testável (jsdom).
 * Em produção o bundle é gerado por `entry-frame.ts`.
 */
import {
  applyOverrides,
  applyPosition,
  assignEditorIds,
  breakpointForWidth,
  clearEditorTransforms,
  describeElement,
  exceedsThreshold,
  getElementByEditorId,
  getEditableElements,
  HistoryManager,
  NUDGE_COALESCE_MS,
  NUDGE_PX,
  NUDGE_SHIFT_PX,
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
  type Breakpoint,
  type ElementInfo,
  type FrameToParent,
  type HistoryEntry,
  type ParentToFrame,
  type XY,
  EDITOR_ID_ATTR,
} from './core';

export interface EditorHooks {
  send(msg: FrameToParent): void;
  now(): number;
}

export interface EditorViewport {
  zoom: number;
  breakpoint: Breakpoint;
}

export interface EditorApi {
  destroy(): void;
  handleParentMessage(data: ParentToFrame): void;
  selectById(id: string | null): ElementInfo | null;
  selectedId(): string | null;
  selectedInfo(): ElementInfo | null;
  isEditingText(): boolean;
  commitTextEdit(): boolean;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  getViewport(): EditorViewport;
  setViewport(partial: Partial<EditorViewport>): void;
  overridesSnapshot(): { v: number; elements: Record<string, Partial<Record<Breakpoint, XY>>> };
}

interface DragSession {
  elementId: string;
  el: Element;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  base: XY;
  moved: boolean;
}

const ROOT_ID = '__site_edit_root';
const STYLE_ID = '__site_edit_style';
const SCRIPT_ID = '__site_edit_script';
const SUPPRESS_CLICK_MS = 150;

const EDIT_CSS = [
  '#__site_edit_root{position:fixed;inset:0;z-index:2147483647;pointer-events:none;font:12px Arial,sans-serif}',
  '#__site_edit_box{position:absolute;display:none;border:2px solid #087bea;border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.7),0 4px 18px rgba(8,123,234,.35)}',
  '#__site_edit_tag{position:absolute;display:none;align-items:center;gap:6px;background:#087bea;color:#fff;border-radius:6px;padding:3px 4px 3px 8px;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.3)}',
  '#__site_edit_tag span{max-width:220px;overflow:hidden;text-overflow:ellipsis}',
  '#__site_edit_grip{pointer-events:auto;border:0;background:#3b82f6;color:#fff;border-radius:4px;padding:4px 8px;cursor:grab;font:inherit;touch-action:none}',
  '#__site_edit_grip:active{cursor:grabbing}',
  '#__site_edit_bar{position:absolute;display:none;gap:2px;background:#111827;color:#fff;border-radius:8px;padding:3px;box-shadow:0 8px 24px rgba(0,0,0,.35);pointer-events:auto}',
  '#__site_edit_bar button{border:0;background:transparent;color:#fff;padding:6px 9px;border-radius:6px;cursor:pointer;font:inherit;white-space:nowrap}',
  '#__site_edit_bar button:hover{background:#374151}',
  '#__site_edit_bar input{background:#1f2937;border:1px solid #4b5563;color:#fff;border-radius:6px;padding:6px 8px;font:inherit;width:220px;outline:none}',
  '#__site_edit_guide_v,#__site_edit_guide_h{position:absolute;display:none;background:rgba(8,123,234,.55)}',
  '#__site_edit_guide_v{top:0;bottom:0;width:1px}',
  '#__site_edit_guide_h{left:0;right:0;height:1px}',
  '[data-site-editing]{outline:2px solid #087bea!important;outline-offset:2px}',
].join('');

function boxOf(el: Element, zoom: number): { left: number; top: number; width: number; height: number } {
  const r = el.getBoundingClientRect();
  return { left: r.left / zoom, top: r.top / zoom, width: r.width / zoom, height: r.height / zoom };
}

function elementPath(el: Element, doc: Document): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== doc.body && current !== doc.documentElement && parts.length < 4) {
    parts.unshift(current.tagName.toLowerCase());
    current = current.parentElement;
  }
  return parts.join(' > ');
}

export function createEditor(doc: Document, win: Window, hooks: EditorHooks): EditorApi {
  const history = new HistoryManager();
  let store: OverridesStore = new OverridesStore();
  let viewport: EditorViewport = { zoom: 1, breakpoint: 'desktop' };
  let selected: Element | null = null;
  let editing: Element | null = null;
  let editBefore = '';
  let drag: DragSession | null = null;
  let suppressClickUntil = 0;
  let pendingImageTarget: string | null = null;
  let linkEditing = false;
  let destroyed = false;
  /**
   * Foco programático (caret/input) pode disparar `blur` síncrono espúrio
   * em alguns ambientes (jsdom); nunca representa perda real da janela,
   * então é suprimido. Um blur real (alt-tab) jamais ocorre de forma
   * síncrona dentro de focus().
   */
  let suppressBlur = false;

  function withSuppressedBlur(fn: () => void): void {
    suppressBlur = true;
    try {
      fn();
    } finally {
      suppressBlur = false;
    }
  }

  // -- elementos da UI do editor -------------------------------------------
  const styleEl = doc.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = EDIT_CSS;
  doc.head.appendChild(styleEl);

  const root = doc.createElement('div');
  root.id = ROOT_ID;
  root.innerHTML =
    '<div id="__site_edit_guide_v"></div><div id="__site_edit_guide_h"></div>' +
    '<div id="__site_edit_box"></div>' +
    '<div id="__site_edit_tag"><span></span><button id="__site_edit_grip" type="button" title="Arrastar para mover" aria-label="Arrastar para mover">\u2922</button></div>' +
    '<div id="__site_edit_bar"></div>';
  doc.body.appendChild(root);

  const box = root.querySelector('#__site_edit_box') as HTMLElement;
  const tag = root.querySelector('#__site_edit_tag') as HTMLElement;
  const tagLabel = tag.querySelector('span') as HTMLElement;
  const grip = root.querySelector('#__site_edit_grip') as HTMLElement;
  const bar = root.querySelector('#__site_edit_bar') as HTMLElement;
  const guideV = root.querySelector('#__site_edit_guide_v') as HTMLElement;
  const guideH = root.querySelector('#__site_edit_guide_h') as HTMLElement;

  const emitHistory = (): void => {
    hooks.send({ source: 'site-edit', type: 'history-state', canUndo: history.canUndo(), canRedo: history.canRedo() });
  };
  const markDirty = (): void => {
    hooks.send({ source: 'site-edit', type: 'dirty' });
    emitHistory();
  };

  // -- seleção ---------------------------------------------------------------
  function hideOverlay(): void {
    box.style.display = 'none';
    tag.style.display = 'none';
    bar.style.display = 'none';
    guideV.style.display = 'none';
    guideH.style.display = 'none';
  }

  function updateOverlay(): void {
    if (!selected || !doc.body.contains(selected)) {
      selected = null;
      hideOverlay();
      return;
    }
    const info = describeElement(selected);
    const rect = boxOf(selected, viewport.zoom);
    box.style.display = 'block';
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${Math.max(0, rect.width)}px`;
    box.style.height = `${Math.max(0, rect.height)}px`;
    tagLabel.textContent = info.label;
    tag.title = elementPath(selected, doc);
    tag.style.display = 'flex';
    // Etiqueta e toolbar em lados opostos para nunca se sobreporem.
    const barHeight = bar.offsetHeight || 40;
    const barAbove = rect.top - barHeight - 8 >= 4;
    if (barAbove) {
      tag.style.top = `${rect.top + rect.height + 6}px`;
    } else {
      const tagTop = rect.top - 34;
      tag.style.top = `${tagTop < 4 ? rect.top + rect.height + 6 : tagTop}px`;
    }
    tag.style.left = `${Math.max(4, Math.min(rect.left, win.innerWidth / viewport.zoom - 260))}px`;
    positionBar(rect);
  }

  function barButton(label: string, title: string, onClick: () => void): HTMLButtonElement {
    const button = doc.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.title = title;
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    });
    return button;
  }

  function positionBar(rect: { left: number; top: number; width: number; height: number }): void {
    if (bar.style.display === 'none' || !bar.firstChild) return;
    const barHeight = bar.offsetHeight || 40;
    const above = rect.top - barHeight - 8;
    bar.style.top = `${above < 4 ? rect.top + rect.height + 8 : above}px`;
    bar.style.left = `${Math.max(4, Math.min(rect.left, win.innerWidth / viewport.zoom - 280))}px`;
  }

  function renderBar(): void {
    bar.innerHTML = '';
    if (!selected) {
      bar.style.display = 'none';
      return;
    }
    const info = describeElement(selected);
    if (linkEditing && info.kind === 'link') {
      renderLinkEditor();
      return;
    }
    if (editing) {
      bar.appendChild(barButton('Concluir', 'Finalizar edição (Esc)', () => finishEdit(true)));
    } else {
      if (info.kind === 'image') {
        bar.appendChild(
          barButton('Trocar imagem', 'Buscar outra imagem', () => {
            const id = selected?.getAttribute(EDITOR_ID_ATTR);
            if (!id || !selected) return;
            pendingImageTarget = id;
            hooks.send({
              source: 'site-edit',
              type: 'select-image',
              targetId: id,
              src: selected.getAttribute('src') || '',
              alt: selected.getAttribute('alt') || '',
            });
          }),
        );
      }
      if (info.kind === 'link') {
        bar.appendChild(barButton('Link', 'Editar o destino do link', () => startLinkEdit()));
      }
      bar.appendChild(barButton('Concluir', 'Limpar seleção (Esc)', () => clearSelection()));
    }
    bar.style.display = 'flex';
    if (selected) positionBar(boxOf(selected, viewport.zoom));
  }

  function select(el: Element | null): ElementInfo | null {
    if (editing) finishEdit(true);
    linkEditing = false;
    if (selected) selected.removeAttribute('data-site-editing');
    selected = el && doc.body.contains(el) ? el : null;
    if (!selected) {
      hideOverlay();
      return null;
    }
    const info = describeElement(selected);
    updateOverlay();
    renderBar();
    return info;
  }

  function clearSelection(): void {
    if (editing) finishEdit(true);
    linkEditing = false;
    selected = null;
    hideOverlay();
    bar.innerHTML = '';
    bar.style.display = 'none';
  }

  // -- edição de texto ---------------------------------------------------------
  function placeCaret(el: Element, clientX?: number, clientY?: number): void {
    try {
      const htmlEl = el as HTMLElement;
      withSuppressedBlur(() => htmlEl.focus({ preventScroll: true } as FocusOptions));
      const selection = doc.getSelection();
      if (!selection) return;
      let range: Range | null = null;
      if (clientX !== undefined && clientY !== undefined) {
        const docAny = doc as Document & {
          caretRangeFromPoint?: (x: number, y: number) => Range | null;
          caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
        };
        if (typeof docAny.caretRangeFromPoint === 'function') range = docAny.caretRangeFromPoint(clientX, clientY);
        else if (typeof docAny.caretPositionFromPoint === 'function') {
          const pos = docAny.caretPositionFromPoint(clientX, clientY);
          if (pos) {
            range = doc.createRange();
            range.setStart(pos.offsetNode, pos.offset);
          }
        }
      }
      if (!range || !el.contains(range.startContainer)) {
        range = doc.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    } catch {
      /* ambiente sem Selection (testes): segue sem caret */
    }
  }

  function startEdit(el: Element, clientX?: number, clientY?: number): void {
    const info = describeElement(el);
    if (!info.textEditable || editing === el) return;
    if (selected !== el) select(el);
    editing = el;
    editBefore = snapshotText(el);
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('data-site-editing', '');
    placeCaret(el, clientX, clientY);
    renderBar();
    updateOverlay();
  }

  /** Finaliza a edição; retorna true se gerou entrada no histórico. */
  function finishEdit(commit: boolean): boolean {
    if (!editing) return false;
    const el = editing;
    editing = null;
    el.removeAttribute('contenteditable');
    el.removeAttribute('data-site-editing');
    let changed = false;
    if (commit) {
      const after = snapshotText(el);
      if (after !== editBefore) {
        const id = el.getAttribute(EDITOR_ID_ATTR) || '';
        history.push({ type: 'TEXT', elementId: id, label: describeElement(el).label, before: editBefore, after, at: hooks.now() });
        markDirty();
        changed = true;
      }
    }
    if (selected === el) {
      renderBar();
      updateOverlay();
    }
    return changed;
  }

  // -- edição de link ------------------------------------------------------------
  function startLinkEdit(): void {
    if (!selected || describeElement(selected).kind !== 'link') return;
    linkEditing = true;
    renderLinkEditor();
  }

  function renderLinkEditor(): void {
    if (!selected) return;
    bar.innerHTML = '';
    const input = doc.createElement('input');
    input.type = 'text';
    input.value = snapshotHref(selected);
    input.placeholder = 'https://, tel:, mailto: ou #seção';
    input.setAttribute('aria-label', 'Destino do link');
    const commit = (): void => {
      // Blur após commit/cancel é no-op (linkEditing já false).
      if (!linkEditing || !selected) {
        linkEditing = false;
        return;
      }
      const next = input.value.trim();
      const before = snapshotHref(selected);
      linkEditing = false;
      if (next !== before) {
        const id = selected.getAttribute(EDITOR_ID_ATTR) || '';
        restoreHref(selected, next);
        history.push({ type: 'LINK', elementId: id, label: describeElement(selected).label, before, after: next, at: hooks.now() });
        markDirty();
      }
      renderBar();
      updateOverlay();
    };
    const cancel = (): void => {
      linkEditing = false;
      renderBar();
    };
    input.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
      }
    });
    input.addEventListener('blur', () => commit());
    bar.appendChild(input);
    bar.appendChild(barButton('OK', 'Aplicar link (Enter)', commit));
    const cancelButton = bar.appendChild(barButton('✕', 'Cancelar (Esc)', cancel));
    // Evita que o mousedown tire o foco (blur commit) antes do clique em ✕.
    cancelButton.addEventListener('mousedown', event => event.preventDefault());
    bar.style.display = 'flex';
    positionBar(boxOf(selected, viewport.zoom));
    try {
      withSuppressedBlur(() => {
        input.focus();
        input.select();
      });
    } catch {
      /* noop */
    }
  }

  // -- drag ----------------------------------------------------------------------
  function currentPos(elementId: string): XY {
    return store.get(elementId, viewport.breakpoint);
  }

  function beginPotentialDrag(el: Element, clientX: number, clientY: number, pointerId: number): void {
    const id = el.getAttribute(EDITOR_ID_ATTR);
    if (!id) return;
    drag = { elementId: id, el, pointerId, startClientX: clientX, startClientY: clientY, base: currentPos(id), moved: false };
    try {
      (el as HTMLElement).setPointerCapture?.(pointerId);
    } catch {
      /* jsdom / navegadores sem capture */
    }
  }

  function updateGuides(el: Element): void {
    guideV.style.display = 'none';
    guideH.style.display = 'none';
    const zoom = viewport.zoom;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left / zoom + rect.width / zoom / 2;
    const centerY = rect.top / zoom + rect.height / zoom / 2;
    const canvasX = doc.documentElement.clientWidth / 2;
    const canvasY = win.innerHeight / 2 / zoom;
    if (Math.abs(centerX - canvasX) * zoom <= 5) {
      guideV.style.display = 'block';
      guideV.style.left = `${canvasX}px`;
    }
    if (Math.abs(centerY - canvasY) * zoom <= 5) {
      guideH.style.display = 'block';
      guideH.style.top = `${canvasY}px`;
    }
  }

  function moveDrag(clientX: number, clientY: number): void {
    if (!drag) return;
    const dxScreen = clientX - drag.startClientX;
    const dyScreen = clientY - drag.startClientY;
    if (!drag.moved) {
      if (!exceedsThreshold(dxScreen, dyScreen)) return;
      drag.moved = true;
      if (editing) finishEdit(true);
    }
    const next = roundPosition({
      x: drag.base.x + toDocDelta(dxScreen, viewport.zoom),
      y: drag.base.y + toDocDelta(dyScreen, viewport.zoom),
    });
    // Preview ao vivo SOMENTE no elemento arrastado: irmãos e pai intactos.
    applyPosition(drag.el, next);
    updateOverlay();
    updateGuides(drag.el);
  }

  function endDrag(clientX: number, clientY: number, cancelled: boolean): boolean {
    if (!drag) return false;
    const session = drag;
    drag = null;
    guideV.style.display = 'none';
    guideH.style.display = 'none';
    if (cancelled || !session.moved) {
      if (session.moved) applyPosition(session.el, session.base);
      updateOverlay();
      return false;
    }
    const next = roundPosition({
      x: session.base.x + toDocDelta(clientX - session.startClientX, viewport.zoom),
      y: session.base.y + toDocDelta(clientY - session.startClientY, viewport.zoom),
    });
    applyPosition(session.el, next);
    const bp = viewport.breakpoint;
    if (next.x !== session.base.x || next.y !== session.base.y) {
      // UM drag = UMA entrada no histórico (preview não gera entradas).
      history.push({
        type: 'MOVE',
        elementId: session.elementId,
        label: describeElement(session.el).label,
        before: { ...session.base, bp },
        after: { ...next, bp },
        at: hooks.now(),
      });
      store.set(session.elementId, bp, next);
      writeStateBlock(doc, store);
      markDirty();
    }
    suppressClickUntil = hooks.now() + SUPPRESS_CLICK_MS;
    updateOverlay();
    return true;
  }

  // -- undo / redo -----------------------------------------------------------------
  function lookup(entry: HistoryEntry): Element | null {
    const el = getElementByEditorId(doc, entry.elementId);
    if (el) return el;
    // Fallback: id pode ter mudado após regeneração parcial — não quebra o histórico.
    return null;
  }

  function applyEntry(entry: HistoryEntry, side: 'before' | 'after'): void {
    const el = lookup(entry);
    if (!el) return;
    if (entry.type === 'MOVE') {
      const pos = side === 'before' ? entry.before : entry.after;
      const xy = pos as XY & { bp: Breakpoint };
      store.set(entry.elementId, xy.bp, { x: xy.x, y: xy.y });
      writeStateBlock(doc, store);
      if (xy.bp === viewport.breakpoint) applyPosition(el, { x: xy.x, y: xy.y });
    } else if (entry.type === 'TEXT') {
      restoreText(el, String(side === 'before' ? entry.before : entry.after));
    } else if (entry.type === 'IMAGE') {
      restoreImage(el, (side === 'before' ? entry.before : entry.after) as { src: string; alt: string });
    } else if (entry.type === 'LINK') {
      restoreHref(el, String(side === 'before' ? entry.before : entry.after));
    }
  }

  function doUndo(): boolean {
    if (editing) finishEdit(true);
    const entry = history.undo();
    if (!entry) return false;
    applyEntry(entry, 'before');
    if (selected && !doc.body.contains(selected)) selected = null;
    updateOverlay();
    renderBar();
    markDirty();
    return true;
  }

  function doRedo(): boolean {
    if (editing) finishEdit(true);
    const entry = history.redo();
    if (!entry) return false;
    applyEntry(entry, 'after');
    updateOverlay();
    renderBar();
    markDirty();
    return true;
  }

  // -- imagem via Studio ---------------------------------------------------------------
  function handleSetImage(targetId: string, src: string, alt: string): void {
    if (!src) return;
    // targetId ecoado pelo Studio; fallback para o alvo pendente local.
    const el = getElementByEditorId(doc, targetId || pendingImageTarget || '');
    if (!el || el.tagName !== 'IMG') return;
    const id = el.getAttribute(EDITOR_ID_ATTR) || targetId || pendingImageTarget || '';
    const before = snapshotImage(el);
    if (before.src === src && before.alt === alt) return;
    restoreImage(el, { src, alt });
    history.push({ type: 'IMAGE', elementId: id, label: describeElement(el).label, before, after: { src, alt }, at: hooks.now() });
    pendingImageTarget = null;
    markDirty();
    updateOverlay();
  }

  // -- listeners --------------------------------------------------------------------------
  function onPointerDown(event: PointerEvent): void {
    if (destroyed) return;
    const target = event.target as Node | null;
    if (target && (target as Element).closest?.(`#${ROOT_ID}`)) return; // UI do editor tem handlers próprios
    const targetEl = target && (target as Element).nodeType === 1 ? (target as Element) : (target?.parentElement ?? null);
    if (editing && targetEl && editing.contains(targetEl)) return; // caret continua trabalhando
    if (editing) finishEdit(true);
    if (!target) return;
    const resolved = resolveSelectable(target, doc, event.altKey);
    if (!resolved) {
      if ((event.target as Element)?.nodeType === 1) clearSelection();
      return;
    }
    // Suprime o drag-and-drop nativo (ghost image), seleção de texto e foco
    // automático: sem isso o browser assume o gesto e os pointermove param
    // de chegar (o DnD nativo emite pointercancel). Foco/caret são manuais.
    event.preventDefault();
    select(resolved);
    beginPotentialDrag(resolved, event.clientX, event.clientY, event.pointerId);
  }

  function onPointerMove(event: PointerEvent): void {
    if (drag && (event.pointerId === drag.pointerId || event.pointerId === undefined)) moveDrag(event.clientX, event.clientY);
  }

  function onPointerUp(event: PointerEvent): void {
    if (!drag) return;
    const wasDrag = endDrag(event.clientX, event.clientY, false);
    if (!wasDrag && selected) {
      // Clique (sem arrasto) em texto => entra em edição inline.
      const info = describeElement(selected);
      if (info.textEditable && !editing) startEdit(selected, event.clientX, event.clientY);
    }
  }

  function onClick(event: MouseEvent): void {
    if (hooks.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const target = event.target as Element | null;
    if (target && target.closest?.(`#${ROOT_ID}`)) return;
    // Modo edição: links/botões selecionam, nunca navegam.
    event.preventDefault();
    event.stopPropagation();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (destroyed) return;
    const active = doc.activeElement as HTMLElement | null;
    const inLinkInput = linkEditing && active && active.tagName === 'INPUT' && bar.contains(active);
    const mod = event.ctrlKey || event.metaKey;
    if (mod && (event.key === 'z' || event.key === 'Z')) {
      if (inLinkInput) return; // input nativo preservado
      event.preventDefault();
      if (event.shiftKey) doRedo();
      else doUndo();
      return;
    }
    if (mod && (event.key === 'y' || event.key === 'Y')) {
      if (inLinkInput) return;
      event.preventDefault();
      doRedo();
      return;
    }
    if (event.key === 'Escape') {
      if (inLinkInput) return; // o input trata o próprio Esc
      event.preventDefault();
      if (editing) finishEdit(true);
      else if (linkEditing) {
        linkEditing = false;
        renderBar();
      } else clearSelection();
      return;
    }
    if (editing) {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        finishEdit(true);
      }
      return; // setas digitam/movem caret, não movem o elemento
    }
    if (inLinkInput || !selected) return;
    if (event.key === 'Enter' && describeElement(selected).textEditable) {
      event.preventDefault();
      startEdit(selected);
      return;
    }
    const step = event.shiftKey ? NUDGE_SHIFT_PX : NUDGE_PX;
    let dx = 0;
    let dy = 0;
    if (event.key === 'ArrowLeft') dx = -step;
    else if (event.key === 'ArrowRight') dx = step;
    else if (event.key === 'ArrowUp') dy = -step;
    else if (event.key === 'ArrowDown') dy = step;
    else return;
    event.preventDefault();
    const id = selected.getAttribute(EDITOR_ID_ATTR);
    if (!id) return;
    const bp = viewport.breakpoint;
    const base = store.get(id, bp);
    const next = roundPosition({ x: base.x + dx, y: base.y + dy });
    applyPosition(selected, next);
    store.set(id, bp, next);
    writeStateBlock(doc, store);
    // Nudges próximos fundem-se numa única entrada (Ctrl+Z desfaz o grupo).
    history.pushCoalesced(
      {
        type: 'MOVE',
        elementId: id,
        label: describeElement(selected).label,
        before: { ...base, bp },
        after: { ...next, bp },
        at: hooks.now(),
      },
      `nudge:${id}:${bp}`,
      NUDGE_COALESCE_MS,
    );
    markDirty();
    updateOverlay();
  }

  function onFocusOut(event: FocusEvent): void {
    if (editing && event.target === editing) finishEdit(true);
  }

  function onBlur(): void {
    if (suppressBlur) return;
    if (drag && drag.moved) {
      const session = drag;
      drag = null;
      applyPosition(session.el, session.base);
      updateOverlay();
    } else {
      drag = null;
    }
    if (editing) finishEdit(true);
  }

  function onSubmit(event: Event): void {
    event.preventDefault();
  }

  /** Cinturão e suspensórios: nenhum DnD nativo dentro do modo edição. */
  function onDragStart(event: Event): void {
    event.preventDefault();
  }

  function onResize(): void {
    if (selected) updateOverlay();
  }

  function onMessage(event: MessageEvent): void {
    const data = event.data as ParentToFrame | null;
    if (!data || data.source !== 'site-editor') return;
    handleParentMessage(data);
  }

  function handleParentMessage(data: ParentToFrame): void {
    if (destroyed) return;
    if (data.type === 'serialize') serialize();
    else if (data.type === 'set-image') handleSetImage(data.targetId, data.src, data.alt ?? '');
    else if (data.type === 'undo') doUndo();
    else if (data.type === 'redo') doRedo();
    else if (data.type === 'viewport') {
      const next: EditorViewport = {
        zoom: Number.isFinite(data.zoom) && data.zoom > 0 ? data.zoom : viewport.zoom,
        breakpoint: data.breakpoint ?? viewport.breakpoint,
      };
      const bpChanged = next.breakpoint !== viewport.breakpoint;
      viewport = next;
      if (bpChanged) {
        // Trocar de breakpoint reaplica SOMENTE os offsets daquele contexto.
        if (editing) finishEdit(true);
        applyOverrides(doc, store, viewport.breakpoint);
      }
      updateOverlay();
    }
  }

  // -- serialize ------------------------------------------------------------------------------
  function serialize(): void {
    if (editing) finishEdit(true);
    clearSelection();
    clearEditorTransforms(doc);
    writeStateBlock(doc, store);
    const cssEl = doc.getElementById('__site_css');
    const jsEl = doc.getElementById('__site_js');
    const css = cssEl ? cssEl.textContent || '' : '';
    const js = jsEl ? jsEl.textContent || '' : '';
    const clone = doc.documentElement.cloneNode(true) as HTMLElement;
    const removeById = (id: string): void => {
      const node = clone.querySelector(`#${id}`);
      if (node?.parentNode) node.parentNode.removeChild(node);
    };
    for (const id of ['__site_edit_style', '__site_edit_root', '__site_css', '__site_js', SCRIPT_ID, '__site_guard', '__site_anchor']) {
      removeById(id);
    }
    const editable = clone.querySelectorAll(`[${EDITOR_ID_ATTR}]`);
    for (const el of Array.from(editable)) stripEditorAttributes(el);
    hooks.send({ source: 'site-edit', type: 'serialized', html: `<!doctype html>\n${clone.outerHTML}`, css, js });
  }

  // -- boot ------------------------------------------------------------------------------------------------
  assignEditorIds(doc);
  store = readStateBlock(doc);
  try {
    viewport = { zoom: 1, breakpoint: breakpointForWidth(win.innerWidth || 1200) };
  } catch {
    viewport = { zoom: 1, breakpoint: 'desktop' };
  }
  applyOverrides(doc, store, viewport.breakpoint);

  doc.addEventListener('pointerdown', onPointerDown as EventListener, true);
  doc.addEventListener('pointermove', onPointerMove as EventListener, true);
  doc.addEventListener('pointerup', onPointerUp as EventListener, true);
  doc.addEventListener('pointercancel', onBlur as EventListener, true);
  doc.addEventListener('click', onClick as EventListener, true);
  doc.addEventListener('keydown', onKeyDown as EventListener, true);
  doc.addEventListener('submit', onSubmit as EventListener, true);
  doc.addEventListener('dragstart', onDragStart as EventListener, true);
  doc.addEventListener('focusout', onFocusOut as EventListener);
  win.addEventListener('blur', onBlur);
  win.addEventListener('resize', onResize);
  win.addEventListener('message', onMessage as EventListener);
  grip.addEventListener('pointerdown', event => {
    event.preventDefault();
    event.stopPropagation();
    if (selected) beginPotentialDrag(selected, event.clientX, event.clientY, event.pointerId);
  });

  hooks.send({ source: 'site-edit', type: 'ready' });
  emitHistory();

  return {
    destroy() {
      destroyed = true;
      doc.removeEventListener('pointerdown', onPointerDown as EventListener, true);
      doc.removeEventListener('pointermove', onPointerMove as EventListener, true);
      doc.removeEventListener('pointerup', onPointerUp as EventListener, true);
      doc.removeEventListener('pointercancel', onBlur as EventListener, true);
      doc.removeEventListener('click', onClick as EventListener, true);
      doc.removeEventListener('keydown', onKeyDown as EventListener, true);
      doc.removeEventListener('submit', onSubmit as EventListener, true);
      doc.removeEventListener('dragstart', onDragStart as EventListener, true);
      doc.removeEventListener('focusout', onFocusOut as EventListener);
      win.removeEventListener('blur', onBlur);
      win.removeEventListener('resize', onResize);
      win.removeEventListener('message', onMessage as EventListener);
      styleEl.remove();
      root.remove();
    },
    handleParentMessage,
    selectById(id: string | null) {
      if (!id) return select(null);
      return select(getElementByEditorId(doc, id));
    },
    selectedId() {
      return selected?.getAttribute(EDITOR_ID_ATTR) ?? null;
    },
    selectedInfo() {
      return selected ? describeElement(selected) : null;
    },
    isEditingText() {
      return editing !== null;
    },
    commitTextEdit() {
      return finishEdit(true);
    },
    undo: doUndo,
    redo: doRedo,
    canUndo: () => history.canUndo(),
    canRedo: () => history.canRedo(),
    getViewport: () => ({ ...viewport }),
    setViewport(partial) {
      handleParentMessage({
        source: 'site-editor',
        type: 'viewport',
        zoom: partial.zoom ?? viewport.zoom,
        breakpoint: partial.breakpoint ?? viewport.breakpoint,
      });
    },
    overridesSnapshot: () => store.toJSON(),
  };
}

/** Elementos com identidade — utilidade para depuração/testes. */
export function editorElementCount(doc: Document): number {
  return getEditableElements(doc).length;
}
