# project-structure Specification

## Purpose
TBD - created by archiving change reorganize-monorepo-structure. Update Purpose after archive.
## Requirements
### Requirement: Monorepo Package Organization

All application packages (core, cli, web) MUST be located under the `packages/` directory following standard monorepo conventions.

#### Scenario: Package Discovery
- Given a developer exploring the project
- When they look for application code
- Then all packages are found under `packages/` directory
- And there are no application packages at the root level

#### Scenario: Workspace Configuration
- Given the root package.json
- When workspaces are defined
- Then it uses `["packages/*"]` pattern only
- And no individual paths like `"cli"` or `"web"` are needed

### Requirement: No Orphan Source Code

The project root MUST NOT contain orphan source code directories that duplicate functionality in packages.

#### Scenario: Clean Root Directory
- Given the project root directory
- When listing its contents
- Then there is no `src/` directory at root level
- And all source code is within `packages/*/src/`

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

### Requirement: Code Linting with oxlint

The project SHALL use oxlint as the primary linting tool across all packages (core, cli, web) with strict rules and full TypeScript support.

#### Scenario: Run linting from root

- **GIVEN** a developer is at the project root
- **WHEN** they run `npm run lint`
- **THEN** oxlint SHALL check all TypeScript files in packages/core, packages/cli, and packages/web
- **AND** report any violations according to strict rule configuration

#### Scenario: CI lint check

- **GIVEN** a pull request is opened or code is pushed to main
- **WHEN** the CI workflow runs
- **THEN** the lint step SHALL execute before tests
- **AND** the pipeline SHALL fail if any lint errors are found

#### Scenario: TypeScript-aware linting

- **GIVEN** oxlint is configured with TypeScript support
- **WHEN** linting TypeScript files (.ts, .tsx)
- **THEN** oxlint SHALL apply TypeScript-specific rules
- **AND** understand TypeScript syntax and types

