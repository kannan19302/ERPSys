import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NEXTAUTH_SECRET: 'test_secret_for_vitest_unit_runs',
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        execArgv: ['--max-old-space-size=8192'],
        minForks: 1,
        maxForks: process.env.CI ? 1 : 2,
      },
    },
    exclude: process.env.CI
      ? ['**/node_modules/**', '**/dist/**', '**/*.coverage.spec.ts']
      : ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      // `json` emits coverage/coverage-final.json, which the scorecard
      // (scripts/scorecard.mjs) reads to compute the D3 (Tests) dimension.
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      // Only report files exercised by tests (avoids an empty report in this
      // vitest version); untested modules fall back to the spec-presence score.
      all: false,
      exclude: [
        'src/**/*.spec.ts',
        'src/**/tests/**',
        'src/**/dto/**',
        'src/main.ts',
        'src/tracing.ts',
        'src/**/*.module.ts',
      ],
    },
  },
});
