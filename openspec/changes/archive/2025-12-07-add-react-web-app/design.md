# Design: Add React Web Application

## Monorepo Structure

```
/
├── packages/
│   └── core/                    # Shared library
│       ├── src/
│       │   ├── types.ts         # Shared types
│       │   ├── svg-generator.ts # SVG generation (browser-compatible)
│       │   ├── hold-svg-parser.ts
│       │   ├── plate-grid.ts
│       │   ├── rotation.ts
│       │   └── route-composer.ts
│       ├── assets/
│       │   └── holds/           # Hold SVG files + holds.json
│       └── package.json
├── cli/                         # CLI tool (moved from src/)
│   ├── src/
│   │   ├── cli.ts
│   │   ├── output/              # PDF/PNG output handlers
│   │   └── reference-routes/
│   └── package.json
├── web/                         # React web application
│   ├── src/
│   │   ├── components/
│   │   ├── stores/
│   │   ├── hooks/
│   │   └── App.tsx
│   ├── public/
│   │   └── routes/              # Reference route JSON files
│   └── package.json
└── package.json                 # Workspace root
```

## Core Package Adaptations

### Browser Compatibility

The current code uses Node.js `fs` module. For browser compatibility:

1. **Hold SVG files**: Bundle as ES modules with raw imports
   ```typescript
   // Instead of: readFileSync('assets/holds/BIG.svg')
   import bigHoldSvg from '../assets/holds/BIG.svg?raw';
   ```

2. **Reference routes**: Fetch as static JSON or bundle inline
   ```typescript
   // Fetched at runtime from public/routes/
   const routes = await fetch('/routes/ifsc.json').then(r => r.json());
   ```

3. **Hold types config**: Bundle inline from holds.json

### API Design

```typescript
// packages/core/src/index.ts
export { generateSvg } from './svg-generator.js';
export { composeAllRoutes } from './route-composer.js';
export { parseHoldSvg, loadHoldSvg } from './hold-svg-parser.js';
export type { Config, Hold, Route, Segment, ... } from './types.js';
```

## Web Application Architecture

### State Management (Zustand)

```typescript
interface AppState {
  // Configurations
  configurations: Configuration[];
  activeConfigId: string | null;

  // Actions
  createConfiguration: (name: string) => void;
  deleteConfiguration: (id: string) => void;
  updateWallSize: (lanes: number, panels: number) => void;

  // Sections
  addSection: (routeSource: string, lane: string) => void;
  updateSection: (id: string, updates: Partial<Section>) => void;
  deleteSection: (id: string) => void;

  // Viewer
  zoom: number;
  pan: { x: number; y: number };
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
}
```

### Component Structure

```
App
├── Header
│   ├── ConfigSelector (dropdown + new/delete)
│   └── ExportButtons (JSON, SVG)
├── Sidebar
│   ├── WallConfig (lanes, panels inputs)
│   ├── SectionList
│   │   └── SectionItem (source, lane, color, start/end holds)
│   └── AddSectionButton
└── Viewer
    ├── SVGCanvas (zoomable, pannable)
    └── Birdview (minimap)
```

### SVG Viewer Implementation

1. **Container**: Fixed size container with overflow hidden
2. **Transform**: Apply scale and translate to SVG group
3. **Interactions**:
   - Wheel: zoom in/out centered on cursor
   - Mouse drag: pan
   - Click on hold: select for section start/end
4. **Birdview**: Scaled-down copy with viewport rectangle overlay

```typescript
// Zoom/pan transform
const transform = `translate(${pan.x}, ${pan.y}) scale(${zoom})`;

// Birdview viewport rectangle
const viewportRect = {
  x: -pan.x / zoom / birdviewScale,
  y: -pan.y / zoom / birdviewScale,
  width: containerWidth / zoom / birdviewScale,
  height: containerHeight / zoom / birdviewScale,
};
```

## Data Flow

```
User Action → Zustand Store → React Re-render → SVG Generation → Display
                    ↓
              localStorage (auto-persist)
```

1. User modifies configuration via UI
2. Zustand store updates state
3. React components re-render
4. `generateSvg()` called with new config
5. SVG displayed in viewer

## Reference Routes Loading

Reference routes (IFSC, etc.) are loaded at app startup:

```typescript
// web/src/hooks/useReferenceRoutes.ts
const useReferenceRoutes = () => {
  const [routes, setRoutes] = useState<Record<string, ReferenceRoute>>({});

  useEffect(() => {
    // Fetch all available routes from public/routes/
    fetch('/routes/index.json')
      .then(r => r.json())
      .then(index => Promise.all(
        index.routes.map(name =>
          fetch(`/routes/${name}.json`).then(r => r.json())
        )
      ))
      .then(setRoutes);
  }, []);

  return routes;
};
```

## Hold Selection Interaction

When selecting start/end holds:

1. **Dropdown mode**: Select from list of hold labels (N1, N2, ...)
2. **Click mode**: Click on hold in SVG viewer
3. **Arrow mode**: Use arrow keys to move between adjacent holds (by insert position)

```typescript
interface HoldSelectionState {
  mode: 'dropdown' | 'click' | 'arrows';
  targetField: 'start' | 'end';
  sectionId: string;
}
```
