import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/learning-platform-demo/',
    navigationTimeout: 15_000
  },
  webServer: {
    command: 'npm run build:static && VITE_DEMO_MODE=static ./node_modules/.bin/vite preview --config frontend/vite.config.ts --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/learning-platform-demo/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } }
  ]
});
