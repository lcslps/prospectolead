/**
 * Núcleo do editor visual (runtime do iframe + lógica testável).
 *
 * Este módulo é framework-free e não importa nada: ele é empacotado com
 * esbuild (via plugin do Vite, módulos virtuais `virtual:site-editor-*`)
 * e injetado como script inline no iframe do preview. Os mesmos exports
 * são importados diretamente pelos testes unitários (vitest + jsdom),
 * de modo que os testes exercitam exatamente o código embarcado.
 *
 * Conceitos centrais:
 * - cada elemento editável possui `data-editor-id` estável e único;
 * - posições são offsets individuais (`translate3d`) por elemento e por
 *   breakpoint, guardados em `OverridesStore` (persistido no bloco JSON
 *   `#__site_editor_state` dentro do próprio HTML);
 * - mutações passam pelo `HistoryManager` (undo/redo em memória, sessão).
 */

export const EDITOR_ID_ATTR = 'data-editor-id';
export const EDITOR_STATE_ID = '__site_editor_state';
export const EDITOR_STATE_VERSION = 1;

export const HISTORY_LIMIT = 100;
export const DRAG_THRESHOLD_PX = 4;
export const NUDGE_PX = 1;
export const NUDGE_SHIFT_PX = 10;
export const NUDGE_COALESCE_MS = 1000;
export const GUIDE_SNAP_PX = 5;

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';
export const BREAKPOINTS: Breakpoint[] = ['desktop', 'tablet', 'mobile'];

export interface XY {
  x: number;
  y: number;
}

export type ElementKind =
  | 'image'
  | 'link'
  | 'button'
  | 'heading'
  | 'text'
  | 'media'
  | 'container'
  | 'element';

export interface ElementInfo {
  kind: ElementKind;
  /** Pode receber edição inline de texto. */
  textEditable: boolean;
  /** É um agrupador estrutural (section/div/...) em vez de folha. */
  container: boolean;
  /** Rótulo amigável pt-BR para overlay/toolbar. */
  label: string;
}

export type HistoryType = 'MOVE' | 'TEXT' | 'IMAGE' | 'LINK';

export interface HistoryEntry {
  type: HistoryType;
  elementId: string;
  label: string;
  before: unknown;
  after: unknown;
  at: number;
  /** Chave interna de coalescência (nudge); não faz parte do contrato. */
  mergeKey?: string;
}

/** Mensagens do iframe (runtime) para o Studio (janela pai). */
export type FrameToParent =
  | { source: 'site-edit'; type: 'ready' }
  | { source: 'site-edit'; type: 'dirty' }
  | { source: 'site-edit'; type: 'select-image'; targetId: string; src: string; alt: string }
  | { source: 'site-edit'; type: 'history-state'; canUndo: boolean; canRedo: boolean }
  | { source: 'site-edit'; type: 'serialized'; html: string; css: string; js: string };

/** Mensagens do Studio para o iframe. */
export type ParentToFrame =
  | { source: 'site-editor'; type: 'serialize' }
  | { source: 'site-editor'; type: 'set-image'; targetId: string; src: string; alt: string }
  | { source: 'site-editor'; type: 'undo' }
  | { source: 'site-editor'; type: 'redo' }
  | { source: 'site-editor'; type: 'viewport'; zoom: number; breakpoint: Breakpoint };

// ---------------------------------------------------------------------------
// Breakpoints / geometria
// ---------------------------------------------------------------------------

/** Mapeia largura (px) para breakpoint. Usado pelo preview e pelo site publicado. */
export function breakpointForWidth(width: number): Breakpoint {
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Converte um deslocamento medido em pixels de tela (clientX/clientY) para
 * pixels do documento, compensando o zoom do preview.
 * Ex.: 100px de mouse com zoom 0.8 => 125px no layout.
 */
export function toDocDelta(screenDelta: number, zoom: number): number {
  const z = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  return screenDelta / z;
}

/** Diferencia clique de drag: só inicia o arrasto após o threshold. */
export function exceedsThreshold(dx: number, dy: number, threshold = DRAG_THRESHOLD_PX): boolean {
  return Math.hypot(dx, dy) > threshold;
}

/** Arredonda para posicionamento preciso (1px) sem grid rígido. */
export function roundPosition(pos: XY): XY {
  return { x: Math.round(pos.x), y: Math.round(pos.y) };
}

// ---------------------------------------------------------------------------
// Identidade dos elementos
// ---------------------------------------------------------------------------

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'META', 'TITLE', 'LINK', 'BASE']);
const ID_PATTERN = /^[A-Za-z][\w:.-]*$/;

function isEditorUi(el: Element): boolean {
  if (el.id === '__site_edit_root' || el.id === '__site_edit_style') return true;
  if (typeof el.closest === 'function' && el.closest('#__site_edit_root')) return true;
  return false;
}

/**
 * Garante `data-editor-id` único e estável para cada elemento editável.
 * - Preserva ids existentes válidos (persistidos no HTML após o 1º save).
 * - Gera `ed-<n>` determinístico em ordem de documento para o restante,
 *   de modo que o mesmo HTML sempre recebe os mesmos ids.
 * Retorna a lista de ids em ordem de documento.
 */
export function assignEditorIds(doc: Document): string[] {
  const seen = new Set<string>();
  const assigned: string[] = [];
  let counter = 0;

  const claim = (el: Element, id: string): void => {
    el.setAttribute(EDITOR_ID_ATTR, id);
    seen.add(id);
    assigned.push(id);
  };

  const elements = doc.body ? Array.from(doc.body.getElementsByTagName('*')) : [];
  for (const el of elements) {
    if (el.nodeType !== 1) continue;
    if (SKIP_TAGS.has(el.tagName)) continue;
    if (isEditorUi(el)) continue;
    const existing = (el.getAttribute(EDITOR_ID_ATTR) || '').trim();
    if (existing && ID_PATTERN.test(existing) && !seen.has(existing)) {
      claim(el, existing);
      continue;
    }
    counter += 1;
    let candidate = `ed-${counter.toString(36)}`;
    while (seen.has(candidate)) {
      counter += 1;
      candidate = `ed-${counter.toString(36)}`;
    }
    claim(el, candidate);
  }
  return assigned;
}

/** Todos os elementos que possuem identidade de editor. */
export function getEditableElements(doc: Document): Element[] {
  if (!doc.body) return [];
  return Array.from(doc.body.querySelectorAll(`[${EDITOR_ID_ATTR}]`)).filter(el => !isEditorUi(el));
}

/** Localiza um elemento pelo seu id de editor. */
export function getElementByEditorId(doc: Document, id: string): Element | null {
  if (!id || !doc.body) return null;
  // Seguro sem CSS.escape: ids válidos (ID_PATTERN) nunca contêm aspas/barras.
  if (!ID_PATTERN.test(id)) return null;
  return doc.body.querySelector(`[${EDITOR_ID_ATTR}="${id}"]`);
}

// ---------------------------------------------------------------------------
// Descrição / seleção leaf-first
// ---------------------------------------------------------------------------

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
const TEXT_TAGS = new Set([
  'P', 'SPAN', 'LI', 'LABEL', 'SMALL', 'STRONG', 'EM', 'B', 'I', 'U', 'CODE',
  'BLOCKQUOTE', 'FIGCAPTION', 'DT', 'DD', 'LEGEND', 'TIME', 'ADDRESS', 'Q', 'CITE',
]);
const CONTAINER_TAGS = new Set([
  'SECTION', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'ARTICLE', 'ASIDE', 'FORM',
  'DIV', 'UL', 'OL', 'DL', 'FIGURE', 'FIELDSET', 'TABLE', 'TBODY', 'THEAD', 'TR', 'TD', 'TH',
]);
const LEAF_BOUNDARY_TAGS = new Set(['A', 'BUTTON']);

const KIND_LABELS: Record<ElementKind, string> = {
  image: 'Imagem',
  link: 'Link',
  button: 'Botão',
  heading: 'Título',
  text: 'Texto',
  media: 'Mídia',
  container: 'Bloco',
  element: 'Elemento',
};

function textSnippet(el: Element, max = 28): string {
  const raw = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  return raw.length > max ? `${raw.slice(0, max)}…` : raw;
}

/** Classifica um elemento para seleção, overlay e toolbar. */
export function describeElement(el: Element): ElementInfo {
  const tag = el.tagName;
  if (tag === 'IMG') {
    const alt = (el.getAttribute('alt') || '').trim();
    return { kind: 'image', textEditable: false, container: false, label: alt ? `Imagem · ${alt.slice(0, 32)}` : 'Imagem' };
  }
  if (tag === 'A') {
    const snippet = textSnippet(el);
    return { kind: 'link', textEditable: true, container: false, label: snippet ? `Link · ${snippet}` : 'Link' };
  }
  if (tag === 'BUTTON') {
    const snippet = textSnippet(el);
    return { kind: 'button', textEditable: true, container: false, label: snippet ? `Botão · ${snippet}` : 'Botão' };
  }
  if (HEADING_TAGS.has(tag)) {
    const snippet = textSnippet(el);
    return { kind: 'heading', textEditable: true, container: false, label: snippet ? `Título · ${snippet}` : 'Título' };
  }
  if (tag === 'VIDEO' || tag === 'AUDIO' || tag === 'IFRAME' || tag === 'CANVAS') {
    return { kind: 'media', textEditable: false, container: false, label: KIND_LABELS.media };
  }
  if (TEXT_TAGS.has(tag)) {
    const snippet = textSnippet(el);
    return { kind: 'text', textEditable: true, container: false, label: snippet ? `Texto · ${snippet}` : 'Texto' };
  }
  if (CONTAINER_TAGS.has(tag)) {
    return { kind: 'container', textEditable: false, container: true, label: KIND_LABELS.container };
  }
  const snippet = textSnippet(el);
  return {
    kind: 'element',
    textEditable: snippet.length > 0 && el.children.length === 0,
    container: false,
    label: snippet ? `${KIND_LABELS.element} · ${snippet}` : KIND_LABELS.element,
  };
}

function asElement(node: Node | null, doc: Document): Element | null {
  if (!node) return null;
  if (node.nodeType === 1) return node as Element;
  if (node.nodeType === 3 || node.nodeType === 8) return node.parentElement;
  void doc;
  return null;
}

/**
 * Resolve o elemento selecionável a partir do alvo do clique (leaf-first).
 *
 * - IMG => a própria imagem (só ela se move);
 * - A/BUTTON => o próprio link/botão (não spans internos, não o container);
 * - demais folhas de texto => a folha clicada;
 * - área vazia de container/section => o container (seleção explícita);
 * - `preferParent` (Alt+clique) => o ancestral selecionável acima da folha.
 *
 * Nunca retorna elementos da UI do editor, <body> ou <html>.
 */
export function resolveSelectable(target: Node | null, doc: Document, preferParent = false): Element | null {
  let node = asElement(target, doc);
  if (!node || !doc.body) return null;
  if (isEditorUi(node)) return null;

  const leaf = (el: Element): Element | null => {
    let current: Element | null = el;
    let candidate: Element | null = null;
    while (current && current !== doc.body && current !== doc.documentElement) {
      if (isEditorUi(current)) return null;
      const tag = current.tagName;
      if (tag === 'IMG') return current;
      // A/BUTTON são fronteiras: vencem spans/textos internos.
      if (LEAF_BOUNDARY_TAGS.has(tag)) return current;
      if (!candidate && (HEADING_TAGS.has(tag) || TEXT_TAGS.has(tag))) candidate = current;
      if (!candidate && (tag === 'VIDEO' || tag === 'AUDIO')) candidate = current;
      current = current.parentElement;
    }
    return candidate;
  };

  const container = (el: Element): Element | null => {
    let current: Element | null = el;
    while (current && current !== doc.body && current !== doc.documentElement) {
      if (isEditorUi(current)) return null;
      if (CONTAINER_TAGS.has(current.tagName) || LEAF_BOUNDARY_TAGS.has(current.tagName)) return current;
      current = current.parentElement;
    }
    return null;
  };

  const found = leaf(node);
  if (!found) {
    // Clique em área vazia: seleciona o container explícito (ou nada, se foi no body).
    if (node === doc.body || node === doc.documentElement) return null;
    return container(node);
  }
  if (!preferParent) return found;
  // Alt+clique: sobe um nível — pai selecionável do elemento folha.
  const parent = found.parentElement;
  if (!parent || parent === doc.body || parent === doc.documentElement) return found;
  return container(parent) || found;
}

// ---------------------------------------------------------------------------
// HistoryManager (undo/redo em memória, por sessão de edição)
// ---------------------------------------------------------------------------

export class HistoryManager {
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private readonly limit: number;

  constructor(limit = HISTORY_LIMIT) {
    this.limit = limit > 0 ? limit : HISTORY_LIMIT;
  }

  /** Registra uma alteração lógica. Qualquer push limpa o redo (item 19). */
  push(entry: Omit<HistoryEntry, 'at'> & { at?: number }): void {
    this.past.push({ ...entry, at: entry.at ?? Date.now() });
    if (this.past.length > this.limit) this.past.splice(0, this.past.length - this.limit);
    this.future.length = 0;
  }

  /**
   * Versão coalescente do push (nudge do teclado): entradas consecutivas do
   * mesmo tipo/elemento/chave dentro da janela fundem-se numa só, atualizando
   * apenas o `after`. Retorna true quando fundiu.
   */
  pushCoalesced(entry: Omit<HistoryEntry, 'at'> & { at?: number }, mergeKey: string, windowMs: number): boolean {
    const now = entry.at ?? Date.now();
    const last = this.past[this.past.length - 1];
    if (
      last &&
      last.mergeKey === mergeKey &&
      last.type === entry.type &&
      last.elementId === entry.elementId &&
      now - last.at <= windowMs
    ) {
      last.after = entry.after;
      last.at = now;
      this.future.length = 0;
      return true;
    }
    this.push({ ...entry, mergeKey });
    return false;
  }

  /** Desfaz: devolve a entrada a ser revertida (ou null). */
  undo(): HistoryEntry | null {
    const entry = this.past.pop();
    if (!entry) return null;
    this.future.push(entry);
    return entry;
  }

  /** Refaz: devolve a entrada a ser reaplicada (ou null). */
  redo(): HistoryEntry | null {
    const entry = this.future.pop();
    if (!entry) return null;
    this.past.push(entry);
    return entry;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  undoDepth(): number {
    return this.past.length;
  }

  redoDepth(): number {
    return this.future.length;
  }

  clear(): void {
    this.past.length = 0;
    this.future.length = 0;
  }
}

// ---------------------------------------------------------------------------
// OverridesStore (posições por elemento e por breakpoint)
// ---------------------------------------------------------------------------

type OverridesData = Record<string, Partial<Record<Breakpoint, XY>>>;

const ZERO: XY = { x: 0, y: 0 };

function cleanXY(value: unknown): XY {
  if (!value || typeof value !== 'object') return { ...ZERO };
  const record = value as Record<string, unknown>;
  const x = Number(record.x);
  const y = Number(record.y);
  return {
    x: Number.isFinite(x) ? Math.round(x) : 0,
    y: Number.isFinite(y) ? Math.round(y) : 0,
  };
}

export class OverridesStore {
  private data: OverridesData = {};

  constructor(data?: unknown) {
    if (data && typeof data === 'object') {
      const record = (data as { elements?: unknown }).elements ?? data;
      if (record && typeof record === 'object') {
        for (const [id, perBp] of Object.entries(record as Record<string, unknown>)) {
          if (!id || !perBp || typeof perBp !== 'object') continue;
          const clean: Partial<Record<Breakpoint, XY>> = {};
          for (const bp of BREAKPOINTS) {
            const pos = (perBp as Record<string, unknown>)[bp];
            if (pos && typeof pos === 'object') {
              const xy = cleanXY(pos);
              if (xy.x !== 0 || xy.y !== 0) clean[bp] = xy;
            }
          }
          if (clean.desktop || clean.tablet || clean.mobile) this.data[id] = clean;
        }
      }
    }
  }

  get(elementId: string, breakpoint: Breakpoint): XY {
    const pos = this.data[elementId]?.[breakpoint];
    return pos ? { ...pos } : { ...ZERO };
  }

  has(elementId: string, breakpoint: Breakpoint): boolean {
    const pos = this.data[elementId]?.[breakpoint];
    return Boolean(pos && (pos.x !== 0 || pos.y !== 0));
  }

  /** Define a posição; voltar a (0,0) remove a entrada (HTML enxuto). */
  set(elementId: string, breakpoint: Breakpoint, pos: XY): void {
    const xy = { x: Math.round(pos.x), y: Math.round(pos.y) };
    if (xy.x === 0 && xy.y === 0) {
      const perBp = this.data[elementId];
      if (perBp) {
        delete perBp[breakpoint];
        if (!perBp.desktop && !perBp.tablet && !perBp.mobile) delete this.data[elementId];
      }
      return;
    }
    const perBp = this.data[elementId] ?? {};
    perBp[breakpoint] = xy;
    this.data[elementId] = perBp;
  }

  ids(): string[] {
    return Object.keys(this.data);
  }

  isEmpty(): boolean {
    return Object.keys(this.data).length === 0;
  }

  toJSON(): { v: number; elements: OverridesData } {
    return { v: EDITOR_STATE_VERSION, elements: this.data };
  }

  static fromJSON(raw: string): OverridesStore {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return new OverridesStore(parsed);
    } catch {
      /* bloco ausente ou corrompido => store vazio */
    }
    return new OverridesStore();
  }
}

/** Lê o bloco JSON de estado embutido no HTML (tolerante a ausência). */
export function readStateBlock(doc: Document): OverridesStore {
  const block = doc.getElementById(EDITOR_STATE_ID);
  if (!block) return new OverridesStore();
  return OverridesStore.fromJSON(block.textContent || '');
}

/** Persiste o store no bloco JSON embutido (cria se necessário). */
export function writeStateBlock(doc: Document, store: OverridesStore): void {
  let block = doc.getElementById(EDITOR_STATE_ID);
  if (!block) {
    block = doc.createElement('script');
    block.id = EDITOR_STATE_ID;
    block.setAttribute('type', 'application/json');
    (doc.body || doc.documentElement).appendChild(block);
  }
  block.textContent = JSON.stringify(store.toJSON());
}

// ---------------------------------------------------------------------------
// Aplicação de transforms (um elemento por vez, sem tocar irmãos/pai)
// ---------------------------------------------------------------------------

const APPLIED_ATTR = 'data-editor-applied';
const BASE_TRANSFORM_ATTR = 'data-editor-base-t';

function stashBase(el: Element): string {
  const htmlEl = el as HTMLElement;
  const existing = el.getAttribute(BASE_TRANSFORM_ATTR);
  if (existing !== null) return existing;
  const current = htmlEl.style ? htmlEl.style.transform : '';
  el.setAttribute(BASE_TRANSFORM_ATTR, current || '');
  return current || '';
}

/**
 * Aplica (ou remove, com pos null) o offset do editor em EXATAMENTE um
 * elemento, via `translate3d` individual. Preserva qualquer transform inline
 * pré-existente (composição) e nunca altera irmãos ou o container pai.
 */
export function applyPosition(el: Element, pos: XY | null): void {
  const htmlEl = el as HTMLElement;
  if (!htmlEl.style) return;
  if (!pos || (pos.x === 0 && pos.y === 0)) {
    if (!el.hasAttribute(APPLIED_ATTR)) return;
    const base = stashBase(el);
    if (base) htmlEl.style.transform = base;
    else htmlEl.style.removeProperty('transform');
    el.removeAttribute(APPLIED_ATTR);
    return;
  }
  const base = stashBase(el);
  const offset = `translate3d(${Math.round(pos.x)}px, ${Math.round(pos.y)}px, 0)`;
  htmlEl.style.transform = base ? `${base} ${offset}` : offset;
  el.setAttribute(APPLIED_ATTR, '1');
}

/**
 * Aplica os overrides do breakpoint atual. Elementos sem override (ou com
 * override zerado) têm o transform do editor removido; os demais não são
 * tocados de forma alguma.
 */
export function applyOverrides(doc: Document, store: OverridesStore, breakpoint: Breakpoint): void {
  for (const el of getEditableElements(doc)) {
    const id = el.getAttribute(EDITOR_ID_ATTR);
    if (!id) continue;
    const pos = store.get(id, breakpoint);
    if (pos.x !== 0 || pos.y !== 0) applyPosition(el, pos);
    else if (el.hasAttribute(APPLIED_ATTR)) applyPosition(el, null);
  }
}

/**
 * Remove os transforms aplicados pelo editor, restaurando o inline original.
 * Usado antes de serializar/salvar, para que o HTML salvo fique limpo e a
 * verdade viva no bloco de estado (+ reaplicação por breakpoint).
 */
export function clearEditorTransforms(doc: Document): void {
  if (!doc.body) return;
  const applied = doc.body.querySelectorAll(`[${APPLIED_ATTR}]`);
  for (const el of Array.from(applied)) applyPosition(el, null);
  const stashed = doc.body.querySelectorAll(`[${BASE_TRANSFORM_ATTR}]`);
  for (const el of Array.from(stashed)) el.removeAttribute(BASE_TRANSFORM_ATTR);
}

const LEGACY_ATTRS = [
  'contenteditable',
  'data-site-editing',
  'data-site-selected',
  'data-site-hover',
  'data-site-dragging',
  'data-site-drop',
];

/** Remove atributos de edição (atuais e legados) de um elemento. */
export function stripEditorAttributes(el: Element): void {
  for (const attr of LEGACY_ATTRS) el.removeAttribute(attr);
  el.removeAttribute(APPLIED_ATTR);
  el.removeAttribute(BASE_TRANSFORM_ATTR);
}

// ---------------------------------------------------------------------------
// Snapshots de conteúdo (texto/imagem/link) para undo exato
// ---------------------------------------------------------------------------

export function snapshotText(el: Element): string {
  return el.innerHTML;
}

export function restoreText(el: Element, html: string): void {
  el.innerHTML = html;
}

export interface ImageSnapshot {
  src: string;
  alt: string;
}

export function snapshotImage(el: Element): ImageSnapshot {
  return {
    src: el.getAttribute('src') || '',
    alt: el.getAttribute('alt') || '',
  };
}

export function restoreImage(el: Element, snap: ImageSnapshot): void {
  if (snap.src) el.setAttribute('src', snap.src);
  else el.removeAttribute('src');
  el.setAttribute('alt', snap.alt);
}

export function snapshotHref(el: Element): string {
  return el.getAttribute('href') || '';
}

export function restoreHref(el: Element, href: string): void {
  if (href) el.setAttribute('href', href);
  else el.removeAttribute('href');
}
