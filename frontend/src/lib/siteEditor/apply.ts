/**
 * Applier de overrides — executa em TODOS os contextos (preview interativo,
 * site publicado): lê o bloco JSON `#__site_editor_state` e aplica os
 * offsets do breakpoint atual. Reaplica ao redimensionar.
 */
import { applyOverrides, breakpointForWidth, readStateBlock } from './core';

function currentBreakpoint(): 'desktop' | 'tablet' | 'mobile' {
  try {
    if (typeof window.matchMedia === 'function') {
      if (window.matchMedia('(max-width: 639px)').matches) return 'mobile';
      if (window.matchMedia('(max-width: 1023px)').matches) return 'tablet';
      return 'desktop';
    }
    return breakpointForWidth(window.innerWidth || 1200);
  } catch {
    return 'desktop';
  }
}

export function bootSiteOverrides(): void {
  const doc = document;
  const apply = (): void => {
    try {
      applyOverrides(doc, readStateBlock(doc), currentBreakpoint());
    } catch {
      /* HTML sem bloco de estado: nada a aplicar */
    }
  };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', apply, { once: true });
  apply();
  let timer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(apply, 120);
  });
  (window as unknown as { __siteOverrides?: { reapply: () => void } }).__siteOverrides = { reapply: apply };
}
