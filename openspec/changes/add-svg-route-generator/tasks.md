# Tasks: SVG Route Generator

## 1. Project Setup
- [ ] 1.1 Initialiser le projet TypeScript avec `tsconfig.json`
- [ ] 1.2 Installer les dépendances : `tsx` pour l'exécution CLI
- [ ] 1.3 Installer les dépendances optionnelles : `sharp` pour PNG, `pdfkit` pour PDF
- [ ] 1.4 Configurer les scripts npm (`generate`, `build`)
- [ ] 1.5 Créer la structure de répertoires (`src/`, `assets/holds/`, `data/`)

## 2. Types et modèles de données
- [ ] 2.1 Créer `src/types.ts` avec les types : `Lane`, `Panel`, `Insert`, `Hold`, `HoldType`, `Route`, `Segment`
- [ ] 2.2 Créer `src/types.ts` avec le type `ReferenceRoute` incluant :
  - [ ] 2.2.1 `holdTypes: Record<string, { width, height }>` - dimensions par type (BIG, FOOT, etc.)
  - [ ] 2.2.2 `color: string` - couleur des prises
  - [ ] 2.2.3 `holds: string[]` - positions au format compact (ex: "DX2 BIG F1 D3")
- [ ] 2.3 Créer `src/config-schema.ts` avec le type de configuration JSON (wall, routes)

## 3. Grille du mur
- [ ] 3.1 Créer `src/plate-grid.ts` avec les constantes IFSC (dimensions, espacement)
- [ ] 3.2 Implémenter `getInsertPosition(lane, panel, column, row)` retournant les coordonnées en mm
- [ ] 3.3 Créer des tests unitaires pour la validation des calculs de position

## 4. Données des voies de référence
- [ ] 4.1 Créer `src/reference-routes/ifsc.ts` avec :
  - [ ] 4.1.1 holdTypes: { BIG: 460×350mm, FOOT: 70×78mm }
  - [ ] 4.1.2 Couleur (à définir)
  - [ ] 4.1.3 Positions des prises (depuis `docs/IFSC-coordinates.txt`, format: "DX2 BIG F1 D3")
- [ ] 4.2 Créer `src/reference-routes/u15.ts` (données à fournir)
- [ ] 4.3 Créer `src/reference-routes/u11-u13.ts` avec dimensions réduites (40%)
- [ ] 4.4 Implémenter le parser pour le format compact `PANNEAU TYPE POSITION ORIENTATION`

## 5. Calcul de rotation
- [ ] 5.1 Créer `src/rotation.ts` avec `calculateRotation(position, orientation, holdType)`
- [ ] 5.2 Gérer les orientations par défaut (BIG = bas, FOOT = gauche)
- [ ] 5.3 Créer des tests unitaires pour les cas limites d'angle

## 6. Composition de segments
- [ ] 6.1 Créer `src/route-composer.ts` avec `composeRoute(segments, referenceRoutes)`
- [ ] 6.2 Implémenter l'extraction des prises par plage (fromHold, toHold)
- [ ] 6.3 Gérer le repositionnement vertical des segments

## 7. Parsing des SVG de prises
- [ ] 7.1 Créer `src/hold-svg-parser.ts` avec `parseHoldSvg(svgContent)`
- [ ] 7.2 Extraire le `<path id="prise">` pour la forme de la prise
- [ ] 7.3 Extraire le `<circle id="insert">` et lire cx, cy comme point d'ancrage
- [ ] 7.4 Créer des tests unitaires avec les SVG fournis

## 8. Génération SVG
- [ ] 8.1 Créer `src/svg-generator.ts` avec la classe `SvgGenerator`
- [ ] 8.2 Implémenter `renderGrid()` pour la grille d'inserts avec étiquettes
- [ ] 8.3 Implémenter `renderHold(hold, svgData, referenceRoute)` avec :
  - [ ] 8.3.1 Calcul du facteur d'échelle depuis les dimensions (handHold/footHold)
  - [ ] 8.3.2 Application de la couleur (referenceRoute.color) au path "prise"
  - [ ] 8.3.3 Rotation selon l'orientation
  - [ ] 8.3.4 Translation pour aligner le centre du circle "insert" sur l'insert cible

## 9. Formats de sortie multiples
- [ ] 9.1 Créer `src/output/svg-output.ts` - génération SVG native
- [ ] 9.2 Créer `src/output/pdf-output.ts` - conversion en PDF via pdfkit
- [ ] 9.3 Créer `src/output/png-output.ts` - rasterisation via sharp
- [ ] 9.4 Créer `src/output/index.ts` - factory pour sélectionner le format

## 10. Interface CLI
- [ ] 10.1 Créer `src/cli.ts` avec parsing des arguments (`--config`, `--output`, `--format`)
- [ ] 10.2 Charger et valider le fichier de configuration JSON
- [ ] 10.3 Orchestrer la génération et l'écriture du fichier de sortie

## 11. Assets et configuration
- [ ] 11.1 Renommer et copier `docs/MAIN.svg` vers `assets/holds/BIG.svg`
- [ ] 11.2 Renommer et copier `docs/pied.svg` vers `assets/holds/FOOT.svg`
- [ ] 11.3 Vérifier que les SVG contiennent les éléments `id="prise"` et `id="insert"`
- [ ] 11.4 Créer un exemple de configuration `data/example-config.json`

## 12. Validation finale
- [ ] 12.1 Tester la génération SVG avec la voie IFSC complète
- [ ] 12.2 Tester la génération PDF
- [ ] 12.3 Tester la génération PNG
- [ ] 12.4 Vérifier visuellement les positions, rotations et couleurs des prises
- [ ] 12.5 Valider les dimensions à l'échelle
- [ ] 12.6 Tester la composition multi-segments
