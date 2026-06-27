import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
