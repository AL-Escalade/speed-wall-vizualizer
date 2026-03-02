# Code Style and Conventions

## General
- **ESM modules**: All packages use `"type": "module"`, imports use `.js` extension
- **No formatter**: No Prettier or similar — code style enforced via oxlint
- **No explicit docstrings/JSDoc**: Functions are self-documenting with descriptive names and typed params
- **No semicolons policy**: Not enforced — code uses semicolons consistently
- **Single quotes** for strings (TypeScript convention)

## TypeScript
- **Strict typing**: Functions use explicit parameter types and return types
- **Interfaces** for data shapes (not type aliases for objects)
- **Const assertions** and `as const` for literal types
- **Functional style**: Core package uses pure functions, no classes
- **Named exports** preferred over default exports

## Naming
- **camelCase** for variables, functions, parameters
- **PascalCase** for interfaces, types, React components
- **SCREAMING_SNAKE_CASE** for constants (e.g., `GRID`, `PANEL`, `COLUMNS`)
- **kebab-case** for file names (e.g., `plate-grid.ts`, `route-composer.ts`)
- **PascalCase** for React component files (e.g., `Viewer.tsx`, `Sidebar.tsx`)

## Testing
- **Vitest** with `describe`/`it`/`expect` pattern
- **Co-located tests**: `*.test.ts` alongside source files
- **Descriptive test names**: `it('should ...')`
- **Web tests**: jsdom environment, @testing-library/react
- **Coverage thresholds**: Core 90%, CLI 80%, Web utils 70%

## React (Web Package)
- **Functional components** only
- **Zustand** for state management (no Redux/Context for global state)
- **Custom hooks** in `src/hooks/` (e.g., `useTouchGestures`, `useUrlSync`)
- **Tailwind CSS v4 + DaisyUI v5** for styling
- **react-intl** for internationalization (4 locales: fr, en, de, it)
- **arktype** for runtime validation

## Linting Rules (oxlint)
- correctness: error
- suspicious: error
- pedantic: warn
- style: warn
- perf: warn
- restriction: off
- react-refresh: only-export-components (warn)
