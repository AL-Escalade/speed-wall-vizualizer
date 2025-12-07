# Tasks: Add React Web Application

## Phase 1: Monorepo Setup

- [ ] Initialize npm/pnpm workspaces in root package.json
- [ ] Create `packages/core/` structure
- [ ] Move shared code (types, svg-generator, hold-svg-parser, plate-grid, rotation, route-composer) to core
- [ ] Move hold assets to `packages/core/assets/`
- [ ] Create `cli/` folder and move CLI-specific code
- [ ] Update CLI imports to use @voie-vitesse/core
- [ ] Verify CLI still works after restructure

## Phase 2: Core Package Browser Compatibility

- [ ] Remove Node.js `fs` dependencies from core
- [ ] Create asset loader abstraction (works with bundled imports)
- [ ] Bundle hold SVG files as raw strings
- [ ] Bundle holds.json configuration
- [ ] Export clean public API from core
- [ ] Add core package build configuration (tsup or similar)

## Phase 3: Web App Scaffold

- [ ] Initialize Vite + React + TypeScript in `web/`
- [ ] Configure Tailwind CSS
- [ ] Add daisyUI plugin
- [ ] Configure path aliases for @voie-vitesse/core
- [ ] Create basic App layout (Header, Sidebar, Viewer)
- [ ] Verify core package imports work in browser

## Phase 4: State Management

- [ ] Install and configure Zustand
- [ ] Create configuration store with persist middleware
- [ ] Implement configuration CRUD (create, read, update, delete)
- [ ] Create section management actions
- [ ] Create viewer state (zoom, pan)
- [ ] Add reference routes loading

## Phase 5: Wall Configuration UI

- [ ] Create ConfigSelector component (dropdown + new/delete buttons)
- [ ] Create WallConfig component (lanes, panels inputs)
- [ ] Create SectionList component
- [ ] Create SectionItem component (source selector, lane, color picker)
- [ ] Create AddSection button/modal
- [ ] Wire components to Zustand store

## Phase 6: SVG Viewer - Basic

- [ ] Create SVGCanvas component
- [ ] Integrate core SVG generation
- [ ] Display generated SVG
- [ ] Implement zoom (mouse wheel + buttons)
- [ ] Implement pan (click + drag)
- [ ] Add zoom reset button

## Phase 7: SVG Viewer - Birdview

- [ ] Create Birdview component (minimap)
- [ ] Render scaled-down wall preview
- [ ] Show viewport rectangle
- [ ] Implement click-to-navigate
- [ ] Position in corner of viewer

## Phase 8: Hold Selection

- [ ] Create hold selector dropdown (by label)
- [ ] Implement start/end hold selection per section
- [ ] Add click-on-hold selection mode
- [ ] Add arrow key navigation between holds
- [ ] Highlight selected/selectable holds in viewer

## Phase 9: Lane Selection

- [ ] Add lane dropdown to SectionItem
- [ ] Implement click-on-lane selection
- [ ] Visual feedback for lane hover

## Phase 10: Export/Import

- [ ] Implement JSON export (download file)
- [ ] Implement JSON import (file picker)
- [ ] Implement SVG export (download file)
- [ ] Add export buttons to Header

## Phase 11: Polish

- [ ] Add loading states
- [ ] Add error handling and user feedback
- [ ] Keyboard shortcuts documentation
- [ ] Responsive sidebar (collapsible)
- [ ] Welcome screen for new users

## Dependencies

- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 2
- Phases 4-5 can start after Phase 3
- Phase 6 depends on Phases 4-5
- Phase 7 depends on Phase 6
- Phases 8-9 depend on Phase 6
- Phase 10 depends on Phase 4
- Phase 11 depends on all previous phases

## Parallelization

- Phases 4 and early Phase 5 (components without store) can run in parallel
- Phases 8 and 9 can run in parallel
- UI polish (Phase 11) can start incrementally
