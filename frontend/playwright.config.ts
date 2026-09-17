import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', timeout: 60000, workers: 1,
  use: { baseURL: 'http://localhost:5174', viewport: { width: 1920, height: 1080 }, launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}, screenshot: 'only-on-failure' },
  webServer: [
    { command: 'node dist/index.js', cwd: '../backend', url: 'http://localhost:3002/api/health', env: { PORT: '3002', FRONTEND_URL: 'http://localhost:5174' }, reuseExistingServer: false },
    { command: 'npm.cmd run dev -- --port 5174 --strictPort', url: 'http://localhost:5174', env: { VITE_API_URL: 'http://localhost:3002/api' }, reuseExistingServer: false },
  ],
});
