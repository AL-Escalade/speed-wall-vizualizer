## 1. Implementation

- [x] 1.1 Update `packages/web/vite.config.ts` to add alias resolving `@voie-vitesse/core` to source files in dev mode
- [x] 1.2 Add custom Vite plugin to force full page reload when core files change (HMR doesn't work with non-React code)
- [x] 1.3 Test that modifying core source triggers automatic page reload in web app
- [x] 1.4 Test that production build still works correctly (uses compiled dist)
