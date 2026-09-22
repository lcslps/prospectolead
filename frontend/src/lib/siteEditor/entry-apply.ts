/** Entry do bundle injetado em todos os contextos (apenas applier). */
import { bootSiteOverrides } from './apply';

try {
  bootSiteOverrides();
} catch {
  /* noop */
}
