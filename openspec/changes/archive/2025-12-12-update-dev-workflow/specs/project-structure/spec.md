## ADDED Requirements

### Requirement: Development Hot Reload for Monorepo Dependencies

During development, changes to source files in workspace packages SHALL automatically trigger hot module replacement (HMR) in dependent packages without requiring manual rebuild commands.

#### Scenario: Core package change triggers web app refresh

- **GIVEN** the web development server is running (`npm run dev:web`)
- **WHEN** a TypeScript source file in `packages/core/src/` is modified and saved
- **THEN** the web app in the browser SHALL automatically refresh or hot-reload to reflect the change

#### Scenario: Production build uses compiled artifacts

- **GIVEN** the production build is executed (`npm run build`)
- **WHEN** the web package is built
- **THEN** it SHALL use the properly compiled `dist/` output from workspace dependencies (not raw TypeScript sources)
