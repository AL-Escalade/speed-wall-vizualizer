# Proposal: Add Test Coverage

## Why

The project currently has no tests. This creates risk of regressions when modifying code. Adding comprehensive test coverage with CI enforcement ensures:
- Code quality and reliability
- Safe refactoring
- Documentation of expected behavior through test cases

## What Changes

1. **Add unit tests for all packages** (core, cli, web) targeting 90% coverage
2. **Configure Vitest** with coverage reporting (v8 provider)
3. **Add component tests for web** using @testing-library/react with jsdom
4. **Update CI workflow** to run tests and enforce coverage non-regression using `clearlyip/code-coverage-report-action`
5. **Add testing documentation** (`docs/TESTING.md`) describing test requirements and best practices

## Scope

- `packages/core` - Unit tests for SVG parsing, route composition, grid calculations, SVG generation
- `packages/cli` - Unit tests for CLI argument parsing, output generation, reference routes loading
- `packages/web` - Unit tests for hooks, utilities, stores + component tests with @testing-library/react
- `.github/workflows` - Add test job with coverage enforcement
- `docs/TESTING.md` - Testing guidelines and best practices

## Out of Scope

- E2E tests (Playwright/Cypress)
- Visual regression testing
- Performance testing
