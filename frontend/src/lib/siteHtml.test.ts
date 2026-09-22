/**
 * Teste de integração do pipeline completo (itens 43/44/46/47):
 * buildSiteDoc -> bundle real embarcado executando no jsdom -> seleção,
 * drag independente, undo/redo e serialize. Exercita exatamente o código
 * que vai para o iframe em produção.
 */
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { buildSiteDoc } from './siteHtml';
import frameRuntime from 'virtual:site-editor-frame';
import applyRuntime from 'virtual:site-editor-apply';
import type { SiteArtefact } from '../types/website';

const ARTEFACT: SiteArtefact = {
  format: 'html-standalone',
  files: {
    'index.html': `<!doctype html><html><head><title>Teste</title></head><body>
<section><div class="wrap"><h1>Doçura</h1>
<div class="actions" style="display:flex;gap:12px"><a class="wa" href="https://wa.me/1">Chamar no WhatsApp</a><a class="phone" href="tel:+5566996205890">(66) 99620-5890</a></div>
</div></section></body></html>`,
    'styles.css': '.actions{display:flex;gap:12px}',
    'script.js': '',
  },
  seo: { title: 'Teste', description: 'd', keywords: 'k' },
};

function loadEditable(): { window: JSDOM['window']; document: Document } {
  const srcDoc = buildSiteDoc(ARTEFACT, { editable: true });
  const dom = new JSDOM(srcDoc, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  });
  return { window: dom.window, document: dom.window.document };
}

function mouse(win: JSDOM['window'], type: string, target: EventTarget, x = 0, y = 0): void {
  const event = new win.MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  target.dispatchEvent(event);
}

describe('runtimes embarcados', () => {
  it('bundles não contêm sequência de fechamento de script (srcDoc seguro)', () => {
    expect(frameRuntime).toBeTruthy();
    expect(applyRuntime).toBeTruthy();
    expect(frameRuntime).not.toMatch(/<\/script/i);
    expect(applyRuntime).not.toMatch(/<\/script/i);
  });

  it('modo edição inclui editor; demais modos incluem applier sem editor', () => {
    const editable = buildSiteDoc(ARTEFACT, { editable: true });
    expect(editable).toContain('id="__site_edit_script"');
    expect(editable).not.toContain('id="__site_guard"');
    const interact = buildSiteDoc(ARTEFACT, { interactive: true });
    expect(interact).toContain('id="__site_apply"');
    expect(interact).toContain('id="__site_anchor"');
    expect(interact).not.toContain('id="__site_edit_script"');
    const locked = buildSiteDoc(ARTEFACT, { interactive: false });
    expect(locked).toContain('id="__site_guard"');
    expect(locked).toContain('id="__site_apply"');
    expect(locked).not.toContain('id="__site_edit_script"');
  });

  it('não duplica o applier ao reconstruir HTML já salvo', () => {
    const once = buildSiteDoc(ARTEFACT, { interactive: true });
    const withSavedApply = {
      ...ARTEFACT,
      files: { ...ARTEFACT.files, 'index.html': once.replace(/^<!doctype html>\n/i, '') },
    };
    const twice = buildSiteDoc(withSavedApply, { interactive: true });
    expect(twice.match(/id="__site_apply"/g)?.length).toBe(1);
    // O bloco de estado (posições) é preservado entre reconstruções.
    const withState = {
      ...ARTEFACT,
      files: {
        ...ARTEFACT.files,
        'index.html': `${ARTEFACT.files['index.html']}<script id="__site_editor_state" type="application/json">{"v":1,"elements":{"ed-1":{"desktop":{"x":10,"y":0}}}}</script>`,
      },
    };
    expect(buildSiteDoc(withState, { interactive: true })).toContain('__site_editor_state');
  });

  it('carrega somente fontes conhecidas e injeta a resiliência de imagens', () => {
    const withPremiumFonts = buildSiteDoc({
      ...ARTEFACT,
      files: {
        ...ARTEFACT.files,
        'styles.css': ':root{font-family:"DM Sans",sans-serif}.hero h1{font-family:"Playfair Display",serif}',
      },
    }, { interactive: true });
    expect(withPremiumFonts).toContain('id="__site_fonts"');
    expect(withPremiumFonts).toContain('DM+Sans');
    expect(withPremiumFonts).toContain('Playfair+Display');
    expect(withPremiumFonts).toContain('id="__site_image_resilience"');
    expect(withPremiumFonts).toContain('id="__site_message_gate"');

    const unknownFont = buildSiteDoc({
      ...ARTEFACT,
      files: {
        ...ARTEFACT.files,
        'index.html': ARTEFACT.files['index.html'].replace('</head>', '<link rel="stylesheet" href="https://example.com/fonts.css"></head>'),
        'styles.css': '.hero{font-family:"Fonte Não Permitida"}',
      },
    });
    expect(unknownFont).not.toContain('id="__site_fonts"');
    expect(unknownFont).not.toContain('rel="stylesheet" href="https://example.com/fonts.css"');
  });

  it('remove runtimes de uma serialização anterior antes de injetar a versão atual', () => {
    const once = buildSiteDoc(ARTEFACT, { editable: true });
    const twice = buildSiteDoc({
      ...ARTEFACT,
      files: { ...ARTEFACT.files, 'index.html': once.replace(/^<!doctype html>\n/i, '') },
    }, { editable: true });
    expect(twice.match(/id="__site_edit_script"/g)?.length).toBe(1);
    expect(twice.match(/id="__site_image_resilience"/g)?.length).toBe(1);
    expect(twice.match(/id="__site_message_gate"/g)?.length).toBe(1);
  });

  it('substitui uma imagem sem src por fallback local no iframe', async () => {
    const dom = new JSDOM(buildSiteDoc({
      ...ARTEFACT,
      files: {
        ...ARTEFACT.files,
        'index.html': ARTEFACT.files['index.html'].replace('</section>', '<img class="broken-photo" src="" alt="Ambiente do negócio"></section>'),
      },
    }), { url: 'http://localhost/', runScripts: 'dangerously', pretendToBeVisual: true });
    await new Promise<void>(resolve => dom.window.setTimeout(resolve, 0));
    const image = dom.window.document.querySelector('.broken-photo') as HTMLImageElement;
    expect(image.dataset.siteImageFallback).toBe('1');
    expect(image.getAttribute('src')).toMatch(/^data:image\/svg\+xml,/);
  });
});

describe('pipeline ponta a ponta no bundle real (item 43/44)', () => {
  it('dois botões: mover phone 150px move SÓ ele; undo/redo; serialize preserva', async () => {
    const { window, document } = loadEditable();
    // Boot executou: ids atribuídos e applier global presente.
    const phone = document.querySelector('.phone') as HTMLElement;
    const whatsapp = document.querySelector('.wa') as HTMLElement;
    const actions = document.querySelector('.actions') as HTMLElement;
    expect(phone.getAttribute('data-editor-id')).toBeTruthy();
    expect((window as unknown as { __siteOverrides?: unknown }).__siteOverrides).toBeTruthy();

    // Seleciona o telefone e arrasta 150px.
    mouse(window, 'pointerdown', phone, 0, 0);
    mouse(window, 'pointermove', document, 150, 0);
    mouse(window, 'pointerup', document, 150, 0);

    expect(phone.style.transform).toBe('translate3d(150px, 0px, 0)');
    expect(whatsapp.style.transform).toBe('');
    expect(actions.style.transform).toBe('');
    expect(document.querySelector('#__site_edit_box')).toBeTruthy();

    // Undo via teclado (Ctrl+Z) e redo (Ctrl+Shift+Z), como no Studio.
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    expect(phone.style.transform).toBe('');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Z', ctrlKey: true, shiftKey: true, bubbles: true }));
    expect(phone.style.transform).toBe('translate3d(150px, 0px, 0)');

    // Serialize via postMessage (responde de forma assíncrona).
    const serialized = await new Promise<{ html: string }>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('serialize sem resposta')), 3000);
      window.addEventListener('message', event => {
        const data = event.data as { source?: string; type?: string; html?: string };
        if (data?.source === 'site-edit' && data.type === 'serialized' && data.html) {
          clearTimeout(timer);
          resolve({ html: data.html });
        }
      });
      window.postMessage({ source: 'site-editor', type: 'serialize' }, '*');
    });
    expect(serialized.html).toContain('data-editor-id');
    expect(serialized.html).toContain('__site_editor_state');
    expect(serialized.html).toContain('"x":150');
    expect(serialized.html).not.toContain('translate3d');
    expect(serialized.html).not.toContain('__site_edit_script');
    expect(serialized.html).not.toContain('__site_edit_root');

    // O estado salvo reaplica ao recarregar (applier do publicado, item 47).
    const reloaded = new JSDOM(buildSiteDoc({
      ...ARTEFACT,
      files: {
        ...ARTEFACT.files,
        'index.html': serialized.html.replace(/^<!doctype html>\n/i, ''),
      },
    }, { interactive: true }), { url: 'http://localhost/', runScripts: 'dangerously', pretendToBeVisual: true });
    const reloadedDoc = reloaded.window.document;
    const reloadedPhone = Array.from(reloadedDoc.querySelectorAll('a')).find(a => (a.textContent || '').includes('99620')) as HTMLElement;
    expect(reloadedPhone.style.transform).toBe('translate3d(150px, 0px, 0)');
    const reloadedWa = Array.from(reloadedDoc.querySelectorAll('a')).find(a => (a.textContent || '').includes('WhatsApp')) as HTMLElement;
    expect(reloadedWa.style.transform).toBe('');
  }, 10000);
});
