import { buildSync } from 'esbuild';
import type { Plugin } from 'vite';

/**
 * Empacota o runtime do editor visual (TypeScript real, em
 * src/lib/siteEditor) em strings IIFE prontas para injeção inline no
 * iframe do preview. O mesmo código é importado diretamente pelos testes
 * unitários, então o que é testado é exatamente o que é embarcado.
 */
export function siteEditorRuntime(): Plugin {
  const cache = new Map<string, string>();
  const bundle = (entry: string): string => {
    const hit = cache.get(entry);
    if (hit) return hit;
    const result = buildSync({
      entryPoints: [entry],
      bundle: true,
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
      minify: false,
      write: false,
      logLevel: 'warning',
    });
    const text = result.outputFiles?.[0]?.text ?? '';
    if (!text) throw new Error(`[site-editor-runtime] bundle vazio para ${entry}`);
    cache.set(entry, text);
    return text;
  };
  return {
    name: 'site-editor-runtime',
    resolveId(id) {
      if (id === 'virtual:site-editor-frame' || id === 'virtual:site-editor-apply') return `\0${id}`;
      return null;
    },
    load(id) {
      if (id === '\0virtual:site-editor-frame') {
        return `export default ${JSON.stringify(bundle('src/lib/siteEditor/entry-frame.ts'))};`;
      }
      if (id === '\0virtual:site-editor-apply') {
        return `export default ${JSON.stringify(bundle('src/lib/siteEditor/entry-apply.ts'))};`;
      }
      return null;
    },
  };
}
