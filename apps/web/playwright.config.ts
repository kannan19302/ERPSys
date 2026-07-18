import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  retries: process.env.CI ? 2 : 0,
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: process.env.CI ? 'only-on-failure' : 'off',
  },
  projects: [
    {
      name: 'smoke',
      testMatch: 'smoke.spec.ts',
    },
    {
      name: 'auth',
      testMatch: 'auth.spec.ts',
    },
    {
      name: 'api-health',
      testMatch: 'api-health.spec.ts',
    },
    {
      name: 'journeys',
      testMatch: 'journeys/*.spec.ts',
    },
    {
      name: 'all-e2e',
      testMatch: '**/*.spec.ts',
    },
  ],
  reporter: process.env.CI
    ? [['html', { outputFolder: 'playwright-report' }], ['list']]
    : [['html', { outputFolder: 'playwright-report' }], ['list']],
  webServer: process.env.CI
    ? [
        {
          command: 'node ../../apps/api/dist/main.js',
          port: 3001,
          timeout: 60_000,
          reuseExistingServer: true,
          env: {
            NODE_ENV: 'test',
            PORT: '3001',
          },
        },
        {
          command: 'pnpm start',
          port: 3000,
          timeout: 120_000,
          reuseExistingServer: true,
        },
      ]
    : undefined,
});
