import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json declares `"@/*": ["./src/*"]`, but vitest does not read
  // tsconfig paths — so every spec that imported through the `@/` alias failed
  // at collection with "Failed to load url @/common/idp-client", reporting zero
  // tests rather than a failure. Mirroring the alias here is what makes those
  // suites run at all; it must stay in step with tsconfig.
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Part of the suite is written Jest-style and relies on `describe`/`it`/
    // `expect` being global rather than imported from 'vitest'. Without this
    // those files fail at collection with "describe is not defined", which
    // looks like a broken test but is purely a config gap. Enabling globals
    // changes no test's meaning; files that import from 'vitest' explicitly
    // keep working unchanged.
    globals: true,
    // Exposes `vi` as `jest` for the Jest-era files. See the file for the
    // hoisting caveat around jest.mock.
    setupFiles: ["./test/jest-compat.setup.ts"],
    env: {
      NEXTAUTH_SECRET: "test_secret_for_vitest_unit_runs",
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    // Memory-isolated forks. The generated Prisma client (362 models) plus the
    // large service graph make module transform/collection memory-heavy, so we
    // spread files across several forks (each accumulates less) and cap per-fork
    // heap so the total stays well under host RAM. Previously a single 8 GB
    // heap per fork × maxForks exhausted a 16 GB host and killed workers
    // ("Worker exited unexpectedly"), which the run-tests-sequential.ps1 hack
    // worked around one-file-per-process. This runs the full suite in parallel.
    pool: "forks",
    poolOptions: {
      forks: {
        execArgv: ["--max-old-space-size=2048"],
        minForks: 1,
        maxForks: process.env.CI ? 2 : 4,
      },
    },
    exclude: process.env.CI
      ? ["**/node_modules/**", "**/dist/**", "**/*.coverage.spec.ts"]
      : ["**/node_modules/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      // `json` emits coverage/coverage-final.json for tooling that consumes
      // machine-readable coverage.
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      // Only report files exercised by tests (avoids an empty report in this
      // vitest version); untested modules fall back to the spec-presence score.
      all: false,
      exclude: [
        "src/**/*.spec.ts",
        "src/**/tests/**",
        "src/**/dto/**",
        "src/main.ts",
        "src/tracing.ts",
        "src/**/*.module.ts",
      ],
    },
  },
});
