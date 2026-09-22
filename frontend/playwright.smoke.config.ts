import { defineConfig } from '@playwright/test';

// Smoke do editor visual em Chromium real, sem subir backend/frontend:
// opera sobre a fixture gerada em test-results/editor-smoke.html.
export default defineConfig({
  testDir: './tests',
  testMatch: 'editor-smoke.spec.ts',
  timeout: 60000,
  workers: 1,
  use: { viewport: { width: 1280, height: 900 } },
});
