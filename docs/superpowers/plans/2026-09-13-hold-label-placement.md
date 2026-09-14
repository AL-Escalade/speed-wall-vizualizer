# Placement des étiquettes de prises — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** afficher des étiquettes de prises jusqu'à 200 px sans qu'elles touchent leur prise, et en évitant au mieux les autres prises et étiquettes.

**Architecture :** trois modules purs dans core — `polygon-clip.ts` (découpage et aires), `hold-outline.ts` (chemin SVG → polygone), `label-placement.ts` (rayon depuis l'insert, éventail, repli) — alimentés par `hold-svg-parser.ts` (contours, ancres) via une nouvelle couche de transforms `svg-transform.ts`. `svg-generator.ts` calcule la géométrie de chaque prise une fois, place toutes les étiquettes (`layoutHoldLabels`), puis les écrit dans le repère du mur.

**Tech Stack :** TypeScript 7, Bun, Vitest, @xmldom/xmldom, React 19 (curseur web).

**Spec :** `docs/superpowers/specs/2026-09-13-hold-label-placement-design.md`

## Global Constraints

- Imports relatifs avec extension `.js` dans `packages/core` et `packages/cli` (`from './types.js'`).
- Core : fonctions pures, pas de classes, paramètres typés explicitement.
- Fichiers en kebab-case (sauf composants React en PascalCase).
- Bun uniquement : `bun install`, `bun run …`, jamais npm/npx.
- Tests : Vitest `describe`/`it`/`expect`, fichiers `*.test.ts` co-localisés. Un fichier : `bun run vitest run <chemin>`. Tout : `bun run vitest run`.
- Les tests du projet `cli` importent `@voie-vitesse/core` **compilé** : lancer `bun run build:core` avant eux dès que core a changé.
- Toute modification du rendu s'accompagne de `docs/images/*.svg` régénérées (`bun run generate:doc-images`).
- Aucune nouvelle chaîne visible dans le web (sinon : traduire dans les 4 fichiers `packages/web/src/i18n/*.json`).
- Constantes de la spec, à reprendre à l'identique : largeur `0,65 em` par caractère, marge `0,15 em`, pas `5 mm`, fenêtre `2 × fontSize`, éventail `22,5°`, repli `≤ 1,05 × min + 1 mm²`, epsilon d'aire `1e-6 mm²`, `8` segments par Bézier, taille normalisée `40` (invalide) / `200` (max, curseur).
- Chaque message de commit se termine par :

  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Cw2bCrTh2ovSazUMYpjY9C
  ```

## Structure des fichiers

| Fichier | Rôle |
|---|---|
| `packages/core/src/polygon-clip.ts` (créé) | Sutherland–Hodgman, aires, AABB |
| `packages/core/src/svg-transform.ts` (créé) | Matrices affines, lecture stricte des attributs `transform` |
| `packages/core/src/hold-outline.ts` (créé) | Premier sous-chemin d'un `d` SVG → polygone |
| `packages/core/src/label-placement.ts` (créé) | Algorithme de placement, sans SVG ni assets |
| `packages/core/src/hold-svg-parser.ts` (modifié) | Contour `outline`, zones `{ anchor, angle }`, contrat `text-anchor:middle` |
| `packages/core/src/types.ts` (modifié) | `LabelZone`, `HoldSvgData.outline` |
| `packages/core/src/svg-generator.ts` (modifié) | Géométrie partagée, `layoutHoldLabels`, rendu des étiquettes, normalisation de taille |
| `packages/core/src/index.ts` (modifié) | Exports publics |
| `assets/holds/STOP.svg` + `packages/core/src/bundled-assets.ts` (régénéré) | Zone `label` recentrée sous l'insert |
| `packages/cli/src/reference-routes/label-placement.test.ts` (créé) | Régression sur les voies de référence |
| `packages/web/src/components/Sidebar.tsx` (modifié) | Curseur 20–200 |
| `packages/web/src/components/sidebarComponents/DisplayOptions.tsx` (supprimé) | Copie morte |
| `CLAUDE.md`, `docs/images/*.svg` | Documentation, illustrations |

---

### Task 1 : primitive géométrique `polygon-clip.ts`

**Files :**
- Create : `packages/core/src/polygon-clip.ts`
- Test : `packages/core/src/polygon-clip.test.ts`

**Interfaces :**
- Consumes : `Point` (`./types.js`).
- Produces :
  - `AREA_EPSILON: number` (= `1e-6`)
  - `interface Aabb { minX: number; minY: number; maxX: number; maxY: number }`
  - `signedArea(points: Point[]): number`
  - `polygonArea(points: Point[]): number`
  - `clipPolygon(subject: Point[], convexClip: Point[]): Point[]`
  - `overlapArea(subject: Point[], convexClip: Point[]): number`
  - `aabb(points: Point[]): Aabb`
  - `aabbIntersects(a: Aabb, b: Aabb): boolean`

- [ ] **Step 1 : écrire les tests qui échouent**

`packages/core/src/polygon-clip.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { aabb, aabbIntersects, clipPolygon, overlapArea, polygonArea, signedArea } from './polygon-clip.js';
import type { Point } from './types.js';

function rect(x: number, y: number, width: number, height: number): Point[] {
  return [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }];
}

/** L-shape: [0,20]×[0,10] ∪ [0,10]×[10,20], area 300 */
const L_SHAPE: Point[] = [
  { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 10 },
  { x: 10, y: 10 }, { x: 10, y: 20 }, { x: 0, y: 20 },
];

describe('signedArea / polygonArea', () => {
  it('flips the sign with the winding but not the area', () => {
    expect(signedArea(rect(0, 0, 10, 20))).toBe(200);
    expect(signedArea(rect(0, 0, 10, 20).reverse())).toBe(-200);
    expect(polygonArea(rect(0, 0, 10, 20).reverse())).toBe(200);
  });

  it('measures a concave polygon', () => {
    expect(polygonArea(L_SHAPE)).toBe(300);
  });
});

describe('overlapArea', () => {
  it('is zero for disjoint shapes', () => {
    expect(overlapArea(rect(0, 0, 10, 10), rect(20, 20, 10, 10))).toBe(0);
  });

  it('is zero for shapes that only share an edge', () => {
    expect(overlapArea(rect(0, 0, 10, 10), rect(10, 0, 10, 10))).toBeCloseTo(0, 9);
  });

  it('is the inner area when the clip contains nothing but part of the subject', () => {
    expect(overlapArea(rect(0, 0, 100, 100), rect(10, 10, 20, 30))).toBeCloseTo(600);
  });

  it('is half when the clip covers half of the subject', () => {
    expect(overlapArea(rect(0, 0, 10, 10), rect(5, -5, 20, 20))).toBeCloseTo(50);
  });

  it('is exact for a concave subject clipped by a rectangle', () => {
    expect(overlapArea(L_SHAPE, rect(5, 5, 10, 10))).toBeCloseTo(75);
  });

  it('does not depend on the winding of the clip', () => {
    expect(overlapArea(L_SHAPE, rect(5, 5, 10, 10).reverse())).toBeCloseTo(75);
  });
});

describe('clipPolygon', () => {
  it('returns an empty polygon for an empty subject', () => {
    expect(clipPolygon([], rect(0, 0, 1, 1))).toEqual([]);
  });
});

describe('aabb', () => {
  it('bounds the points', () => {
    expect(aabb(rect(1, 2, 3, 4))).toEqual({ minX: 1, minY: 2, maxX: 4, maxY: 6 });
  });

  it('counts touching boxes as intersecting and far ones as not', () => {
    expect(aabbIntersects(aabb(rect(0, 0, 10, 10)), aabb(rect(10, 0, 10, 10)))).toBe(true);
    expect(aabbIntersects(aabb(rect(0, 0, 10, 10)), aabb(rect(11, 0, 10, 10)))).toBe(false);
  });
});
```

- [ ] **Step 2 : vérifier l'échec**

Run : `bun run vitest run packages/core/src/polygon-clip.test.ts`
Expected : FAIL, `Failed to resolve import "./polygon-clip.js"`.

- [ ] **Step 3 : implémenter**

`packages/core/src/polygon-clip.ts` :

```ts
/**
 * Polygon clipping and area helpers for label collision tests.
 *
 * One primitive answers both questions label placement asks: "do these shapes
 * touch?" (overlap above AREA_EPSILON) and "how much do they overlap?".
 */

import type { Point } from './types.js';

/** Overlap areas at or below this value (mm²) count as "no intersection" */
export const AREA_EPSILON = 1e-6;

/** Axis-aligned bounding box */
export interface Aabb {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Signed area of a polygon (shoelace formula); the sign gives the winding.
 */
export function signedArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

/**
 * Area of a polygon, whatever its winding.
 */
export function polygonArea(points: Point[]): number {
  return Math.abs(signedArea(points));
}

/** Cross product of (b - a) and (p - a): positive when p is left of a→b */
function cross(a: Point, b: Point, p: Point): number {
  return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
}

/** Intersection of segment s→e with the infinite line through a and b */
function intersect(s: Point, e: Point, a: Point, b: Point): Point {
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const t = (ex * (a.y - s.y) - ey * (a.x - s.x)) / (ex * dy - ey * dx);
  return { x: s.x + t * dx, y: s.y + t * dy };
}

/**
 * Sutherland–Hodgman: the part of `subject` inside `convexClip`.
 *
 * The subject may be concave (a BIG hold is); the clip must be convex (a label
 * box is). The clip winding does not matter. A concave subject can produce
 * degenerate zero-area edges, which leave the area exact.
 */
export function clipPolygon(subject: Point[], convexClip: Point[]): Point[] {
  const clip = signedArea(convexClip) < 0 ? [...convexClip].reverse() : convexClip;
  let output = subject;
  for (let i = 0; i < clip.length && output.length > 0; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const input = output;
    output = [];
    let previous = input[input.length - 1];
    for (const current of input) {
      const currentInside = cross(a, b, current) >= 0;
      const previousInside = cross(a, b, previous) >= 0;
      if (currentInside) {
        if (!previousInside) output.push(intersect(previous, current, a, b));
        output.push(current);
      } else if (previousInside) {
        output.push(intersect(previous, current, a, b));
      }
      previous = current;
    }
  }
  return output;
}

/**
 * Area of the part of `subject` inside `convexClip`.
 */
export function overlapArea(subject: Point[], convexClip: Point[]): number {
  return polygonArea(clipPolygon(subject, convexClip));
}

/**
 * Axis-aligned bounding box of a set of points.
 */
export function aabb(points: Point[]): Aabb {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Whether two boxes intersect; touching counts, so the prefilter never drops a
 * shape the exact test would keep.
 */
export function aabbIntersects(a: Aabb, b: Aabb): boolean {
  return a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY;
}
```

- [ ] **Step 4 : vérifier le succès**

Run : `bun run vitest run packages/core/src/polygon-clip.test.ts`
Expected : PASS (11 tests).

- [ ] **Step 5 : commit**

```bash
git add packages/core/src/polygon-clip.ts packages/core/src/polygon-clip.test.ts
git commit -m "feat(core): add polygon clipping and area helpers"
```

---

### Task 2 : transforms SVG stricts `svg-transform.ts`

**Files :**
- Create : `packages/core/src/svg-transform.ts`
- Test : `packages/core/src/svg-transform.test.ts`
- Modify : `packages/core/src/hold-svg-parser.ts:193-275` (remplacer `parseTransformMatrix`, `applyTransform`, `extractRotationFromMatrix`, `extractRotation`), `:304-310` (`extractInsertCenter`), `:380-382` (`extractPathElement`)
- Modify : `packages/core/src/hold-svg-parser.test.ts:143-152` et `:169-178`

**Interfaces :**
- Consumes : `Point`.
- Produces :
  - `type Matrix = [number, number, number, number, number, number]`
  - `IDENTITY_MATRIX: Matrix`
  - `translateMatrix(x: number, y: number): Matrix`
  - `rotateMatrix(degrees: number): Matrix`
  - `scaleMatrix(sx: number, sy?: number): Matrix`
  - `multiplyMatrices(m1: Matrix, m2: Matrix): Matrix` — applique `m2` puis `m1`
  - `applyMatrix(m: Matrix, p: Point): Point`
  - `matrixRotation(m: Matrix): number` — degrés SVG
  - `parseTransformList(transform: string | null): Matrix` — lève `Unsupported transform "<attribut>"`

- [ ] **Step 1 : écrire les tests qui échouent**

`packages/core/src/svg-transform.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { applyMatrix, matrixRotation, parseTransformList, rotateMatrix } from './svg-transform.js';

function expectPoint(actual: { x: number; y: number }, x: number, y: number): void {
  expect(actual.x).toBeCloseTo(x, 9);
  expect(actual.y).toBeCloseTo(y, 9);
}

describe('parseTransformList', () => {
  it('is the identity for a missing or blank attribute', () => {
    expectPoint(applyMatrix(parseTransformList(null), { x: 3, y: 4 }), 3, 4);
    expectPoint(applyMatrix(parseTransformList('  '), { x: 3, y: 4 }), 3, 4);
  });

  it('reads translate with one or two values', () => {
    expectPoint(applyMatrix(parseTransformList('translate(30, 40)'), { x: 1, y: 1 }), 31, 41);
    expectPoint(applyMatrix(parseTransformList('translate(5)'), { x: 1, y: 1 }), 6, 1);
  });

  it('reads rotate the SVG way (x axis onto y axis for 90°)', () => {
    expectPoint(applyMatrix(parseTransformList('rotate(90)'), { x: 1, y: 0 }), 0, 1);
  });

  it('reads rotate around a centre', () => {
    const m = parseTransformList('rotate(90, 10, 10)');
    expectPoint(applyMatrix(m, { x: 10, y: 10 }), 10, 10);
    expectPoint(applyMatrix(m, { x: 20, y: 10 }), 10, 20);
  });

  it('reads scale(-1) as a half turn', () => {
    const m = parseTransformList('scale(-1)');
    expectPoint(applyMatrix(m, { x: 1, y: 2 }), -1, -2);
    expect(matrixRotation(m)).toBeCloseTo(180, 9);
  });

  it('reads matrix()', () => {
    expectPoint(applyMatrix(parseTransformList('matrix(1,0,0,1,5,6)'), { x: 1, y: 1 }), 6, 7);
  });

  it('composes a list left to right (the rightmost applies first)', () => {
    expectPoint(applyMatrix(parseTransformList('translate(10, 0) rotate(90)'), { x: 1, y: 0 }), 10, 1);
  });

  it('throws on a function it cannot represent', () => {
    expect(() => parseTransformList('skewX(10)')).toThrow('Unsupported transform "skewX(10)"');
  });

  it('throws on trailing garbage', () => {
    expect(() => parseTransformList('rotate(45) junk')).toThrow('Unsupported transform');
  });
});

describe('matrixRotation', () => {
  it('returns the rotation angle in degrees', () => {
    expect(matrixRotation(rotateMatrix(45))).toBeCloseTo(45, 9);
  });
});
```

Dans `packages/core/src/hold-svg-parser.test.ts`, remplacer le test `should extract rotation from rotate transform with center point` (l. 143-152) — seule l'assertion change, la rotation vient maintenant d'une matrice :

```ts
  it('should extract rotation from rotate transform with center point', () => {
    const svgWithRotateCenter = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
        <path id="prise" d="M10 10L90 90Z" transform="rotate(45, 50, 50)"/>
      </svg>`;
    const svgData = parseHoldSvg(svgWithRotateCenter);

    expect(svgData.svgRotation).toBeCloseTo(45, 9);
  });
```

et remplacer `should return 0 rotation for unrecognized transform` (l. 169-178) par :

```ts
  it('should throw for a transform it cannot represent', () => {
    const svgWithSkew = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
        <path id="prise" d="M10 10L90 90Z" transform="skewX(10)"/>
      </svg>`;
    expect(() => parseHoldSvg(svgWithSkew)).toThrow('Unsupported transform "skewX(10)"');
  });
```

- [ ] **Step 2 : vérifier l'échec**

Run : `bun run vitest run packages/core/src/svg-transform.test.ts packages/core/src/hold-svg-parser.test.ts`
Expected : FAIL — `svg-transform.js` introuvable ; `should throw for a transform it cannot represent` échoue (aucune erreur levée).

- [ ] **Step 3 : implémenter `svg-transform.ts`**

```ts
/**
 * SVG transform attributes as affine matrices.
 *
 * Reads the transform lists Inkscape writes on hold assets. Any form outside
 * the supported set throws: outlines and label anchors are computed from these
 * matrices, so a silently ignored transform would misplace every label.
 */

import type { Point } from './types.js';

/** Affine matrix [a, b, c, d, e, f], as in SVG's matrix(a,b,c,d,e,f) */
export type Matrix = [number, number, number, number, number, number];

export const IDENTITY_MATRIX: Matrix = [1, 0, 0, 1, 0, 0];

export function translateMatrix(x: number, y: number): Matrix {
  return [1, 0, 0, 1, x, y];
}

/** Rotation in SVG degrees (clockwise on screen, y axis pointing down) */
export function rotateMatrix(degrees: number): Matrix {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [cos, sin, -sin, cos, 0, 0];
}

export function scaleMatrix(sx: number, sy: number = sx): Matrix {
  return [sx, 0, 0, sy, 0, 0];
}

/**
 * m1 · m2: applies m2 first, then m1 — the order of an SVG transform list.
 */
export function multiplyMatrices(m1: Matrix, m2: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

export function applyMatrix(m: Matrix, p: Point): Point {
  const [a, b, c, d, e, f] = m;
  return { x: a * p.x + c * p.y + e, y: b * p.x + d * p.y + f };
}

/**
 * Rotation carried by a matrix, in SVG degrees.
 */
export function matrixRotation(m: Matrix): number {
  return (Math.atan2(m[1], m[0]) * 180) / Math.PI;
}

const TRANSFORM_FUNCTION = /([a-zA-Z]+)\s*\(([^)]*)\)/g;

function transformFunctionMatrix(name: string, args: number[], source: string): Matrix {
  if (name === 'matrix' && args.length === 6) {
    return [args[0], args[1], args[2], args[3], args[4], args[5]];
  }
  if (name === 'translate' && (args.length === 1 || args.length === 2)) {
    return translateMatrix(args[0], args[1] ?? 0);
  }
  if (name === 'rotate' && args.length === 1) {
    return rotateMatrix(args[0]);
  }
  if (name === 'rotate' && args.length === 3) {
    const [angle, cx, cy] = args;
    return multiplyMatrices(multiplyMatrices(translateMatrix(cx, cy), rotateMatrix(angle)), translateMatrix(-cx, -cy));
  }
  if (name === 'scale' && (args.length === 1 || args.length === 2)) {
    return scaleMatrix(args[0], args[1] ?? args[0]);
  }
  throw new Error(`Unsupported transform "${source}"`);
}

/**
 * Parse an SVG transform attribute into one matrix.
 * Supports matrix, translate, rotate(a[, cx, cy]) and scale(sx[, sy]),
 * composed left to right.
 * @throws for any other function (skewX, skewY) or a malformed list
 */
export function parseTransformList(transform: string | null): Matrix {
  if (transform === null || transform.trim() === '') return IDENTITY_MATRIX;

  let matrix = IDENTITY_MATRIX;
  for (const match of transform.matchAll(TRANSFORM_FUNCTION)) {
    const rawArgs = match[2].trim();
    const args = rawArgs === '' ? [] : rawArgs.split(/[\s,]+/).map(Number);
    if (args.some((value) => Number.isNaN(value))) {
      throw new Error(`Unsupported transform "${transform}"`);
    }
    matrix = multiplyMatrices(matrix, transformFunctionMatrix(match[1], args, transform));
  }

  const leftover = transform.replace(TRANSFORM_FUNCTION, '').replace(/[\s,]/g, '');
  if (leftover !== '') {
    throw new Error(`Unsupported transform "${transform}"`);
  }
  return matrix;
}
```

- [ ] **Step 4 : brancher `hold-svg-parser.ts` sur ce module**

Dans `packages/core/src/hold-svg-parser.ts` :

1. Ajouter l'import : `import { applyMatrix, matrixRotation, parseTransformList } from './svg-transform.js';`
2. Supprimer toute la section « Transform Parsing (String-based - kept as-is) » : les fonctions `parseTransformMatrix`, `applyTransform`, `extractRotationFromMatrix`, `extractRotation` (l. 193-275).
3. Dans `extractInsertCenter`, remplacer le bloc

```ts
  let center: Point = {
    x: parseFloat(cx),
    y: parseFloat(cy),
  };

  const transform = element.getAttribute('transform');
  if (transform) {
    const matrix = parseTransformMatrix(transform);
    if (matrix) {
      center = applyTransform(center, matrix);
    }
  }

  return center;
```

par

```ts
  const center: Point = {
    x: parseFloat(cx),
    y: parseFloat(cy),
  };

  return applyMatrix(parseTransformList(element.getAttribute('transform')), center);
```

4. Dans `extractPathElement`, remplacer

```ts
  const transform = element.getAttribute('transform');
  const rotation = extractRotation(transform);
```

par

```ts
  const rotation = matrixRotation(parseTransformList(element.getAttribute('transform')));
```

- [ ] **Step 5 : vérifier le succès**

Run : `bun run vitest run packages/core/src/svg-transform.test.ts packages/core/src/hold-svg-parser.test.ts packages/core/src/svg-generator.test.ts`
Expected : PASS.

- [ ] **Step 6 : commit**

```bash
git add packages/core/src/svg-transform.ts packages/core/src/svg-transform.test.ts packages/core/src/hold-svg-parser.ts packages/core/src/hold-svg-parser.test.ts
git commit -m "feat(core): parse SVG transform lists strictly into matrices"
```

---

### Task 3 : contour de prise `hold-outline.ts`

**Files :**
- Create : `packages/core/src/hold-outline.ts`
- Test : `packages/core/src/hold-outline.test.ts`

**Interfaces :**
- Consumes : `Point`.
- Produces :
  - `BEZIER_SEGMENTS: number` (= 8)
  - `flattenFirstSubpath(d: string): Point[]` — lève `Unsupported path command "<lettre>"`

- [ ] **Step 1 : écrire les tests qui échouent**

`packages/core/src/hold-outline.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { BEZIER_SEGMENTS, flattenFirstSubpath } from './hold-outline.js';

const SQUARE = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];

describe('flattenFirstSubpath', () => {
  it('reads absolute lines', () => {
    expect(flattenFirstSubpath('M0,0 L10,0 L10,10 L0,10 Z')).toEqual(SQUARE);
  });

  it('reads relative lines and horizontal/vertical shortcuts', () => {
    expect(flattenFirstSubpath('m0,0 l10,0 l0,10 l-10,0 z')).toEqual(SQUARE);
    expect(flattenFirstSubpath('M0 0 h10 v10 h-10 z')).toEqual(SQUARE);
    expect(flattenFirstSubpath('M0 0 H10 V10 H0 Z')).toEqual(SQUARE);
  });

  it('repeats a command over extra parameter sets, as lines after a move', () => {
    expect(flattenFirstSubpath('M 0,0 10,0 10,10 0,10 z')).toEqual(SQUARE);
    expect(flattenFirstSubpath('m 0,0 10,0 0,10 -10,0 z')).toEqual(SQUARE);
  });

  it('cuts each cubic curve into BEZIER_SEGMENTS segments ending on its end point', () => {
    const points = flattenFirstSubpath('M0,0 C0,10 10,10 10,0 10,-10 20,-10 20,0');
    expect(points).toHaveLength(1 + 2 * BEZIER_SEGMENTS);
    expect(points[BEZIER_SEGMENTS]).toEqual({ x: 10, y: 0 });
    expect(points[2 * BEZIER_SEGMENTS]).toEqual({ x: 20, y: 0 });
  });

  it('chains relative cubic curves from the end of the previous one', () => {
    const points = flattenFirstSubpath('m0,0 c0,10 10,10 10,0 0,-10 10,-10 10,0');
    expect(points[BEZIER_SEGMENTS]).toEqual({ x: 10, y: 0 });
    expect(points[2 * BEZIER_SEGMENTS]).toEqual({ x: 20, y: 0 });
  });

  it('reflects the previous control point for a smooth curve', () => {
    const points = flattenFirstSubpath('M0,0 C0,10 10,10 10,0 S20,-10 20,0');
    // Second curve: (10,0) (10,-10) (20,-10) (20,0), at t = 0.5
    expect(points[BEZIER_SEGMENTS + BEZIER_SEGMENTS / 2].x).toBeCloseTo(15, 9);
    expect(points[BEZIER_SEGMENTS + BEZIER_SEGMENTS / 2].y).toBeCloseTo(-7.5, 9);
  });

  it('keeps only the first subpath', () => {
    expect(flattenFirstSubpath('M0,0 L10,0 L10,10 Z M50,50 L60,50')).toHaveLength(3);
    expect(flattenFirstSubpath('M0,0 L10,0 M50,50 L60,50')).toHaveLength(2);
  });

  it('reads exponent numbers', () => {
    expect(flattenFirstSubpath('M0,0 L1e1,0')).toEqual([{ x: 0, y: 0 }, { x: 10, y: 0 }]);
  });

  it('throws on arcs and quadratic curves', () => {
    expect(() => flattenFirstSubpath('M0,0 A5,5 0 0 1 10,0')).toThrow('Unsupported path command "A"');
    expect(() => flattenFirstSubpath('M0,0 Q5,5 10,0')).toThrow('Unsupported path command "Q"');
  });
});
```

- [ ] **Step 2 : vérifier l'échec**

Run : `bun run vitest run packages/core/src/hold-outline.test.ts`
Expected : FAIL, `Failed to resolve import "./hold-outline.js"`.

- [ ] **Step 3 : implémenter**

`packages/core/src/hold-outline.ts` :

```ts
/**
 * Hold outlines: SVG path data flattened to polygons.
 *
 * Label placement tests label boxes against the real hold shape, so the
 * Bézier curves of the "prise" path are cut into straight segments.
 */

import type { Point } from './types.js';

/** Straight segments per cubic Bézier curve */
export const BEZIER_SEGMENTS = 8;

const PATH_TOKEN = /[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
const SUPPORTED_COMMANDS = 'MmLlHhVvCcSsZz';

function isCommand(token: string): boolean {
  return /^[a-zA-Z]$/.test(token);
}

function appendCubic(points: Point[], p0: Point, p1: Point, p2: Point, p3: Point): void {
  for (let k = 1; k <= BEZIER_SEGMENTS; k++) {
    const t = k / BEZIER_SEGMENTS;
    const u = 1 - t;
    points.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    });
  }
}

/**
 * Flatten the first subpath of SVG path data into a polygon.
 *
 * Supports M L H V C S Z, absolute and relative, with implicit repetition
 * (extra parameter sets repeat the command; after M they are lines). Stops at
 * the first Z or at the second M: the first subpath of a compound hold shape is
 * its outer contour, the rule simplifyCompoundPath applies to the rendering.
 * @throws for arcs, quadratic curves or any other command
 */
export function flattenFirstSubpath(d: string): Point[] {
  const tokens = d.match(PATH_TOKEN) ?? [];
  const points: Point[] = [];
  let index = 0;
  let command = '';
  let current: Point = { x: 0, y: 0 };
  let lastControl: Point | null = null;
  let started = false;

  const nextNumber = (): number => {
    const token = tokens[index];
    if (token === undefined || isCommand(token)) {
      throw new Error(`Malformed path data: number expected at token ${index}`);
    }
    index++;
    return Number(token);
  };
  const nextPoint = (origin: Point): Point => {
    const x = nextNumber();
    const y = nextNumber();
    return { x: origin.x + x, y: origin.y + y };
  };

  while (index < tokens.length) {
    if (isCommand(tokens[index])) {
      command = tokens[index];
      index++;
      if (!SUPPORTED_COMMANDS.includes(command)) {
        throw new Error(`Unsupported path command "${command}"`);
      }
    } else if (command === '') {
      throw new Error('Malformed path data: it must start with a command');
    }

    const relative = command === command.toLowerCase();
    const origin: Point = relative ? current : { x: 0, y: 0 };

    switch (command.toUpperCase()) {
      case 'M': {
        if (started) return points;
        current = nextPoint(origin);
        points.push(current);
        started = true;
        lastControl = null;
        command = relative ? 'l' : 'L';
        break;
      }
      case 'L': {
        current = nextPoint(origin);
        points.push(current);
        lastControl = null;
        break;
      }
      case 'H': {
        current = { x: (relative ? current.x : 0) + nextNumber(), y: current.y };
        points.push(current);
        lastControl = null;
        break;
      }
      case 'V': {
        current = { x: current.x, y: (relative ? current.y : 0) + nextNumber() };
        points.push(current);
        lastControl = null;
        break;
      }
      case 'C': {
        const p1 = nextPoint(origin);
        const p2 = nextPoint(origin);
        const p3 = nextPoint(origin);
        appendCubic(points, current, p1, p2, p3);
        lastControl = p2;
        current = p3;
        break;
      }
      case 'S': {
        const p1: Point = lastControl === null
          ? current
          : { x: 2 * current.x - lastControl.x, y: 2 * current.y - lastControl.y };
        const p2 = nextPoint(origin);
        const p3 = nextPoint(origin);
        appendCubic(points, current, p1, p2, p3);
        lastControl = p2;
        current = p3;
        break;
      }
      default:
        // Z: the first subpath is closed
        return points;
    }
  }
  return points;
}
```

- [ ] **Step 4 : vérifier le succès**

Run : `bun run vitest run packages/core/src/hold-outline.test.ts`
Expected : PASS (9 tests).

- [ ] **Step 5 : commit**

```bash
git add packages/core/src/hold-outline.ts packages/core/src/hold-outline.test.ts
git commit -m "feat(core): flatten hold path data into outline polygons"
```

---

### Task 4 : contours et ancres dans `parseHoldSvg`, recentrage du STOP

**Files :**
- Modify : `packages/core/src/types.ts:226-249` (`LabelZone`, `HoldSvgData`)
- Modify : `packages/core/src/hold-svg-parser.ts` (en-tête l. 1-7, `extractLabelZones`, `parseHoldSvg`, `loadHoldSvg`, nouvelle section « Outline Extraction »)
- Modify : `assets/holds/STOP.svg:57-68`
- Regenerate : `packages/core/src/bundled-assets.ts` (`bun run generate:assets`)
- Test : `packages/core/src/hold-svg-parser.test.ts`

**Interfaces :**
- Consumes : `flattenFirstSubpath` (Task 3) ; `applyMatrix`, `matrixRotation`, `multiplyMatrices`, `parseTransformList`, `IDENTITY_MATRIX`, `Matrix` (Task 2) ; `polygonArea`, `aabb` (Task 1, tests seulement).
- Produces :
  - `LabelZone = { element: string; anchor: Point; angle: number }` — `element` est retiré en Task 6.
  - `HoldSvgData.outline: Point[][]` (repère de l'asset).
  - `parseHoldSvg` lève si une zone n'est pas centrée (`must be centred (text-anchor: middle)`) ou si l'asset n'a ni `prise` ni `pad`.
  - `loadHoldSvg` lève `Invalid hold SVG "<TYPE>": <cause>`.

- [ ] **Step 1 : écrire les tests qui échouent**

Ajouter en tête de `packages/core/src/hold-svg-parser.test.ts` :

```ts
import { aabb, polygonArea } from './polygon-clip.js';
```

Ajouter à la fin du fichier :

```ts
describe('hold outlines', () => {
  // Reference areas (asset units², first subpath, 8 segments per Bézier),
  // measured independently during the spec review
  it.each([
    ['BIG', 18417.3],
    ['FOOT', 3024.3],
    ['BIG-DE15', 4123.8],
    ['FOOT-DE15', 300.5],
  ])('outlines the whole %s shape', (type, expectedArea) => {
    const { outline } = parseHoldSvg(HOLD_SVG_CONTENT[type]);
    expect(outline).toHaveLength(1);
    expect(Math.abs(polygonArea(outline[0]) - expectedArea) / expectedArea).toBeLessThan(0.01);
  });

  it('keeps the outer contour of the compound BIG path', () => {
    const box = aabb(parseHoldSvg(HOLD_SVG_CONTENT.BIG).outline[0]);
    expect(box.minX).toBeCloseTo(20.2, 1);
    expect(box.minY).toBeCloseTo(10.5, 1);
    expect(box.maxX).toBeCloseTo(199.84, 1);
    expect(box.maxY).toBeCloseTo(274.14, 1);
  });

  it('outlines the STOP pad, stroke included, when there is no prise', () => {
    const [pad] = parseHoldSvg(HOLD_SVG_CONTENT.STOP).outline;
    const expected = [
      { x: -0.6325, y: -4.1514784 },
      { x: 250.6325, y: -4.1514784 },
      { x: 250.6325, y: 247.1135216 },
      { x: -0.6325, y: 247.1135216 },
    ];
    pad.forEach((corner, i) => {
      expect(corner.x).toBeCloseTo(expected[i].x, 3);
      expect(corner.y).toBeCloseTo(expected[i].y, 3);
    });
  });

  it('composes the transforms of a <g> prise down to each path', () => {
    const svg = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
        <g id="prise" transform="translate(10,0)">
          <path d="M0,0 L10,0 L10,10 Z" transform="scale(2)"/>
        </g>
      </svg>`;
    expect(parseHoldSvg(svg).outline).toEqual([[{ x: 10, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 20 }]]);
  });

  it('throws when there is neither a prise nor a pad to outline', () => {
    const svg = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
      </svg>`;
    expect(() => parseHoldSvg(svg)).toThrow('neither a "prise" shape nor a "pad" rect');
  });
});

describe('label zone anchors', () => {
  it('reads the anchor and angle of an Inkscape zone', () => {
    const { labelZones } = parseHoldSvg(HOLD_SVG_CONTENT.BIG);
    expect(labelZones.down?.anchor.x).toBeCloseTo(145.535, 2);
    expect(labelZones.down?.anchor.y).toBeCloseTo(227.620, 2);
    expect(labelZones.down?.angle).toBeCloseTo(-41.2205, 4);
  });

  it('reads scale(-1) as a half turn', () => {
    const { labelZones } = parseHoldSvg(HOLD_SVG_CONTENT.FOOT);
    expect(labelZones.right?.angle).toBeCloseTo(180, 6);
    expect(labelZones.right?.anchor.x).toBeCloseTo(36.4947, 3);
    expect(labelZones.right?.anchor.y).toBeCloseTo(-11.1164, 3);
  });

  it('centres the STOP label under its insert', () => {
    const { labelZones, insertCenter } = parseHoldSvg(HOLD_SVG_CONTENT.STOP);
    expect(labelZones.default?.anchor.x).toBeCloseTo(insertCenter.x, 3);
    expect(labelZones.default?.anchor.y).toBeGreaterThan(insertCenter.y);
    expect(labelZones.default?.angle).toBe(0);
  });

  it('throws when a zone is not centred on its anchor', () => {
    const svg = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
        <path id="prise" d="M10 10L90 10L90 90Z"/>
        <text inkscape:label="label" x="5" y="5" style="text-anchor:start"><tspan x="5" y="5">M1</tspan></text>
      </svg>`;
    expect(() => parseHoldSvg(svg)).toThrow('must be centred (text-anchor: middle)');
  });
});

describe('loadHoldSvg errors', () => {
  it('names the hold type when its SVG is invalid', async () => {
    HOLD_SVG_CONTENT.BROKEN = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle id="insert" cx="50" cy="50" r="5"/>
      </svg>`;
    try {
      await expect(loadHoldSvg('BROKEN')).rejects.toThrow('Invalid hold SVG "BROKEN"');
    } finally {
      delete HOLD_SVG_CONTENT.BROKEN;
    }
  });
});
```

- [ ] **Step 2 : vérifier l'échec**

Run : `bun run vitest run packages/core/src/hold-svg-parser.test.ts`
Expected : FAIL — `outline` indéfini, `anchor` indéfini, pas d'erreur levée.

- [ ] **Step 3 : types**

Dans `packages/core/src/types.ts`, remplacer `LabelZone` et `HoldSvgData` :

```ts
/** Label zone drawn in a hold asset */
export interface LabelZone {
  /** The cleaned text element (legacy rendering, removed once placement lands) */
  element: string;
  /** Text centre in the asset frame: gives the push direction from the insert */
  anchor: Point;
  /** Text rotation in the asset frame, in SVG degrees (clockwise) */
  angle: number;
}

/** Label zones indexed by arrow direction */
export type LabelZones = Partial<Record<ArrowDirection | 'default', LabelZone>>;

/** Parsed hold SVG data */
export interface HoldSvgData {
  /** The path element content for the hold shape (null if no colored shape) */
  pathElement: string | null;
  /** Additional elements (circles for insert, screw holes, etc.) */
  additionalElements: string[];
  /** Center of the insert circle (anchor point), with transforms applied */
  insertCenter: Point;
  /** Original viewBox dimensions */
  viewBox: Dimensions;
  /** Rotation angle (in degrees) from the SVG's transform, if any */
  svgRotation: number;
  /** Label zones for different orientations */
  labelZones: LabelZones;
  /** Hold shape as polygons in the asset frame, for label collision tests */
  outline: Point[][];
}
```

- [ ] **Step 4 : parseur**

Dans `packages/core/src/hold-svg-parser.ts` :

1. Remplacer l'en-tête (l. 1-7) :

```ts
/**
 * Parser for hold SVG files
 *
 * Hold SVG files must contain:
 * - A <path> or <g> element with id="prise" for the hold shape, or a
 *   <rect inkscape:label="pad"> for uncolored holds (STOP)
 * - A <circle> or <ellipse> element with id="insert" for the anchor point
 *
 * Label zones (<text inkscape:label="label-up|down|left|right|label">) give a
 * direction and an angle, not a position: the tspan x/y is the text centre
 * (text-anchor: middle is required), the label is pushed from the insert
 * toward it, and the <text> transform is the text angle. Font size, baseline
 * and style of the zone are ignored.
 */
```

2. Compléter l'import : `import { applyMatrix, matrixRotation, multiplyMatrices, parseTransformList, IDENTITY_MATRIX, type Matrix } from './svg-transform.js';` et ajouter `import { flattenFirstSubpath } from './hold-outline.js';`

3. Ajouter, avant la section « Label Zones Extraction » :

```ts
// ============================================================================
// Outline Extraction
// ============================================================================

function pathPolygon(path: Element, matrix: Matrix): Point[] {
  return flattenFirstSubpath(path.getAttribute('d') ?? '').map((p) => applyMatrix(matrix, p));
}

/** Transforms from `root` (included) down to `element` (included) */
function chainMatrix(root: Element, element: Element): Matrix {
  const chain: Element[] = [];
  let node: Element | null = element;
  while (node !== null) {
    chain.unshift(node);
    node = node === root ? null : (node.parentNode as Element | null);
  }
  return chain.reduce(
    (matrix, current) => multiplyMatrices(matrix, parseTransformList(current.getAttribute('transform'))),
    IDENTITY_MATRIX
  );
}

/** The pad rect, grown by half its stroke on each side */
function padPolygon(pad: Element): Point[] {
  const x = parseFloat(pad.getAttribute('x') ?? '0');
  const y = parseFloat(pad.getAttribute('y') ?? '0');
  const width = parseFloat(pad.getAttribute('width') ?? '0');
  const height = parseFloat(pad.getAttribute('height') ?? '0');
  const strokeInStyle = /stroke-width\s*:\s*([\d.]+)/.exec(pad.getAttribute('style') ?? '');
  const stroke = strokeInStyle ? parseFloat(strokeInStyle[1]) : parseFloat(pad.getAttribute('stroke-width') ?? '0');
  const half = stroke / 2;
  const matrix = parseTransformList(pad.getAttribute('transform'));
  return [
    { x: x - half, y: y - half },
    { x: x + width + half, y: y - half },
    { x: x + width + half, y: y + height + half },
    { x: x - half, y: y + height + half },
  ].map((p) => applyMatrix(matrix, p));
}

/**
 * Extract the hold outline, in the asset frame.
 * - <path> prise: its first subpath, through its own transform
 * - <g> prise: one polygon per descendant <path>, through the transforms
 *   from the <g> (included) down to the path (included)
 * - no prise (STOP): the "pad" rect
 * Parent group transforms are ignored, exactly as the rendering ignores them.
 */
function extractOutline(doc: Document): Point[][] {
  const prise = findElementByIdOrLabelMultiTag(doc, ['path', 'g'], 'prise');
  if (prise !== null && prise.tagName === 'path') {
    return [pathPolygon(prise, parseTransformList(prise.getAttribute('transform')))];
  }
  if (prise !== null) {
    const polygons: Point[][] = [];
    const paths = prise.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
      polygons.push(pathPolygon(paths[i], chainMatrix(prise, paths[i])));
    }
    return polygons;
  }
  const pad = findElementByIdOrLabel(doc, 'rect', 'pad');
  if (pad === null) {
    throw new Error('Hold SVG has neither a "prise" shape nor a "pad" rect to outline');
  }
  return [padPolygon(pad)];
}
```

4. Ajouter, dans la section « Label Zones Extraction », avant `extractLabelZones` :

```ts
/**
 * Effective text-anchor of a zone: the tspan's own value, else the text's
 * (style first, then attribute); SVG's default is start.
 */
function effectiveTextAnchor(text: Element, tspan: Element | null): string {
  const elements = tspan === null ? [text] : [tspan, text];
  for (const element of elements) {
    const inStyle = /text-anchor\s*:\s*([a-z]+)/i.exec(element.getAttribute('style') ?? '');
    if (inStyle) return inStyle[1];
    const attribute = element.getAttribute('text-anchor');
    if (attribute) return attribute;
  }
  return 'start';
}
```

5. Dans `extractLabelZones`, remplacer le corps de la boucle après `if (!zoneKey) continue;` par :

```ts
    const tspan = textElement.getElementsByTagName('tspan').item(0);
    if (effectiveTextAnchor(textElement, tspan) !== 'middle') {
      throw new Error(`Label zone "${inkscapeLabel}" must be centred (text-anchor: middle)`);
    }
    const positioned = tspan ?? textElement;
    const position = {
      x: parseFloat(positioned.getAttribute('x') ?? ''),
      y: parseFloat(positioned.getAttribute('y') ?? ''),
    };
    if (Number.isNaN(position.x) || Number.isNaN(position.y)) {
      throw new Error(`Label zone "${inkscapeLabel}" has no x/y position`);
    }
    const matrix = parseTransformList(textElement.getAttribute('transform'));

    // Clone and clean the text element (legacy rendering)
    const clone = textElement.cloneNode(true) as Element;
    removeUnwantedAttributes(clone, true);

    zones[zoneKey] = {
      element: elementToString(clone),
      anchor: applyMatrix(matrix, position),
      angle: matrixRotation(matrix),
    };
```

6. Dans `parseHoldSvg`, après `const labelZones = extractLabelZones(doc);`, ajouter `const outline = extractOutline(doc);` et ajouter `outline,` à l'objet retourné.

7. Dans `loadHoldSvg`, remplacer `const svgData = parseHoldSvg(content);` par :

```ts
  let svgData: HoldSvgData;
  try {
    svgData = parseHoldSvg(content);
  } catch (error) {
    throw new Error(`Invalid hold SVG "${upperType}": ${(error as Error).message}`);
  }
```

- [ ] **Step 5 : recentrer la zone du STOP**

Dans `assets/holds/STOP.svg`, bloc `<text … inkscape:label="label">` (l. 57-68) :
- sur `<text>` : `x="-1.3514959"` → `x="119.3675"` ;
- sur `<tspan>` : `x="-1.3514959"` → `x="119.3675"` et `style="stroke-width:1.265"` → `style="text-align:center;text-anchor:middle;stroke-width:1.265"`.

`y` reste `262.59595`. Puis :

Run : `bun run generate:assets`
Expected : `Generated …/bundled-assets.ts`, `5 SVG files bundled`. Vérifier que seul STOP change : `git diff --stat packages/core/src/bundled-assets.ts` → 1 fichier, quelques lignes.

- [ ] **Step 6 : vérifier le succès**

Run : `bun run vitest run packages/core/src/hold-svg-parser.test.ts packages/core/src/svg-generator.test.ts`
Expected : PASS (le rendu utilise encore `element`, inchangé).

- [ ] **Step 7 : commit**

```bash
git add packages/core/src/types.ts packages/core/src/hold-svg-parser.ts packages/core/src/hold-svg-parser.test.ts assets/holds/STOP.svg packages/core/src/bundled-assets.ts
git commit -m "feat(core): extract hold outlines and label zone anchors"
```

---

### Task 5 : algorithme de placement `label-placement.ts`

**Files :**
- Create : `packages/core/src/label-placement.ts`
- Test : `packages/core/src/label-placement.test.ts`

**Interfaces :**
- Consumes : `AREA_EPSILON`, `aabb`, `aabbIntersects`, `overlapArea`, `Aabb` (Task 1) ; `Point`.
- Produces :
  - constantes `LABEL_GLYPH_WIDTH_EM = 0.65`, `LABEL_MARGIN_EM = 0.15`, `LABEL_STEP_MM = 5`, `LABEL_WINDOW_EM = 2`, `LABEL_FAN_STEP_DEG = 22.5`
  - `interface LabelRequest { holdIndex: number; text: string; ownOutline: Point[][]; anchor: Point; insert: Point; angle: number }`
  - `interface LabelPlacement { holdIndex: number; text: string; center: Point; angle: number; width: number; height: number; direction: 'ray' | number; d: number; d0: number; fallback: boolean; ownOverlap: number; otherOverlap: number }`
  - `labelBox(center: Point, width: number, height: number, angle: number): Point[]`
  - `fanDeviations(): number[]`
  - `selectFallbackCandidate<T extends { overlap: number }>(candidates: T[]): T`
  - `placeHoldLabels(requests: LabelRequest[], outlines: Point[][][], fontSize: number): LabelPlacement[]` — résultat dans l'ordre de `requests`

- [ ] **Step 1 : écrire les tests qui échouent**

`packages/core/src/label-placement.test.ts`. Géométrie commune : prise carrée de 100 mm centrée sur son insert ; police 20 ; texte `M1` → boîte 26 × 20, boîte de test (marge 3) 32 × 26 ; décollage vers le bas quand `d − 13 ≥ 50`, soit `d₀ = 65` sur la grille de 5 mm.

```ts
import { describe, it, expect } from 'vitest';
import {
  fanDeviations,
  labelBox,
  placeHoldLabels,
  selectFallbackCandidate,
  type LabelRequest,
} from './label-placement.js';
import { overlapArea } from './polygon-clip.js';
import type { Point } from './types.js';

const FONT_SIZE = 20;

function rect(minX: number, minY: number, maxX: number, maxY: number): Point[] {
  return [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }];
}

function square(cx: number, cy: number, size: number): Point[] {
  return rect(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2);
}

function request(holdIndex: number, insert: Point, anchor: Point, outline: Point[]): LabelRequest {
  return { holdIndex, text: 'M1', ownOutline: [outline], anchor, insert, angle: 0 };
}

const HOLD = square(0, 0, 100);
const DOWN = request(0, { x: 0, y: 0 }, { x: 0, y: 60 }, HOLD);

describe('fanDeviations', () => {
  it('tries the drawn direction, then widens by 22.5° alternately', () => {
    expect(fanDeviations()).toEqual([
      0, 22.5, -22.5, 45, -45, 67.5, -67.5, 90, -90, 112.5, -112.5, 135, -135, 157.5, -157.5, 180,
    ]);
  });
});

describe('selectFallbackCandidate', () => {
  it('takes the first candidate within 5 % (+1 mm²) of the smallest overlap', () => {
    expect(selectFallbackCandidate([{ overlap: 100 }, { overlap: 97 }])).toEqual({ overlap: 100 });
    expect(selectFallbackCandidate([{ overlap: 100 }, { overlap: 97 }, { overlap: 50 }])).toEqual({ overlap: 50 });
  });
});

describe('placeHoldLabels', () => {
  it('lifts the label off its hold along the drawn direction', () => {
    const [placement] = placeHoldLabels([DOWN], [[HOLD]], FONT_SIZE);
    expect(placement).toMatchObject({
      holdIndex: 0, text: 'M1', direction: 'ray', d: 65, d0: 65,
      fallback: false, width: 26, height: 20, angle: 0, otherOverlap: 0,
    });
    expect(placement.center).toEqual({ x: 0, y: 65 });
    expect(placement.ownOverlap).toBeLessThanOrEqual(1e-6);
  });

  it('ignores how far the Inkscape anchor sits: it only gives a direction', () => {
    const far = request(0, { x: 0, y: 0 }, { x: 0, y: 300 }, HOLD);
    expect(placeHoldLabels([far], [[HOLD]], FONT_SIZE)[0].center).toEqual({ x: 0, y: 65 });
  });

  it('pushes a label straight down when the anchor sits on the insert', () => {
    const onInsert = request(0, { x: 0, y: 0 }, { x: 0, y: 0 }, HOLD);
    expect(placeHoldLabels([onInsert], [[HOLD]], FONT_SIZE)[0].center).toEqual({ x: 0, y: 65 });
  });

  it('stops right after a neighbour lying across the ray', () => {
    const bar = rect(-30, 70, 30, 85);
    const [placement] = placeHoldLabels([DOWN], [[HOLD], [bar]], FONT_SIZE);
    expect(placement).toMatchObject({ direction: 'ray', d: 100, fallback: false });
  });

  it('turns to the fan when the whole ray window is blocked', () => {
    const bar = rect(-12, 50, 12, 400);
    const [placement] = placeHoldLabels([DOWN], [[HOLD], [bar]], FONT_SIZE);
    expect(placement).toMatchObject({ direction: 22.5, d: 75, fallback: false });
  });

  it('falls back to the first least-overlapping candidate, never onto its own hold', () => {
    const everywhere = square(0, 0, 4000);
    const [placement] = placeHoldLabels([DOWN], [[HOLD], [everywhere]], FONT_SIZE);
    expect(placement).toMatchObject({ fallback: true, direction: 'ray', d: 65, d0: 65 });
    expect(placement.ownOverlap).toBeLessThanOrEqual(1e-6);
    expect(placement.otherOverlap).toBeCloseTo(32 * 26);
  });

  it('makes a later label avoid an earlier one', () => {
    const holdB = square(0, 140, 100);
    const up = request(1, { x: 0, y: 140 }, { x: 0, y: 80 }, holdB);
    const [a, b] = placeHoldLabels([DOWN, up], [[HOLD], [holdB]], FONT_SIZE);
    expect(b.fallback).toBe(false);
    expect(b.direction).not.toBe('ray');
    const boxA = labelBox(a.center, a.width, a.height, a.angle);
    const boxB = labelBox(b.center, b.width, b.height, b.angle);
    expect(overlapArea(boxA, boxB)).toBeLessThanOrEqual(1e-6);
  });

  it('places from the top of the wall down, whatever the request order', () => {
    const holdB = square(0, 140, 100);
    const up = request(1, { x: 0, y: 140 }, { x: 0, y: 80 }, holdB);
    const outlines = [[HOLD], [holdB]];
    const forward = placeHoldLabels([DOWN, up], outlines, FONT_SIZE);
    const backward = placeHoldLabels([up, DOWN], outlines, FONT_SIZE);
    expect(backward[1]).toEqual(forward[0]);
    expect(backward[0]).toEqual(forward[1]);
  });
});

describe('labelBox', () => {
  it('rotates the box around its centre', () => {
    const corners = labelBox({ x: 10, y: 10 }, 20, 10, 90);
    expect(corners[0].x).toBeCloseTo(15, 9);
    expect(corners[0].y).toBeCloseTo(0, 9);
  });
});
```

Vérification de `labelBox` : coin `(dx, dy) = (−w/2, −h/2) = (−10, −5)` tourné de 90° SVG (`cos = 0`, `sin = 1`) : `x = cx + dx·cos − dy·sin = 10 + 0 + 5 = 15`, `y = cy + dx·sin + dy·cos = 10 − 10 + 0 = 0`.

- [ ] **Step 2 : vérifier l'échec**

Run : `bun run vitest run packages/core/src/label-placement.test.ts`
Expected : FAIL, `Failed to resolve import "./label-placement.js"`.

- [ ] **Step 3 : implémenter**

`packages/core/src/label-placement.ts` :

```ts
/**
 * Hold label placement.
 *
 * Each label starts from its hold's insert and is pushed outward: first along
 * the direction the asset designer drew (insert → Inkscape anchor), then along
 * a fan of directions around it, until it clears its own hold, the other holds
 * and the labels already placed. Pure geometry in wall coordinates (mm, SVG
 * y-down): no SVG, no assets.
 */

import type { Point } from './types.js';
import { AREA_EPSILON, aabb, aabbIntersects, overlapArea, type Aabb } from './polygon-clip.js';

/** Estimated glyph advance, in em: core cannot measure a font */
export const LABEL_GLYPH_WIDTH_EM = 0.65;
/** Clearance around a label box during collision tests, in em */
export const LABEL_MARGIN_EM = 0.15;
/** Distance between two candidate positions along a direction, in mm */
export const LABEL_STEP_MM = 5;
/** How far past its lift-off a label may travel along one direction, in em */
export const LABEL_WINDOW_EM = 2;
/** Angle between two fan directions, in degrees */
export const LABEL_FAN_STEP_DEG = 22.5;

const FALLBACK_TOLERANCE = 1.05;
const FALLBACK_SLACK_MM2 = 1;
const DIRECTION_EPSILON_MM = 1;
const BOX_CORNERS: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

/** A label to place, in wall coordinates */
export interface LabelRequest {
  /** Index of the hold in the composed hold list */
  holdIndex: number;
  /** Displayed text */
  text: string;
  /** The hold's own outline */
  ownOutline: Point[][];
  /** Inkscape anchor: only gives the push direction from the insert */
  anchor: Point;
  /** Insert of the hold: origin of every direction */
  insert: Point;
  /** Label angle θ in SVG degrees (zone angle − hold rotation) */
  angle: number;
}

/** Where a label ended up */
export interface LabelPlacement {
  holdIndex: number;
  text: string;
  center: Point;
  angle: number;
  /** Label box, without the collision margin */
  width: number;
  height: number;
  /** 'ray' for the drawn direction, else the fan deviation in degrees */
  direction: 'ray' | number;
  /** Distance from the insert to the label centre, in mm */
  d: number;
  /** Lift-off distance in the chosen direction, in mm */
  d0: number;
  /** No free position existed: least overlap was kept */
  fallback: boolean;
  /** Overlap with its own hold, margin included (mm²) — always ≤ 1e-6 */
  ownOverlap: number;
  /** Overlap with other holds and labels, margin included (mm²) */
  otherOverlap: number;
}

interface Obstacle {
  polygons: Point[][];
  box: Aabb;
}

interface Candidate {
  center: Point;
  direction: 'ray' | number;
  d: number;
  d0: number;
  polygon: Point[];
  box: Aabb;
  ownOverlap: number;
  overlap: number;
}

/**
 * Corners of a width × height box centred on `center`, rotated by `angle` SVG
 * degrees: C + [[cos, −sin], [sin, cos]] · (±w/2, ±h/2).
 */
export function labelBox(center: Point, width: number, height: number, angle: number): Point[] {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return BOX_CORNERS.map(([sx, sy]) => {
    const dx = (sx * width) / 2;
    const dy = (sy * height) / 2;
    return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
  });
}

/**
 * Fan deviations in degrees, closest to the drawn direction first:
 * 0, +22.5, −22.5, … , +157.5, −157.5, 180.
 */
export function fanDeviations(): number[] {
  const deviations = [0];
  for (let step = LABEL_FAN_STEP_DEG; step < 180; step += LABEL_FAN_STEP_DEG) {
    deviations.push(step, -step);
  }
  deviations.push(180);
  return deviations;
}

/**
 * First candidate whose overlap is within 5 % (+1 mm²) of the smallest: exact
 * ties never happen between float areas, and a negligible gain is not worth
 * drifting away from the hold.
 */
export function selectFallbackCandidate<T extends { overlap: number }>(candidates: T[]): T {
  const smallest = Math.min(...candidates.map((candidate) => candidate.overlap));
  const selected = candidates.find(
    (candidate) => candidate.overlap <= FALLBACK_TOLERANCE * smallest + FALLBACK_SLACK_MM2
  );
  if (selected === undefined) {
    throw new Error('No label candidate to fall back on');
  }
  return selected;
}

function rotateVector(vector: Point, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { x: vector.x * cos - vector.y * sin, y: vector.x * sin + vector.y * cos };
}

/** Unit vector from the insert toward the anchor; straight down when they meet */
function rayDirection(request: LabelRequest): Point {
  const dx = request.anchor.x - request.insert.x;
  const dy = request.anchor.y - request.insert.y;
  const length = Math.hypot(dx, dy);
  return length < DIRECTION_EPSILON_MM ? { x: 0, y: 1 } : { x: dx / length, y: dy / length };
}

function overlapWith(polygon: Point[], box: Aabb, obstacle: Obstacle): number {
  if (!aabbIntersects(box, obstacle.box)) return 0;
  return obstacle.polygons.reduce((sum, shape) => sum + overlapArea(shape, polygon), 0);
}

/**
 * First distance on the 5 mm grid where the test box clears its own hold.
 * Past the farthest outline vertex plus half the box diagonal nothing can
 * intersect, so reaching that bound is an internal error, never a font size.
 */
function liftOff(request: LabelRequest, own: Obstacle, testBox: (d: number) => Point[], halfDiagonal: number): number {
  const reach = Math.max(
    0,
    ...request.ownOutline.flat().map((p) => Math.hypot(p.x - request.insert.x, p.y - request.insert.y))
  );
  const limit = reach + halfDiagonal + LABEL_STEP_MM;
  for (let d = 0; d <= limit; d += LABEL_STEP_MM) {
    const polygon = testBox(d);
    if (overlapWith(polygon, aabb(polygon), own) <= AREA_EPSILON) return d;
  }
  throw new Error(`Label "${request.text}" could not clear its own hold`);
}

function toPlacement(
  request: LabelRequest,
  candidate: Candidate,
  width: number,
  height: number,
  fallback: boolean
): LabelPlacement {
  return {
    holdIndex: request.holdIndex,
    text: request.text,
    center: candidate.center,
    angle: request.angle,
    width,
    height,
    direction: candidate.direction,
    d: candidate.d,
    d0: candidate.d0,
    fallback,
    ownOverlap: candidate.ownOverlap,
    otherOverlap: candidate.overlap,
  };
}

function placeLabel(request: LabelRequest, fontSize: number, obstacles: Obstacle[]): LabelPlacement {
  const width = [...request.text].length * LABEL_GLYPH_WIDTH_EM * fontSize;
  const height = fontSize;
  const margin = LABEL_MARGIN_EM * fontSize;
  const testWidth = width + 2 * margin;
  const testHeight = height + 2 * margin;
  const own: Obstacle = { polygons: request.ownOutline, box: aabb(request.ownOutline.flat()) };
  const ray = rayDirection(request);
  const candidates: Candidate[] = [];

  for (const deviation of fanDeviations()) {
    const direction = rotateVector(ray, deviation);
    const at = (d: number): Point => ({
      x: request.insert.x + d * direction.x,
      y: request.insert.y + d * direction.y,
    });
    const testBox = (d: number): Point[] => labelBox(at(d), testWidth, testHeight, request.angle);
    const d0 = liftOff(request, own, testBox, Math.hypot(testWidth, testHeight) / 2);

    for (let d = d0; d <= d0 + LABEL_WINDOW_EM * fontSize + 1e-9; d += LABEL_STEP_MM) {
      const polygon = testBox(d);
      const box = aabb(polygon);
      // Re-tested at every step: an arm of a concave hold can cross the ray again
      const ownOverlap = overlapWith(polygon, box, own);
      if (ownOverlap > AREA_EPSILON) continue;

      const candidate: Candidate = {
        center: at(d),
        direction: deviation === 0 ? 'ray' : deviation,
        d,
        d0,
        polygon,
        box,
        ownOverlap,
        overlap: 0,
      };
      if (!obstacles.some((obstacle) => overlapWith(polygon, box, obstacle) > AREA_EPSILON)) {
        return toPlacement(request, candidate, width, height, false);
      }
      candidates.push(candidate);
    }
  }

  for (const candidate of candidates) {
    candidate.overlap = obstacles.reduce(
      (sum, obstacle) => sum + overlapWith(candidate.polygon, candidate.box, obstacle),
      0
    );
  }
  return toPlacement(request, selectFallbackCandidate(candidates), width, height, true);
}

/**
 * Place hold labels, top of the wall first (then left to right, then by hold
 * index), so the result does not depend on the order of the sections.
 * @param requests - Labels to place (holds with an empty text are left out)
 * @param outlines - Outlines of every hold, indexed by holdIndex
 * @param fontSize - Label font size, in mm
 * @returns Placements, in the order of `requests`
 */
export function placeHoldLabels(requests: LabelRequest[], outlines: Point[][][], fontSize: number): LabelPlacement[] {
  const holdObstacles = outlines.map((polygons, index) => ({ index, polygons, box: aabb(polygons.flat()) }));
  const labelObstacles: Obstacle[] = [];
  const order = requests
    .map((_, index) => index)
    .sort((a, b) =>
      requests[a].insert.y - requests[b].insert.y
      || requests[a].insert.x - requests[b].insert.x
      || requests[a].holdIndex - requests[b].holdIndex
    );

  const placements = new Array<LabelPlacement>(requests.length);
  for (const index of order) {
    const request = requests[index];
    const obstacles: Obstacle[] = [
      ...holdObstacles.filter((obstacle) => obstacle.index !== request.holdIndex),
      ...labelObstacles,
    ];
    const placement = placeLabel(request, fontSize, obstacles);
    placements[index] = placement;
    const polygon = labelBox(placement.center, placement.width, placement.height, placement.angle);
    labelObstacles.push({ polygons: [polygon], box: aabb(polygon) });
  }
  return placements;
}
```

- [ ] **Step 4 : vérifier le succès**

Run : `bun run vitest run packages/core/src/label-placement.test.ts`
Expected : PASS (11 tests). Si `turns to the fan…` échoue sur `d`, recalculer à la main avant de toucher au code : direction `(−0,3827 ; 0,9239)`, `d₀ = 70` (à 65, `y − 13 = 47,05 < 50`), à 70 la boîte déborde de 1,21 mm sur la barre (`x ≤ −10,79`), à 75 elle est libre (`x ≤ −12,70`).

- [ ] **Step 5 : commit**

```bash
git add packages/core/src/label-placement.ts packages/core/src/label-placement.test.ts
git commit -m "feat(core): place hold labels along a ray then a fan from the insert"
```

---

### Task 6 : rendu des étiquettes dans `svg-generator.ts`

**Files :**
- Modify : `packages/core/src/svg-generator.ts` (imports l. 5-11, `DEFAULT_OPTIONS` l. 117-130, `generateHold` l. 254-428, `generateSvg` l. 536-628)
- Modify : `packages/core/src/types.ts` (retirer `LabelZone.element`)
- Modify : `packages/core/src/hold-svg-parser.ts` (`extractLabelZones` : ne plus cloner l'élément)
- Modify : `packages/core/src/index.ts:58-60`
- Test : `packages/core/src/svg-generator.test.ts`

**Interfaces :**
- Consumes : `placeHoldLabels`, `LabelRequest`, `LabelPlacement`, `labelBox` (Task 5) ; `applyMatrix`, `multiplyMatrices`, `rotateMatrix`, `scaleMatrix`, `translateMatrix`, `parseTransformList`, `Matrix` (Task 2) ; `HoldSvgData.outline`, `LabelZone.anchor/angle` (Task 4) ; `overlapArea` (Task 1, tests).
- Produces :
  - `layoutHoldLabels(config: Config, holds: ComposedHold[], options?: SvgOptions): Promise<LabelPlacement[]>` (exportée par `index.ts`)
  - exports `placeHoldLabels`, `labelBox`, `LabelRequest`, `LabelPlacement` depuis `index.ts`
  - étiquette SVG : `<text x y transform="rotate(θ, x, y)" text-anchor="middle" dominant-baseline="central" font-size font-family="'Lucida Grande', sans-serif" font-weight="500" fill>`

- [ ] **Step 1 : écrire les tests qui échouent**

Dans `packages/core/src/svg-generator.test.ts`, remplacer les imports par :

```ts
import { describe, it, expect } from 'vitest';
import { generateSvg, layoutHoldLabels } from './svg-generator.js';
import { loadHoldSvg } from './hold-svg-parser.js';
import { labelBox } from './label-placement.js';
import { overlapArea } from './polygon-clip.js';
import { applyMatrix, parseTransformList } from './svg-transform.js';
import type { Column, Config, ComposedSmearingZone } from './types.js';
import type { ComposedHold } from './route-composer.js';
```

et ajouter, dans le `describe('generateSvg', …)`, après le test `should use composedHoldNumber as label when label is not defined` :

```ts
  describe('hold label placement', () => {
    const WALL: Config = { wall: { lanes: 1, panelsHeight: 10 }, routes: [] };
    const COLUMNS = 'ABCDEFGHIJK';
    const LABEL_PATTERN = /<g id="hold-labels">\s*<text x="([^"]+)" y="([^"]+)" transform="rotate\(([^,]+), [^)]*\)"[^>]*font-size="([^"]+)"[^>]*>([^<]+)<\/text>/;

    /** A labelled hold on SN5 F5 pointing dColumn columns right and dRow rows up */
    function holdPointingTo(type: string, dColumn: number, dRow: number): ComposedHold {
      return {
        ...basicHold,
        type,
        panel: { side: 'SN', number: 5 },
        position: { column: 'F', row: 5 },
        orientation: { column: COLUMNS[5 + dColumn] as Column, row: 5 + dRow },
        label: 'M12',
      };
    }

    const TARGETS: [number, number][] = [];
    for (let dColumn = -3; dColumn <= 3; dColumn++) {
      for (let dRow = -3; dRow <= 3; dRow++) {
        if (dColumn !== 0 || dRow !== 0) TARGETS.push([dColumn, dRow]);
      }
    }

    /**
     * Overlap between the rendered label box and the hold outline placed with
     * the transform actually rendered — independent of the placement matrix.
     */
    async function renderedOwnOverlap(hold: ComposedHold, fontSize: number): Promise<number> {
      const svg = await generateSvg(WALL, [hold], { holdLabelFontSize: fontSize, showGrid: false, showCoordinateLabels: false });
      const transform = /<g transform="([^"]+)"[^>]*class="hold"/.exec(svg)![1];
      const [, x, y, angle, size, text] = LABEL_PATTERN.exec(svg)!;
      const width = text.length * 0.65 * Number(size);
      const box = labelBox({ x: Number(x), y: Number(y) }, width, Number(size), Number(angle));
      const matrix = parseTransformList(transform);
      const { outline } = await loadHoldSvg(hold.type);
      return outline.reduce((sum, polygon) => sum + overlapArea(polygon.map((p) => applyMatrix(matrix, p)), box), 0);
    }

    it.each(['BIG', 'FOOT', 'BIG-DE15', 'FOOT-DE15', 'STOP'])(
      'never lets a %s label touch its hold, whatever the rotation',
      async (type) => {
        for (const fontSize of [40, 200]) {
          for (const [dColumn, dRow] of TARGETS) {
            const overlap = await renderedOwnOverlap(holdPointingTo(type, dColumn, dRow), fontSize);
            expect(overlap, `${type} → (${dColumn}, ${dRow}) at ${fontSize}px`).toBeLessThanOrEqual(1e-6);
          }
        }
      }
    );

    it('turns the label by the zone angle minus the hold rotation', async () => {
      // BIG pointing one column right, two rows down: rotation 26.57°, zone label-down (−41.2205°)
      const hold = holdPointingTo('BIG', 1, -2);
      const [placement] = await layoutHoldLabels(WALL, [hold]);
      expect(placement.angle).toBeCloseTo(-67.79, 1);
      const [, , , angle] = LABEL_PATTERN.exec(await generateSvg(WALL, [hold]))!;
      expect(Number(angle)).toBeCloseTo(-67.79, 1);
    });

    it('writes the label exactly where layoutHoldLabels placed it', async () => {
      const hold = holdPointingTo('FOOT', 2, 1);
      const [placement] = await layoutHoldLabels(WALL, [hold], { holdLabelFontSize: 120 });
      const [, x, y, angle, size, text] = LABEL_PATTERN.exec(await generateSvg(WALL, [hold], { holdLabelFontSize: 120 }))!;
      expect(Number(x)).toBe(placement.center.x);
      expect(Number(y)).toBe(placement.center.y);
      expect(Number(angle)).toBe(placement.angle);
      expect(size).toBe('120');
      expect(text).toBe('M12');
    });

    it('leaves a hold with an empty label out of the placement', async () => {
      const placements = await layoutHoldLabels(WALL, [holdPointingTo('BIG', 1, 1), { ...holdPointingTo('FOOT', 1, 1), position: { column: 'B', row: 5 }, label: '' }]);
      expect(placements).toHaveLength(1);
      expect(placements[0].holdIndex).toBe(0);
    });

    it.each([
      [850, '850'],
      [5000, '1000'],
      [Number.NaN, '40'],
      [0, '40'],
    ])('normalises a hold label font size of %s to %s', async (fontSize, expected) => {
      const svg = await generateSvg(WALL, [holdPointingTo('BIG', 1, 1)], { holdLabelFontSize: fontSize });
      expect(LABEL_PATTERN.exec(svg)![4]).toBe(expected);
    });
  });
```

- [ ] **Step 2 : vérifier l'échec**

Run : `bun run vitest run packages/core/src/svg-generator.test.ts`
Expected : FAIL — `layoutHoldLabels` n'est pas exportée ; `LABEL_PATTERN` ne correspond pas au rendu actuel.

- [ ] **Step 3 : implémenter dans `svg-generator.ts`**

1. Imports (remplacer l. 5-11) :

```ts
import { type Config, type Dimensions, type ArrowDirection, type ColumnSystem, type ComposedSmearingZone, type HoldSvgData, type LabelZone, type Point, DEFAULT_COLUMN_SYSTEM } from './types.js';
import { GRID, PANEL, PANELS_PER_LANE, ROWS, PANEL_NUMBERS, getInsertPosition, getWallDimensions, getColumnsForSystem, parsePanelId } from './plate-grid.js';
import { calculateHoldRotation } from './rotation.js';
import { loadHoldSvg, getHoldDimensions, getHoldDefaultOrientation, getHoldShowArrow } from './hold-svg-parser.js';
import type { ComposedHold } from './route-composer.js';
import { formatHoldLabel, type HoldLabelLanguage } from './hold-label.js';
import { formatSmearingZoneLabel } from './smearing-zone-label.js';
import { applyMatrix, multiplyMatrices, rotateMatrix, scaleMatrix, translateMatrix, type Matrix } from './svg-transform.js';
import { placeHoldLabels, type LabelPlacement, type LabelRequest } from './label-placement.js';
```

(`parsePanelId` reste importé : `generateSmearingZones` s'en sert.)

2. Remplacer `holdLabelFontSize: 40,` dans `DEFAULT_OPTIONS` par `holdLabelFontSize: DEFAULT_HOLD_LABEL_FONT_SIZE,` et ajouter avant `DEFAULT_OPTIONS` :

```ts
/** Hold label font size used when the option is missing or invalid */
const DEFAULT_HOLD_LABEL_FONT_SIZE = 40;
/** Largest hold label font size: placement cost grows with it */
const MAX_HOLD_LABEL_FONT_SIZE = 1000;
/** Color of a hold (and its label) whose route gives none */
const FALLBACK_HOLD_COLOR = '#FF0000';

/**
 * Clamp the hold label font size: it reaches generateSvg unvalidated from
 * URLs, imports and localStorage.
 */
function normalizeHoldLabelFontSize(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) return DEFAULT_HOLD_LABEL_FONT_SIZE;
  return Math.min(value, MAX_HOLD_LABEL_FONT_SIZE);
}
```

3. Remplacer toute la fonction `generateHold` (l. 254-428) par :

```ts
/** Where a hold lands on the wall, shared by its rendering and its label placement */
interface HoldGeometry {
  svgData: HoldSvgData;
  /** Asset frame → wall frame: the same chain as `transform` */
  matrix: Matrix;
  transform: string;
  /** Rotation from calculateHoldRotation (counterclockwise, wall y-up) */
  rotation: number;
  /** Insert position on the wall (SVG coordinates) */
  insert: Point;
  labelZone: LabelZone | undefined;
}

/**
 * Compute where a hold lands on the wall
 */
async function computeHoldGeometry(hold: ComposedHold, wallDimensions: Dimensions): Promise<HoldGeometry> {
  // Get hold dimensions from central configuration, with the hold scale factor
  const baseDimensions = getHoldDimensions(hold.type);
  const holdDimensions = {
    width: baseDimensions.width * hold.holdScale,
    height: baseDimensions.height * hold.holdScale,
  };

  const svgData = await loadHoldSvg(hold.type);

  // Calculate position (coordinates are already converted to ABC system by parseHold)
  const pos = getInsertPosition(hold.panel, hold.position, hold.laneOffset);

  // Apply anchor offset if present (already in mm)
  if (hold.anchorOffset) {
    pos.x += hold.anchorOffset.x;
    pos.y += hold.anchorOffset.y;
  }

  // Convert to SVG coordinates (Y is inverted)
  const svgX = pos.x;
  const svgY = wallDimensions.height - pos.y;

  // Uniform scale to maintain aspect ratio
  const scale = Math.min(
    holdDimensions.width / svgData.viewBox.width,
    holdDimensions.height / svgData.viewBox.height
  );

  // Calculate rotation (use orientation panel if specified, otherwise same as hold panel).
  // The SVG's embedded transform already positions the hold with its arrow in the
  // default orientation, which DEFAULT_ORIENTATIONS describes: no svgRotation compensation.
  const rotation = calculateHoldRotation(
    hold.panel,
    hold.position,
    hold.orientationPanel ?? hold.panel,
    hold.orientation,
    hold.type,
    hold.laneOffset
  );

  // Translate to position, rotate around it (negated: SVG Y is inverted), scale,
  // then translate back by the insert center so the insert lands on the position
  const transform = [
    `translate(${svgX}, ${svgY})`,
    `rotate(${-rotation})`,
    `scale(${scale})`,
    `translate(${-svgData.insertCenter.x}, ${-svgData.insertCenter.y})`,
  ].join(' ');
  const matrix = [
    translateMatrix(svgX, svgY),
    rotateMatrix(-rotation),
    scaleMatrix(scale),
    translateMatrix(-svgData.insertCenter.x, -svgData.insertCenter.y),
  ].reduce((product, factor) => multiplyMatrices(product, factor));

  const labelZone = svgData.labelZones[getArrowDirection(hold.type, rotation)] ?? svgData.labelZones['default'];

  return { svgData, matrix, transform, rotation, insert: { x: svgX, y: svgY }, labelZone };
}

/**
 * Compute the geometry of every hold.
 * Sequential is fine: loadHoldSvg reads from an in-memory cache and parseHoldSvg
 * is synchronous CPU work, so Promise.all would not parallelize anything in practice.
 */
async function computeAllHoldGeometries(holds: ComposedHold[], wallDimensions: Dimensions): Promise<HoldGeometry[]> {
  const geometries: HoldGeometry[] = [];
  for (const hold of holds) {
    // eslint-disable-next-line no-await-in-loop
    geometries.push(await computeHoldGeometry(hold, wallDimensions));
  }
  return geometries;
}

/**
 * Generate the SVG of a single hold and of its orientation arrow
 */
function generateHold(
  hold: ComposedHold,
  geometry: HoldGeometry,
  wallDimensions: Dimensions
): { holdSvg: string; arrowSvg: string | null } {
  const { svgData, transform, insert } = geometry;
  const elements: string[] = [];

  // Colored path element (hold color already includes the route default from composeRoute)
  const holdColor = hold.color ?? FALLBACK_HOLD_COLOR;
  if (svgData.pathElement !== null) {
    elements.push(svgData.pathElement.replace(/<(path)/, `<$1 fill="${holdColor}"`));
  }

  // Additional elements (circles, or all visual elements for uncolored holds)
  elements.push(...svgData.additionalElements);

  // Data attributes for interactive selection
  const dataAttrs = [
    `data-source="${hold.sourceRoute}"`,
    `data-hold="${hold.originalHoldNumber}"`,
    `data-composed="${hold.composedHoldNumber}"`,
  ].join(' ');
  const holdSvg = `<g transform="${transform}" ${dataAttrs} class="hold">${elements.join('\n')}</g>`;

  // Arrow pointing to the target insert (if the hold type supports arrows)
  let arrowSvg: string | null = null;
  if (getHoldShowArrow(hold.type)) {
    const targetPos = getInsertPosition(hold.orientationPanel ?? hold.panel, hold.orientation, hold.laneOffset);

    // Same anchor offset as the hold: the arrow keeps its length and direction when the route moves
    if (hold.anchorOffset) {
      targetPos.x += hold.anchorOffset.x;
      targetPos.y += hold.anchorOffset.y;
    }

    const targetSvgPos = { x: targetPos.x, y: wallDimensions.height - targetPos.y };
    const arrowElements = generateArrowToTarget(insert, targetSvgPos, holdColor);
    if (arrowElements) {
      arrowSvg = arrowElements;
    }
  }

  return { holdSvg, arrowSvg };
}

/** Displayed text of a hold label: its translated label, else its composed number */
function holdLabelText(hold: ComposedHold, language: HoldLabelLanguage): string {
  return hold.label === undefined ? String(hold.composedHoldNumber) : formatHoldLabel(hold.label, language);
}

/**
 * Place the labels of holds whose geometry is known
 */
function placeLabels(
  holds: ComposedHold[],
  geometries: HoldGeometry[],
  fontSize: number,
  language: HoldLabelLanguage
): LabelPlacement[] {
  const outlines = geometries.map((geometry) =>
    geometry.svgData.outline.map((polygon) => polygon.map((p) => applyMatrix(geometry.matrix, p)))
  );
  const requests: LabelRequest[] = [];
  holds.forEach((hold, holdIndex) => {
    const text = holdLabelText(hold, language);
    // An empty label shows nothing, so it takes no room
    if (text === '') return;
    const geometry = geometries[holdIndex];
    requests.push({
      holdIndex,
      text,
      ownOutline: outlines[holdIndex],
      insert: geometry.insert,
      anchor: geometry.labelZone ? applyMatrix(geometry.matrix, geometry.labelZone.anchor) : geometry.insert,
      // Zone angle is an SVG rotate (clockwise); the hold rotation is counterclockwise
      angle: (geometry.labelZone?.angle ?? 0) - geometry.rotation,
    });
  });
  return placeHoldLabels(requests, outlines, fontSize);
}

/**
 * Place every hold label on the wall, in wall coordinates.
 * Exposed so placement can be tested and inspected without parsing SVG.
 */
export async function layoutHoldLabels(
  config: Config,
  holds: ComposedHold[],
  options: SvgOptions = {}
): Promise<LabelPlacement[]> {
  const wallDimensions = getWallDimensions(config.wall.lanes, config.wall.panelsHeight);
  const geometries = await computeAllHoldGeometries(holds, wallDimensions);
  return placeLabels(
    holds,
    geometries,
    normalizeHoldLabelFontSize(options.holdLabelFontSize),
    options.holdLabelLanguage ?? DEFAULT_OPTIONS.holdLabelLanguage
  );
}

/**
 * Render a placed label in wall coordinates, outside the hold's group
 */
function renderHoldLabel(placement: LabelPlacement, color: string, fontSize: number): string {
  const { center, angle, text } = placement;
  return `<text x="${center.x}" y="${center.y}" transform="rotate(${angle}, ${center.x}, ${center.y})" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" font-family="'Lucida Grande', sans-serif" font-weight="500" fill="${color}">${text}</text>`;
}
```

4. Dans `generateSvg` :
   - juste après `const opts = …`, ajouter `const holdLabelFontSize = normalizeHoldLabelFontSize(opts.holdLabelFontSize);` et `const holdLabelLanguage = opts.holdLabelLanguage ?? DEFAULT_OPTIONS.holdLabelLanguage;` ;
   - dans l'appel à `generateSmearingZones`, remplacer `opts.holdLabelFontSize, opts.holdLabelLanguage` par `holdLabelFontSize, holdLabelLanguage` ;
   - remplacer le bloc « Generate hold data first… » (l. 589-597) par :

```ts
  // Hold geometry first: rendering and label placement share it
  const geometries = await computeAllHoldGeometries(holds, wallDimensions);
  const holdResults = holds.map((hold, index) => generateHold(hold, geometries[index], wallDimensions));
```

   - remplacer le bloc « Holds » et « Hold number labels » (l. 610-622) par :

```ts
  // Holds
  parts.push(`<g id="holds">`);
  for (const { holdSvg } of holdResults) {
    parts.push(holdSvg);
  }
  parts.push(`</g>`);

  // Hold labels (separate layer so they appear on top)
  parts.push(`<g id="hold-labels">`);
  for (const placement of placeLabels(holds, geometries, holdLabelFontSize, holdLabelLanguage)) {
    parts.push(renderHoldLabel(placement, holds[placement.holdIndex].color ?? FALLBACK_HOLD_COLOR, holdLabelFontSize));
  }
  parts.push(`</g>`);
```

5. Retirer `element` de `LabelZone` dans `packages/core/src/types.ts` (le champ et son commentaire). Dans `extractLabelZones` (`hold-svg-parser.ts`), supprimer les lignes du clone (`// Clone and clean the text element (legacy rendering)`, `const clone = …`, `removeUnwantedAttributes(clone, true);`) et la propriété `element: elementToString(clone),`.

6. Dans `packages/core/src/index.ts`, remplacer le bloc « SVG Generation » par :

```ts
// SVG Generation
export { generateSvg, layoutHoldLabels } from './svg-generator.js';
export type { SvgOptions } from './svg-generator.js';

// Hold label placement
export { placeHoldLabels, labelBox } from './label-placement.js';
export type { LabelRequest, LabelPlacement } from './label-placement.js';
```

- [ ] **Step 4 : vérifier le succès et la compilation**

Run : `bun run vitest run packages/core/src/`
Expected : PASS (tout core).

Run : `bun run build:core`
Expected : aucune erreur `tsc`.

- [ ] **Step 5 : commit**

```bash
git add packages/core/src/svg-generator.ts packages/core/src/svg-generator.test.ts packages/core/src/types.ts packages/core/src/hold-svg-parser.ts packages/core/src/index.ts
git commit -m "feat(core): render hold labels at their computed placement"
```

---

### Task 7 : régression sur les voies de référence (CLI)

**Files :**
- Create : `packages/cli/src/reference-routes/label-placement.test.ts`

**Interfaces :**
- Consumes : `composeAllRoutes`, `layoutHoldLabels`, `labelBox`, `getWallDimensions`, types `Config`, `ComposedHold`, `LabelPlacement` (`@voie-vitesse/core`, compilé) ; `loadRoutes` (`./index.js`).
- Produces : rien (test).

- [ ] **Step 1 : écrire le test**

`packages/cli/src/reference-routes/label-placement.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import {
  composeAllRoutes,
  getWallDimensions,
  labelBox,
  layoutHoldLabels,
  type ComposedHold,
  type Config,
  type LabelPlacement,
} from '@voie-vitesse/core';
import { loadRoutes } from './index.js';

const routes = loadRoutes();

const IFSC_AND_U15_DE: Config = {
  wall: { lanes: 2, panelsHeight: 10 },
  routes: [
    { segments: [{ source: 'ifsc', laneOffset: 0 }] },
    { segments: [{ source: 'u15-de', laneOffset: 1 }] },
  ],
};

const FONT_SIZES = [40, 120, 200];

/**
 * Ceiling on fallbacks for IFSC + U15-DE, per font size. Measured 0 when the
 * placement landed (the spec review simulation found 0 too); the slack keeps a
 * hold nudged in a reference route from failing this test for no reason.
 */
const FALLBACK_CEILING = 2;

async function layout(config: Config, fontSize: number): Promise<{ holds: ComposedHold[]; placements: LabelPlacement[] }> {
  const holds = composeAllRoutes(config.routes, routes);
  const placements = await layoutHoldLabels(config, holds, { holdLabelFontSize: fontSize });
  return { holds, placements };
}

function holdKey(hold: ComposedHold): string {
  return `${hold.sourceRoute}#${hold.originalHoldNumber}@${hold.laneOffset}`;
}

describe('hold label placement on the reference routes', () => {
  it.each(FONT_SIZES)('keeps every label off its own hold at %ipx', async (fontSize) => {
    const { placements } = await layout(IFSC_AND_U15_DE, fontSize);
    for (const placement of placements) {
      expect(placement.ownOverlap, placement.text).toBeLessThanOrEqual(1e-6);
    }
  });

  it.each(FONT_SIZES)('rarely falls back at %ipx', async (fontSize) => {
    const { placements } = await layout(IFSC_AND_U15_DE, fontSize);
    expect(placements.filter((placement) => placement.fallback).length).toBeLessThanOrEqual(FALLBACK_CEILING);
  });

  it.each([120, 200])('frees M2 from M1 (IFSC) and H2 from H1 (U15-DE) at %ipx', async (fontSize) => {
    const { holds, placements } = await layout(IFSC_AND_U15_DE, fontSize);
    const find = (route: string, label: string): LabelPlacement | undefined =>
      placements.find((p) => holds[p.holdIndex].sourceRoute === route && holds[p.holdIndex].label === label);
    expect(find('ifsc', 'M2')?.fallback).toBe(false);
    expect(find('u15-de', 'H2')?.fallback).toBe(false);
  });

  it('does not depend on the order of the routes', async () => {
    const reversed: Config = { ...IFSC_AND_U15_DE, routes: [...IFSC_AND_U15_DE.routes].reverse() };
    const byHold = async (config: Config): Promise<Map<string, LabelPlacement>> => {
      const { holds, placements } = await layout(config, 200);
      return new Map(placements.map((p) => [holdKey(holds[p.holdIndex]), p]));
    };
    const forward = await byHold(IFSC_AND_U15_DE);
    const backward = await byHold(reversed);
    expect(backward.size).toBe(forward.size);
    for (const [key, placement] of forward) {
      expect(backward.get(key)?.center.x, key).toBeCloseTo(placement.center.x, 6);
      expect(backward.get(key)?.center.y, key).toBeCloseTo(placement.center.y, 6);
    }
  });

  it.each(['u15', 'u11-u13'])('keeps the %s finish pad label on the wall at 200px', async (source) => {
    const config: Config = { wall: { lanes: 1, panelsHeight: 10 }, routes: [{ segments: [{ source, laneOffset: 0 }] }] };
    const wall = getWallDimensions(config.wall.lanes, config.wall.panelsHeight);
    const { holds, placements } = await layout(config, 200);
    const pads = placements.filter((p) => holds[p.holdIndex].type === 'STOP');
    expect(pads.length).toBeGreaterThan(0);
    for (const pad of pads) {
      for (const corner of labelBox(pad.center, pad.width, pad.height, pad.angle)) {
        expect(corner.x).toBeGreaterThanOrEqual(0);
        expect(corner.x).toBeLessThanOrEqual(wall.width);
        expect(corner.y).toBeGreaterThanOrEqual(0);
        expect(corner.y).toBeLessThanOrEqual(wall.height);
      }
    }
  });
});
```

- [ ] **Step 2 : compiler core puis lancer**

Run : `bun run build:core && bun run vitest run packages/cli/src/reference-routes/label-placement.test.ts`
Expected : PASS (10 tests). Relever le nombre réel de replis par taille (ajouter temporairement un `console.log`, puis le retirer) et le reporter dans le commentaire de `FALLBACK_CEILING` s'il diffère de 0. Si un test échoue, **ne pas relâcher l'assertion** : c'est une régression de placement à diagnostiquer (superpowers:systematic-debugging).

- [ ] **Step 3 : commit**

```bash
git add packages/cli/src/reference-routes/label-placement.test.ts
git commit -m "test(cli): guard hold label placement on the reference routes"
```

---

### Task 8 : curseur web jusqu'à 200 et suppression du doublon mort

**Files :**
- Modify : `packages/web/src/components/Sidebar.tsx:395`
- Delete : `packages/web/src/components/sidebarComponents/DisplayOptions.tsx`
- Test : `packages/web/src/components/Sidebar.test.tsx`

**Interfaces :**
- Consumes : rien de nouveau.
- Produces : curseur `holdLabelFontSize` borné à `20–200`.

- [ ] **Step 1 : écrire le test qui échoue**

Dans `packages/web/src/components/Sidebar.test.tsx`, dans `describe('DisplayOptions section', …)`, ajouter :

```tsx
    it('should let hold labels grow up to 200px', () => {
      renderWithIntl(<Sidebar />);
      fireEvent.click(screen.getByText("Options d'affichage"));

      const slider = screen
        .getByText('Taille des noms de prises')
        .closest('.form-control')
        ?.querySelector('input[type="range"]');
      expect(slider).toHaveAttribute('max', '200');
    });
```

- [ ] **Step 2 : vérifier l'échec**

Run : `bun run vitest run packages/web/src/components/Sidebar.test.tsx`
Expected : FAIL, `max` vaut `"80"`.

- [ ] **Step 3 : implémenter**

Dans `packages/web/src/components/Sidebar.tsx`, dans le bloc du curseur `holdLabelFontSize` (l. 392-400), remplacer `max="80"` par `max="200"`.

Supprimer le doublon mort (non importé, pas dans `sidebarComponents/index.ts`) :

```bash
git rm packages/web/src/components/sidebarComponents/DisplayOptions.tsx
```

- [ ] **Step 4 : vérifier le succès**

Run : `bun run vitest run packages/web/src/components/Sidebar.test.tsx`
Expected : PASS.

- [ ] **Step 5 : commit**

```bash
git add packages/web/src/components/Sidebar.tsx packages/web/src/components/Sidebar.test.tsx
git commit -m "feat(web): let hold labels grow up to 200px"
```

---

### Task 9 : documentation, illustrations et vérification finale

**Files :**
- Modify : `CLAUDE.md` (nouvelle section après « Hold Labels », avant « Column Coordinate Systems »)
- Regenerate : `docs/images/*.svg`

**Interfaces :**
- Consumes : tout ce qui précède.
- Produces : documentation à jour.

- [ ] **Step 1 : documenter dans `CLAUDE.md`**

Insérer avant `### Column Coordinate Systems` :

```markdown
### Hold Label Placement

Hold labels are placed by `packages/core/src/label-placement.ts`, not drawn at a
fixed spot. Each label starts from its hold's **insert** and is pushed outward
until its box (text width estimated at 0.65 em per character, plus a 0.15 em
margin) clears its own hold outline — a hard guarantee — then the other holds
and the labels already placed:

1. along the **ray** from the insert toward the asset's Inkscape anchor;
2. if the ray is blocked for `2 × fontSize` past lift-off, along a **fan** of
   directions around it (±22.5°, ±45°, … 180°);
3. otherwise at the first position within 5 % of the least overlap.

Labels are placed top of the wall first, so the result does not depend on the
order of the sections. `layoutHoldLabels()` returns the placements (direction,
distance, fallback, overlaps) for tests and debugging.

In a hold asset, a `label-up|down|left|right` (or `label`) zone is a
**direction and an angle**, not a position: its tspan x/y is the text centre and
`text-anchor: middle` is required (`parseHoldSvg` throws otherwise); the
`<text>` transform gives the text angle; font size, baseline and style are
ignored. The hold outline is the first subpath of the `prise` path (or the
`pad` rect for STOP); path commands outside `M L H V C S Z` and transforms
outside `matrix translate rotate scale` throw.

Smearing zone labels share `holdLabelFontSize` but are not placed: they can
cover holds when the labels are large.
```

- [ ] **Step 2 : régénérer les illustrations**

Run : `bun run build:core && bun run generate:doc-images`
Expected : les `docs/images/*.svg` sont réécrites ; `git status` montre des modifications sur les SVG (toutes les étiquettes bougent, c'est attendu).

- [ ] **Step 3 : vérification complète**

Run, dans l'ordre, et lire la sortie de chacune :

```bash
bun run lint
bun run build
bun run vitest run
```

Expected : lint sans erreur, build sans erreur, tous les tests verts (core, cli, web).

- [ ] **Step 4 : relecture visuelle**

1. `bun run generate -- -c ../../data/base.json -o ../../output/base.pdf` puis `… -o ../../output/base.png` : ouvrir les deux fichiers et vérifier que les étiquettes sont centrées sur leur position (les moteurs PDF et PNG doivent honorer `dominant-baseline="central"` ; sinon, le signaler avant de continuer).
2. `bun run dev:web`, configuration IFSC + U15-DE avec zones d'adhérence : curseur « Taille des noms de prises » à 40 puis 200. Vérifier qu'aucune étiquette ne touche sa prise, que M2/M1 et H2/H1 sont lisibles, et que le curseur reste fluide.

- [ ] **Step 5 : commit**

```bash
git add CLAUDE.md docs/images
git commit -m "docs: document hold label placement and regenerate illustrations"
```
