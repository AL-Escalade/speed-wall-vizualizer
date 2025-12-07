# Design: SVG Route Generator

## Context

Les ouvreurs de voies de vitesse doivent visualiser l'arrangement des prises avant le montage physique. Le mur standard IFSC comprend 2 couloirs (SN et DX) de 10 panneaux de hauteur chacun, avec une grille d'inserts normalisée.

**Contraintes :**
- Dimensions précises selon normes IFSC
- Fichiers SVG de prises fournis (non à l'échelle)
- Orientation des prises définie par rapport à un insert cible
- Composition de voies par assemblage de segments

## Goals / Non-Goals

**Goals :**
- Générer un SVG à l'échelle représentant le mur complet
- Afficher la grille des inserts avec coordonnées lisibles
- Placer les prises aux bonnes positions avec rotation correcte
- Permettre la composition multi-segments de voies
- Détecter visuellement les collisions potentielles

**Non-Goals :**
- Interface graphique interactive (CLI uniquement)
- Détection automatique des collisions (visuel seulement)
- Édition des positions de prises (lecture seule)

## Decisions

### Structure des données

**Decision :** Utiliser TypeScript avec des types stricts pour modéliser le mur, les panneaux, les inserts et les prises.

**Alternatives considérées :**
- JSON Schema seul : moins de validation au compile-time
- Classes : overhead inutile pour des structures de données simples

### Système de coordonnées

**Decision :** Utiliser un système de coordonnées global en millimètres avec origine en bas à gauche du mur.

Chaque insert est identifié par :
- `lane`: `SN` | `DX`
- `panel`: 1-10 (1 = bas)
- `column`: A-M (sans J, K)
- `row`: 1-10 (1 = bas du panneau)

**Calcul de position :**
```
x = lane_offset + (column_index * 125)
y = (panel - 1) * 1437.5 + 187.5 + (row - 1) * 125
```

### Rotation des prises

**Decision :** Calculer l'angle de rotation basé sur le vecteur entre position et orientation.

- Prise de main : orientation par défaut = flèche vers le bas (0°)
- Prise de pied : orientation par défaut = flèche vers la gauche (90°)

L'angle est calculé par `atan2(dy, dx)` entre les coordonnées de l'insert de position et de l'insert d'orientation.

### Structure des fichiers SVG de prises

**Decision :** Les fichiers SVG de prises contiennent des éléments nommés pour faciliter la manipulation.

Structure requise :
- `<path id="prise">` : forme de la prise, sera colorié selon la voie
- `<circle id="insert">` : point d'ancrage, son centre (cx, cy) définit le point à aligner sur l'insert

**Traitement au rendu :**
1. Parser le SVG pour extraire les éléments "prise" et "insert"
2. Lire les coordonnées cx, cy du circle "insert"
3. Appliquer la couleur de la voie au path "prise"
4. Translater pour aligner le centre du circle sur la position de l'insert cible

### Structure des données de voies de référence

**Decision :** Chaque voie de référence contient les métadonnées (dimensions, couleur) et les positions des prises.

Structure d'une voie de référence :
```typescript
interface HoldDimensions {
  width: number;   // en mm
  height: number;  // en mm
}

interface ReferenceRoute {
  // Dimensions réelles par type de prise (pour mise à l'échelle du SVG de base)
  // Les clés correspondent aux noms des fichiers SVG (BIG.svg, FOOT.svg, etc.)
  holdTypes: Record<string, HoldDimensions>;

  // Couleur des prises de cette voie
  color: string;  // ex: "#FF0000"

  // Liste des prises - format compact
  holds: string[];  // ex: ["DX1 FOOT F4 G4", "DX2 BIG F1 D3", ...]
}
```

**Format compact des prises :** `PANNEAU TYPE POSITION ORIENTATION`
- `PANNEAU` : SN1-SN10 ou DX1-DX10
- `TYPE` : nom du type de prise (BIG, FOOT, ou autre type personnalisé)
- `POSITION` : colonne+rangée (ex: F4, A10)
- `ORIENTATION` : colonne+rangée de l'insert cible (ex: G4, B10)

Exemple de voie de référence :
```json
{
  "ifsc": {
    "holdTypes": {
      "BIG": { "width": 460, "height": 350 },
      "FOOT": { "width": 70, "height": 78 }
    },
    "color": "#FF0000",
    "holds": [
      "DX1 FOOT F4 G4",
      "DX1 FOOT A10 B10",
      "DX2 BIG F1 D3",
      "DX2 BIG G3 E5",
      "DX2 BIG A9 C10"
    ]
  }
}
```

### Mise à l'échelle des SVG

**Decision :** Calculer le facteur d'échelle à partir des dimensions réelles définies par voie.

- Le SVG de base a des dimensions intrinsèques (viewBox ou width/height)
- Le facteur d'échelle = dimensions réelles / dimensions du SVG
- Chaque voie peut avoir des dimensions différentes (ex: U11/U13 = 40% de IFSC)

### Format de configuration

**Decision :** Fichier JSON de configuration séparé des données de voies de référence.

Configuration du mur et des segments :
```json
{
  "wall": {
    "lanes": 2,
    "panelsHeight": 10
  },
  "routes": [
    {
      "lane": "SN",
      "segments": [
        { "source": "u11-u13", "fromHold": 1, "toHold": 8 },
        { "source": "ifsc", "fromHold": 9, "toHold": 20 }
      ]
    }
  ]
}
```

Les voies de référence sont définies dans des fichiers séparés (`src/reference-routes/*.ts`) contenant les dimensions, couleur et positions.

### Formats de sortie multiples

**Decision :** Supporter SVG comme format principal, avec PDF et PNG optionnels.

- **SVG** : génération native (pas de dépendance)
- **PDF** : via librairie `pdfkit` ou conversion du SVG
- **PNG** : via `sharp` ou `canvas` pour rasterisation

**Alternatives considérées :**
- Puppeteer pour PDF/PNG : trop lourd, dépendance Chrome
- Uniquement SVG : limiterait l'usage pour impression

### Génération SVG

**Decision :** Utiliser une approche de génération de chaînes (template literals) plutôt qu'une librairie DOM.

**Raisons :**
- Pas de dépendance externe
- Contrôle précis du output
- Performance optimale pour un rendu unique

## Risks / Trade-offs

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Précision des calculs d'angle | Prises mal orientées | Tests unitaires avec cas limites |
| SVG trop volumineux | Performance navigateur | Optimiser les paths, limiter la précision décimale |
| Coordonnées IFSC incorrectes | Rendu invalide | Valider manuellement les données de référence |

## Open Questions

*(Résolu)* ~~Faut-il supporter d'autres formats de sortie (PDF, PNG) ?~~ → Oui, SVG + PDF + PNG
*(Résolu)* ~~Les données U15 et U11/U13 sont-elles disponibles dans le même format que IFSC ?~~ → Oui, même format
