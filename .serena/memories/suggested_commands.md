# Suggested Commands

## Development
```bash
npm install              # Install all workspace dependencies
npm run build            # Build all packages (tsgo + vite)
npm run build:core       # Build core package only
npm run dev:web          # Start web app dev server (Vite)
```

## Testing
```bash
npm run test             # Run tests with Vitest (watch mode)
npx vitest run           # Run all tests once
npx vitest run <file>    # Run single test file
npm run test:coverage    # Run tests with v8 coverage
npm run test:ui          # Run tests with Vitest UI
```

## Linting
```bash
npm run lint             # Lint all packages with oxlint (type-aware)
```

## SVG Generation (CLI)
```bash
npm run generate -- -c data/base.json -o output/wall.svg
npm run generate:base    # Generate from base.json
```

## Asset Generation
```bash
npm run generate:assets  # Regenerate bundled SVG assets (after modifying hold SVGs)
```

## System Utilities (Windows with bash)
```bash
git status / git diff / git log   # Standard git commands
ls / find / grep                  # Use unix-style commands (bash on Windows)
```

## CI
- GitHub Actions: `.github/workflows/build-and-deploy.yml`
- Dependabot configured for dependency updates
