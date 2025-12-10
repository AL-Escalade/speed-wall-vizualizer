# Proposal: Reorganize Monorepo Structure

## Summary

Reorganize the project to follow a consistent monorepo structure with all packages under `packages/`.

## Problem

The current project has an inconsistent hybrid organization:
- `packages/core` - in packages directory
- `cli/` - at root level
- `web/` - at root level
- `src/` - orphan directory with old/duplicate code
- `output/` - generated files at root (acceptable)

This inconsistency:
- Makes the project structure confusing for contributors
- Goes against monorepo conventions
- Suggests incomplete migration from a different structure

## Solution

1. Move `cli/` to `packages/cli/`
2. Move `web/` to `packages/web/`
3. Delete orphan `src/` directory (contains old duplicate code)
4. Update root `package.json` workspaces configuration
5. Update any cross-references and import paths

## Structure After Change

```
voie-vitesse/
├── packages/
│   ├── core/          # Shared library (already here)
│   ├── cli/           # Command-line tool (moved from /cli)
│   └── web/           # React web application (moved from /web)
├── data/              # Route data files
├── schemas/           # JSON schemas
├── assets/            # SVG assets
├── output/            # Generated output files
├── openspec/          # OpenSpec documentation
├── docs/              # Documentation
├── scripts/           # Build scripts
└── package.json       # Root package with workspaces
```

## Impact

- **Low risk**: This is a structural refactoring, no logic changes
- **Breaking**: Import paths in IDE may need refresh
- **Dependencies**: None, can be done independently

## Acceptance Criteria

- [ ] All packages are under `packages/`
- [ ] `npm run build` succeeds
- [ ] `npm run dev:web` works
- [ ] `npm run generate` works
- [ ] No orphan `src/` directory at root
- [ ] Clean git status (no untracked old files)
