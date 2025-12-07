# Speed Wall Visualizer

Outil de visualisation pour murs de vitesse d'escalade. Permet de générer des SVG représentant le placement des prises sur un mur selon différentes voies de référence (IFSC, catégories jeunes, etc.).

## Installation

```bash
npm install
npm run build
```

## Utilisation

### Générer un SVG

```bash
npm run generate -- -c data/base.json -o output/wall.svg
```

Options :
- `-c, --config <path>` : Fichier de configuration JSON
- `-o, --output <path>` : Fichier SVG de sortie

### Configuration

Le fichier de configuration définit :
- Les dimensions du mur (nombre de couloirs, hauteur en panneaux)
- Les voies à afficher avec leurs segments

Exemple (`data/base.json`) :
```json
{
  "wall": {
    "lanes": 2,
    "panelsHeight": 10
  },
  "routes": [
    {
      "segments": [
        { "source": "ifsc", "color": "#FF0000" }
      ]
    }
  ]
}
```

### Voies de référence disponibles

- `ifsc` : Voie officielle IFSC
- `u11-u13` : Catégorie U11-U13
- `training` : Voie d'entraînement personnalisée

## Structure du projet

```
├── src/                    # Code source TypeScript
│   ├── cli.ts              # Point d'entrée CLI
│   ├── svg-generator.ts    # Génération SVG
│   ├── plate-grid.ts       # Calculs de grille
│   ├── rotation.ts         # Calculs de rotation des prises
│   ├── hold-svg-parser.ts  # Parsing des SVG de prises
│   └── route-composer.ts   # Composition des voies
├── assets/holds/           # SVG des différents types de prises
├── data/
│   └── routes/             # Définitions des voies de référence
└── output/                 # SVG générés (non versionné)
```

## Format des prises

Chaque prise est définie par :
- **Panel** : Identifiant du panneau (ex: `SN1`, `DX5`)
- **Type** : Type de prise (`BIG`, `FOOT`, `STOP`, `PAD`)
- **Position** : Coordonnées sur la grille (ex: `F10`, `C2`)
- **Orientation** : Direction de la flèche (ex: `E2`, `DX2:C2`)

Exemple : `"DX1 BIG F10 DX2:C2 @N1"` place une prise BIG en F10 sur DX1, orientée vers C2 sur DX2, avec le label "N1".

## Licence

GPL-3.0
