import { defineConfig } from 'vitest/config';
import path from 'node:path';

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
    env: {
      JWT_SECRET: 'test-only-secret-for-ci-at-least-32-characters',
      NODE_ENV: 'test',
    },
  },
});
