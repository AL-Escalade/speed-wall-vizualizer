# Testing Guidelines

This document describes the testing strategy and best practices for the voie-vitesse project.

## Overview

Tests are mandatory for this project. All pull requests must pass tests and maintain coverage thresholds. Coverage regression compared to the main branch will block merging.

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests for a specific package
npm test -- --project core
npm test -- --project cli
npm test -- --project web
```

## Test Structure

The project uses [Vitest](https://vitest.dev/) as the test framework with the following workspace configuration:

- **core**: Pure TypeScript functions for wall calculations, SVG generation, and route composition
- **cli**: Command-line interface and reference route loading
- **web**: React application with utilities, stores, and components

### File Naming

Test files should be placed next to the code they test with the `.test.ts` or `.test.tsx` extension:

```
src/
  utils/
    myUtil.ts
    myUtil.test.ts
  components/
    MyComponent.tsx
    MyComponent.test.tsx
```

## Writing Tests

### Core Principles

1. **Test behavior, not implementation**: Focus on what the function does, not how it does it.
2. **One assertion per test**: Each test should verify one specific behavior.
3. **Descriptive names**: Test names should describe the expected behavior.
4. **Minimal and effective**: Write the minimum tests needed to prevent regressions.

### Test Structure

Follow the Arrange-Act-Assert pattern:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateAngle } from './rotation';

describe('calculateAngle', () => {
  it('should return 0 for pointing right', () => {
    // Arrange
    const from = { x: 0, y: 0 };
    const to = { x: 100, y: 0 };

    // Act
    const angle = calculateAngle(from, to);

    // Assert
    expect(angle).toBe(0);
  });
});
```

### Testing Pure Functions

For pure functions (most of the core package), test:
- Normal cases with expected inputs
- Edge cases (empty arrays, zero values, boundaries)
- Error cases (invalid inputs)

```typescript
describe('parseHold', () => {
  it('should parse basic hold format', () => {
    const hold = parseHold('SN1 BIG A1 B2', COLUMN_SYSTEMS.ABC);
    expect(hold.panel).toEqual({ side: 'SN', number: 1 });
  });

  it('should throw for invalid format', () => {
    expect(() => parseHold('INVALID')).toThrow('Invalid hold format');
  });
});
```

### Testing Zustand Stores

Access store state directly for testing:

```typescript
import { useRoutesStore } from './routesStore';

describe('routesStore', () => {
  it('should return route by name', () => {
    const { getRoute } = useRoutesStore.getState();
    const route = getRoute('ifsc');
    expect(route).toBeDefined();
  });
});
```

### Testing React Components

For React components, use `@testing-library/react`:

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Coverage Requirements

Coverage thresholds are enforced per directory:

| Directory | Lines | Branches | Functions | Statements |
|-----------|-------|----------|-----------|------------|
| `packages/core/src` | 90% | 80% | 90% | 90% |
| `packages/cli/src/reference-routes` | 80% | 80% | 80% | 80% |
| `packages/web/src/utils` | 70% | 60% | 60% | 70% |
| `packages/web/src/store/routesStore.ts` | 90% | 70% | 90% | 90% |

### Excluded from Coverage

The following are excluded from coverage requirements:
- React components (`.tsx` files) - require complex test setup
- React hooks - require React testing environment
- Complex state stores (`configStore.ts`, `viewerStore.ts`) - require React testing environment
- CLI main entry point - side effects and I/O
- PDF generator and clipboard utilities - browser/Node APIs
- Type definitions - no runtime code
- Generated assets and constants

## CI Integration

Tests run automatically on every push and pull request. Coverage is:
1. Generated using `npm run test:coverage`
2. Compared against the main branch baseline
3. Reported as a PR comment
4. Fails the build if coverage regresses

## Best Practices

### Do

- Write tests for new features before or alongside implementation
- Test edge cases and error conditions
- Keep tests fast and isolated
- Use descriptive test names that explain the expected behavior
- Mock external dependencies (APIs, file system)

### Don't

- Don't test implementation details that may change
- Don't write tests that depend on test execution order
- Don't test third-party library behavior
- Don't duplicate tests for the same behavior
- Don't write tests just to increase coverage numbers

## Adding Tests to New Files

When adding a new file:

1. Create a corresponding `.test.ts` file
2. Write tests for the public API
3. Ensure coverage thresholds are met
4. Run `npm run test:coverage` locally before pushing
