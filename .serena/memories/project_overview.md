# Project Overview

## Purpose
**Speed Wall Visualizer** (`voie-vitesse`) — A tool for visualizing and configuring speed climbing walls. Generates SVG representations of hold placements according to reference routes (IFSC, U15, U11-U13 categories).

## Tech Stack
- **Language**: TypeScript (ESM modules, `"type": "module"`)
- **Node version**: 24 (see `.nvmrc`)
- **Build**: `tsgo` (TypeScript Go compiler, `@typescript/native-preview`)
- **Monorepo**: npm workspaces
- **Linter**: oxlint (with React plugin, type-aware mode)
- **Tests**: Vitest (v4) with coverage via v8
- **No formatter** configured — code style relies on linting rules

### Packages
1. **`@voie-vitesse/core`** — Pure TypeScript library: domain types, grid math, route composition, SVG generation. Only dependency: `@xmldom/xmldom`.
2. **`@voie-vitesse/cli`** — CLI for generating SVG/PDF/PNG from JSON config files. Uses `tsx` for development.
3. **`@voie-vitesse/web`** — React 19 web app:
   - **State**: Zustand stores (persisted to localStorage)
   - **UI**: Tailwind CSS v4 + DaisyUI v5
   - **i18n**: react-intl (fr, en, de, it)
   - **Routing**: react-router-dom v7
   - **Validation**: arktype v2
   - **Build**: Vite v7

## Spec Management
Uses **OpenSpec** workflow for tracking changes with proposals, designs, delta specs, and tasks in `openspec/` directory.

## Key Domain Concepts
- **Holds**: Climbing grips placed on wall panels, defined with compact string format: `"PANEL TYPE POSITION ORIENTATION [@LABEL] [SCALE]"`
- **Panels**: Modular wall sections identified by side (SN/DX) and number
- **Column systems**: Three coordinate systems (ABC, FFME, IFSC) with different letter mappings after I
- **Route segments**: Portions of reference routes with optional anchor offsets, filtering, lane offsets
- **Backward compatibility**: Config changes must be retro-compatible (localStorage, file imports, URL links)
