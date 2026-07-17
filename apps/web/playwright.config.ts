import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  fullyParallel: true,
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
  webServer: process.env.CI
    ? [
        {
          command: 'node ../../apps/api/dist/main.js',
          port: 3001,
          timeout: 30_000,
          reuseExistingServer: true,
          env: {
            NODE_ENV: 'test',
            PORT: '3001',
          },
        },
        {
          // baseURL points here (http://localhost:3000) — without this entry
          // every test 404s/ECONNREFUSEDs at the first page.goto(), since the
          // CI job only ever started the API server.
          command: 'pnpm start',
          port: 3000,
          timeout: 120_000,
          reuseExistingServer: true,
        },
      ]
    : undefined,
});
