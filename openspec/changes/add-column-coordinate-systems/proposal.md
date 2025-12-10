# Change: Add Column Coordinate Systems Support

## Why

L'IFSC et la FFME utilisent des systèmes de coordonnées différents pour les colonnes des prises :
- **IFSC** : ABCDEFGHILM (11 colonnes, pas de J ni K)
- **FFME** : ABCDEFGHIKL (11 colonnes, pas de J)
- **ABC** (simple) : ABCDEFGHIJK (11 colonnes, pas de L)

Actuellement, les fichiers JSON de routes mélangent ces systèmes, ce qui cause des erreurs de coordonnées et de la confusion lors de la maintenance. Chaque route devrait pouvoir déclarer son système de coordonnées natif pour que les données correspondent exactement aux documents officiels.

## What Changes

1. **Schéma des routes JSON** : Ajouter un champ `columns` optionnel pour déclarer le système de coordonnées utilisé (ex: `"columns": "ABCDEFGHILM"`)

2. **Parsing des coordonnées** : Lors du parsing d'une route, valider que les colonnes utilisées sont cohérentes avec le système déclaré. Lancer une erreur si une colonne invalide est utilisée.

3. **Conversion interne** : Le système interne utilise un index (0-10) pour les colonnes. La conversion se fait via le mapping déclaré dans `columns`.

4. **Affichage web** : Ajouter une option pour choisir le système de coordonnées à afficher sur la grille (ABC, FFME, IFSC)

5. **Restauration des données d'origine** : Remettre les fichiers JSON des routes IFSC dans leur système de coordonnées natif (ABCDEFGHILM)

## Impact

- Affected specs: `svg-route-generator`, `web-app`
- Affected code:
  - `schemas/route.schema.json` - Ajout du champ `columns`
  - `packages/core/src/types.ts` - Types pour les systèmes de coordonnées
  - `packages/core/src/plate-grid.ts` - Fonctions de conversion
  - `cli/src/reference-routes/index.ts` - Parsing avec validation
  - `data/routes/*.json` - Ajout du champ `columns` + restauration IFSC
  - `web/src/constants/routes.ts` - Systèmes de coordonnées prédéfinis
  - `web/src/store/types.ts` - Option d'affichage des coordonnées
  - `web/src/components/` - UI pour sélectionner le système d'affichage
