## 1. Setup oxlint

- [x] 1.1 Install oxlint as a root dev dependency
- [x] 1.2 Create oxlint configuration file with strict rules and TypeScript support
- [x] 1.3 Add `lint` script to root package.json

## 2. Remove ESLint

- [x] 2.1 Remove ESLint dependencies from `packages/web/package.json`
- [x] 2.2 Delete `packages/web/eslint.config.js`
- [x] 2.3 Remove `lint` script from `packages/web/package.json`

## 3. CI Integration

- [x] 3.1 Add lint step to `.github/workflows/build-and-deploy.yml` (before tests)

## 4. Documentation

- [x] 4.1 Update CLAUDE.md Commands section to document `npm run lint`

## 5. Validation

- [x] 5.1 Run `npm run lint` locally and fix any issues
- [ ] 5.2 Verify CI pipeline passes
