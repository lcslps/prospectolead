import { defineConfig } from 'vitest/config';
import { siteEditorRuntime } from './vite.site-editor-plugin';

export default defineConfig({
  plugins: [siteEditorRuntime()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
