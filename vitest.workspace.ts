import { defineWorkspace } from 'vitest/config';
import { resolve } from 'path';

export default defineWorkspace([
  {
    extends: './vitest.config.ts',
    test: {
      name: 'core',
      root: './packages/core',
      include: ['src/**/*.test.ts'],
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      name: 'cli',
      root: './packages/cli',
      include: ['src/**/*.test.ts'],
    },
  },
  {
    extends: './vitest.config.ts',
    resolve: {
      alias: {
        '@': resolve(__dirname, './packages/web/src'),
      },
    },
    test: {
      name: 'web',
      root: './packages/web',
      environment: 'jsdom',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      setupFiles: ['./src/test/setup.ts'],
    },
  },
]);
