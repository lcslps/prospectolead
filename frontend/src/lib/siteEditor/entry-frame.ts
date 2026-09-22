/** Entry do bundle injetado no modo "Editar direto" (applier + editor). */
import { bootSiteOverrides } from './apply';
import { createEditor } from './frame';

bootSiteOverrides();

try {
  createEditor(document, window, {
    send: msg => {
      try {
        parent.postMessage(msg, '*');
      } catch {
        /* preview sem pai acessível */
      }
    },
    now: () => Date.now(),
  });
} catch {
  /* documento mínimo / ambiente restrito */
}
