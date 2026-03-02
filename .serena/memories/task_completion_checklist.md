# Task Completion Checklist

After completing any coding task, run these checks:

## 1. Build
```bash
npm run build
```
Ensures TypeScript compiles and web app builds without errors.

## 2. Tests
```bash
npx vitest run
```
Run all tests. For a specific area:
```bash
npx vitest run packages/core    # Core tests only
npx vitest run packages/web     # Web tests only (jsdom)
```

## 3. Lint
```bash
npm run lint
```
oxlint with type-aware checking across all packages.

## 4. Coverage (if tests were added/modified)
```bash
npm run test:coverage
```
Check that coverage thresholds are met (core: 90%, cli: 80%, web utils: 70%).

## Important Reminders
- **Backward compatibility**: Config changes must be retro-compatible (localStorage, imports, URLs)
- **Import extensions**: Use `.js` extension in ESM imports
- **i18n**: If adding user-visible strings, add translations to all 4 locale files (fr, en, de, it)
- **OpenSpec**: If the task is part of an OpenSpec change, update the relevant spec/tasks
