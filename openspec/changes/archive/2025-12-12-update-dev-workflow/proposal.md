# Change: Auto-refresh web app on core package changes

## Why

Currently, when modifying code in `packages/core`, the web app (`npm run dev:web`) does not automatically reflect these changes. Developers must manually:
1. Run `npm run build:core` to rebuild the core package
2. Sometimes restart `npm run dev:web` to pick up the changes

This disrupts development flow and slows down iteration.

## What Changes

- Configure Vite to resolve `@voie-vitesse/core` imports directly to TypeScript source files instead of compiled `dist/` output during development
- The web dev server will automatically detect and hot-reload changes to core package source files
- Production builds remain unaffected (will continue using the properly compiled dist files)

## Impact

- Affected specs: `project-structure` (development workflow)
- Affected code: `packages/web/vite.config.ts`
- No breaking changes
- No impact on production builds
