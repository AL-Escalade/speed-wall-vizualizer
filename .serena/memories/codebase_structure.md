# Codebase Structure

```
voie-vitesse/
├── packages/
│   ├── core/src/           # Pure TS library (no UI deps)
│   │   ├── types.ts        # Domain types (Panel, Hold, Route, Config, ColumnSystem)
│   │   ├── plate-grid.ts   # Grid calculations (insert positions, dimensions, columns)
│   │   ├── route-composer.ts  # Route composition (parse holds, apply offsets/filters)
│   │   ├── svg-generator.ts   # SVG rendering from composed holds
│   │   ├── hold-svg-parser.ts # Parse hold SVG files, apply transforms
│   │   ├── rotation.ts     # Hold rotation calculations
│   │   ├── bundled-assets.ts  # Pre-bundled SVG content (generated)
│   │   └── index.ts        # Public exports
│   │
│   ├── cli/src/            # CLI for SVG/PDF/PNG generation
│   │   ├── cli.ts          # CLI entry point
│   │   ├── output/         # Output format handlers (svg, pdf, png)
│   │   └── reference-routes/ # Reference route management
│   │
│   └── web/src/            # React web app
│       ├── components/     # UI components (Viewer, Sidebar, Birdview, Header)
│       │   ├── layouts/    # Layout components
│       │   ├── print/      # Print-specific components
│       │   ├── section/    # Section editing components
│       │   └── sidebarComponents/ # Sidebar sub-components
│       ├── store/          # Zustand stores (config, routes, viewer)
│       ├── hooks/          # Custom React hooks
│       ├── i18n/           # Translations (fr, en, de, it)
│       ├── pages/          # Route pages (PrintPage)
│       ├── utils/          # Utility functions
│       ├── constants/      # App constants
│       └── test/           # Test setup
│
├── data/                   # Config files and reference routes
│   ├── routes/             # Reference route definitions (ifsc, u15, u11-u13, etc.)
│   └── *.json              # Sample wall configurations
│
├── openspec/               # OpenSpec change management
│   ├── specs/              # Main specs (current state of design)
│   └── changes/            # Active and archived changes
│
├── assets/                 # Hold SVG source files
├── schemas/                # JSON schemas
├── scripts/                # Build scripts (generate-bundled-assets)
└── docs/                   # Documentation
```

## Data Flow
1. Reference routes (`data/routes/*.json`) → hold positions
2. User config → wall dimensions + route segments with anchoring/filtering
3. Route composer → extract holds, apply offsets, filters
4. SVG generator → render holds with rotation, labels, grid
