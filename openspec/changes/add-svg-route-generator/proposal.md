# Change: Add SVG Route Generator for Speed Climbing Walls

## Why

Les ouvreurs de voies de vitesse ont besoin de visualiser l'arrangement des prises sur le mur avant le montage physique. L'objectif est de pouvoir composer des voies personnalisées en assemblant des segments de différentes voies de référence (IFSC, U15, U11/U13) et de vérifier visuellement qu'il n'y a pas de collisions entre les prises des couloirs adjacents.

## What Changes

### Modélisation du mur
- Grille de plaques IFSC : 11 colonnes (A-M, sans J/K) × 10 rangées par plaque
- Espacement : 125mm horizontal, 125mm vertical (187.5mm en haut/bas de plaque)
- Panneaux numérotés : SN (gauche/sinistra) et DX (droite), 1-10 (1 = bas)
- Nombre de couloirs configurable (par défaut 2)
- Dimensions d'une plaque : 1375mm × 1437.5mm

### Voies de référence
- 3 voies intégrées : IFSC officielle, U15, U11/U13 FFME
- Chaque voie de référence contient :
  - Dimensions par type de prise (ex: BIG: 460×350mm, FOOT: 70×78mm)
  - Couleur des prises
  - Liste des positions au format compact : `PANNEAU TYPE POSITION ORIENTATION`
- Format compact des prises :
  - `PANNEAU` : SN1-SN10 ou DX1-DX10
  - `TYPE` : nom du type de prise (BIG, FOOT, ou autre type personnalisé)
  - `POSITION` : colonne+rangée (ex: F4, A10)
  - `ORIENTATION` : insert cible (ex: G4, B10)
  - Exemple : `DX2 BIG F1 D3` = panneau DX2, prise BIG, position F1, flèche vers D3
- Types de prises extensibles : chaque type correspond à un fichier SVG (BIG.svg, FOOT.svg, etc.)
- Numérotation des prises : 1 = première prise en bas

### Composition multi-segments
- Définir une voie générée comme assemblage de portions de voies de référence
- Exemple : prises 1-8 de U11/U13 + prises 9-20 de IFSC sur le couloir DX
- Configuration via fichier JSON

### Rendu SVG à l'échelle
- Grille des inserts avec coordonnées (colonnes A-M, lignes 1-10 par plaque)
- Numérotation des panneaux (SN1-SN10, DX1-DX10)
- Prises représentées par fichiers SVG externes :
  - `BIG.svg` : prise de main (orientation par défaut : flèche vers le bas)
  - `FOOT.svg` : prise de pied (orientation par défaut : flèche vers la gauche)
  - Extensible : autres types de prises possibles via fichiers SVG additionnels
- Structure des fichiers SVG de prises :
  - Un `<path>` nommé "prise" : colorié selon la voie (couleur configurable)
  - Un `<circle>` nommé "insert" : son centre sert de point d'ancrage sur l'insert
- Rotation calculée selon l'orientation (angle entre position et insert cible)
- Facteur d'échelle configurable par voie (ex: U11/U13 = 40% de la taille standard)

### Formats de sortie
- SVG (principal)
- PDF (optionnel)
- PNG (optionnel)

### CLI
- Exécution via `tsx src/cli.ts --config wall-config.json`
- Option `--output` pour spécifier le fichier de sortie
- Option `--format` pour choisir le format (svg, pdf, png)

## Impact

- Affected specs: `svg-route-generator` (nouvelle capability)
- Affected code:
  - `src/types.ts` - Types pour modèles de données
  - `src/plate-grid.ts` - Grille d'inserts IFSC avec coordonnées réelles
  - `src/reference-routes/ifsc.ts` - Données voie IFSC officielle
  - `src/reference-routes/u15.ts` - Données voie U15
  - `src/reference-routes/u11-u13.ts` - Données voie U11/U13
  - `src/svg-generator.ts` - Génération du SVG à l'échelle
  - `src/cli.ts` - Interface ligne de commande
  - `assets/holds/MAIN.svg` - Prise de main
  - `assets/holds/pied.svg` - Prise de pied
