import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { siteEditorRuntime } from './vite.site-editor-plugin';

export default defineConfig({
  plugins: [react(), siteEditorRuntime()],
  server: {
    port: 5173,
  },
});
