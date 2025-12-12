# Change: Add oxlint as the project linter

## Why

The project currently uses ESLint only for the web package. oxlint is significantly faster (50-100x) and provides excellent TypeScript support out of the box. Replacing ESLint with oxlint will:
- Simplify the linting setup (single tool for all packages)
- Speed up CI pipelines
- Provide consistent linting across core, cli, and web packages

## What Changes

- **BREAKING**: Remove ESLint from `packages/web` (replaced by oxlint)
- Add oxlint as a dev dependency at the root level
- Create oxlint configuration with strict rules and full TypeScript support
- Add `npm run lint` script at root level (all packages)
- Add lint step to CI workflow (before tests)
- Update CLAUDE.md to document the lint command

## Impact

- Affected specs: `project-structure` (linting requirements)
- Affected code:
  - `package.json` (add oxlint, lint script)
  - `packages/web/package.json` (remove ESLint deps)
  - `packages/web/eslint.config.js` (delete)
  - `.github/workflows/build-and-deploy.yml` (add lint step)
  - `CLAUDE.md` (update commands section)
  - `oxlint.json` or `.oxlintrc.json` (new config file)
