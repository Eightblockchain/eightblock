import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Integration tests write to the database, so they only run against TEST_DATABASE_URL.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
    env: {
      JWT_SECRET: 'test-only-secret-for-ci-at-least-32-characters',
      NODE_ENV: 'test',
      // Never reach Resend from tests; suites that need a key set a fake one and mock the SDK.
      EMAIL_PROVIDER_API_KEY: '',
      ...(testDatabaseUrl ? { DATABASE_URL: testDatabaseUrl } : {}),
    },
  },
});
