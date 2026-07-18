import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://unerp:unerp_password@localhost:5432/unerp_dev?schema=public',
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
  },
});
