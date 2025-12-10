## 1. Cleanup Orphan Code

- [x] 1.1 Delete `/src` directory (contains old duplicate code from before packages/ migration)

## 2. Move CLI Package

- [x] 2.1 Move `cli/` to `packages/cli/`
- [x] 2.2 Update CLI's relative import paths if any (e.g., `../../data/` references)
- [x] 2.3 Update `scripts/generate:base` path in root package.json

## 3. Move Web Package

- [x] 3.1 Move `web/` to `packages/web/`
- [x] 3.2 Update Web's relative import paths (e.g., `../../../data/routes/` in routesStore.ts)
- [x] 3.3 Update `vite.config.ts` if needed for new location (not needed - no changes required)

## 4. Update Root Configuration

- [x] 4.1 Update root `package.json` workspaces to `["packages/*"]` only
- [x] 4.2 Verify all npm scripts still work with new paths

## 5. Validation

- [x] 5.1 Run `npm install` to refresh workspace links
- [x] 5.2 Run `npm run build` - all packages must build
- [x] 5.3 Run `npm run dev:web` - web app must start
- [x] 5.4 Run `npm run generate:base` - CLI must generate output
- [x] 5.5 Verify git status is clean (no orphan files)
