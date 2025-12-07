# Proposal: Add React Web Application

## Why

The current CLI tool requires users to manually edit JSON configuration files to create wall visualizations. This is error-prone and doesn't provide real-time feedback. A web application would allow users to:
- Configure walls visually with immediate preview
- Navigate large wall images easily (zoom, pan, birdview)
- Manage multiple configurations without file manipulation
- Share configurations via JSON export/import

## What Changes

### New Capability: web-app

A React-based web application that provides:

1. **Wall Configuration**
   - Set wall dimensions (lanes, panels height)
   - Manage multiple saved configurations (localStorage)

2. **Section Management**
   - Add sections from existing reference routes
   - Select start/end holds via label dropdown or wall click
   - Navigate between holds using arrow keys
   - Customize section color
   - Assign to lane (SN/DX) via selector or click

3. **SVG Viewer**
   - Real-time preview of the wall
   - Zoom (mouse wheel + buttons)
   - Pan (click + drag)
   - Birdview/minimap for quick navigation

4. **Export/Import**
   - Export JSON configuration (re-importable)
   - Export SVG image
   - Auto-save to localStorage

### Monorepo Restructure

- Extract shared code (types, SVG generation) to `packages/core/`
- Create web app in `web/` folder
- Adapt CLI to use shared core package

## Technical Stack

- **Build**: Vite
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS + daisyUI
- **State**: Zustand with persist middleware
- **Target**: Desktop browsers only (for now)
- **Backend**: None (client-side only)

## Scope

- **In scope**: Web UI, monorepo restructure, client-side SVG generation
- **Out of scope**: Mobile/tablet support, backend API, hold orientation editing, PNG/PDF export from web
