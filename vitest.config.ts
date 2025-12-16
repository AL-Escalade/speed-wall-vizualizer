import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'core',
          root: './packages/core',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'cli',
          root: './packages/cli',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: './packages/web/vite.config.ts',
        test: {
          name: 'web',
          root: './packages/web',
          environment: 'jsdom',
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'lcov', 'cobertura'],
      reportsDirectory: './coverage',
      // Per-directory thresholds for better granularity
      thresholds: {
        // Core package: high coverage required (pure functions)
        'packages/core/src/**/*.ts': {
          lines: 90,
          branches: 80,
          functions: 90,
          statements: 90,
        },
        // CLI package: output modules are harder to test (I/O)
        'packages/cli/src/reference-routes/**/*.ts': {
          lines: 80,
          branches: 80,
          functions: 80,
          statements: 80,
        },
        // Web utils: high coverage for pure utilities
        'packages/web/src/utils/**/*.ts': {
          lines: 70,
          branches: 60,
          functions: 60,
          statements: 70,
        },
        // Web stores: routesStore has high coverage, other stores excluded
        'packages/web/src/store/routesStore.ts': {
          lines: 90,
          branches: 70,
          functions: 90,
          statements: 90,
        },
      },
      exclude: [
        'node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/index.ts',
        'scripts/**',
        '**/*.config.ts',
        '**/*.config.js',
        // Exclude test files
        '**/*.test.ts',
        '**/*.test.tsx',
        // Exclude test setup
        'packages/web/src/test/**',
        // Exclude bundled assets (generated)
        'packages/core/src/bundled-assets.ts',
        // Exclude app entry points
        'packages/web/src/main.tsx',
        'packages/cli/src/cli.ts',
        // Exclude browser API integration code (clipboard, PDF generation)
        'packages/web/src/utils/clipboard.ts',
        'packages/web/src/utils/pdfGenerator.ts',
      ],
    },
  },
});
