# Project Structure

## ADDED Requirements

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
