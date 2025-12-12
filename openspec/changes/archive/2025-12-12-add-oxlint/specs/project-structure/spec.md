## ADDED Requirements

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

