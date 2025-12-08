# Proposal: Impression multi-pages

## Why

Lors de l'installation d'une voie d'escalade de vitesse, il est nécessaire d'avoir un plan imprimé à une échelle lisible. Le mur faisant environ 15m de haut, un export sur une seule page est illisible. L'impression sur plusieurs feuilles A4 permet d'avoir un plan à échelle raisonnable que l'on peut assembler ou consulter panneau par panneau.

## What Changes

### Nouvelle page "Imprimer"

Une page dédiée à la configuration et prévisualisation de l'impression multi-pages avec :

- **Deux modes d'impression** :
  - Mur complet découpé sur plusieurs feuilles
  - Couloir par couloir (paire SNx + DXx) découpé sur plusieurs feuilles

- **Configuration** :
  - Orientation : portrait (défaut) ou paysage
  - Nombre de pages en hauteur (la largeur s'adapte proportionnellement)
  - Zone de chevauchement configurable entre les pages

- **Prévisualisation** :
  - Grille miniature de toutes les pages avec découpage visible
  - Vue détaillée de la page sélectionnée (clic sur la grille)

- **Export PDF** :
  - Génération côté frontend (librairie type jsPDF ou pdf-lib)
  - Un seul fichier PDF multi-pages
  - Chaque page inclut : nom de la configuration, date d'export
  - Marges d'impression pour éviter la coupe par l'imprimante

### Navigation

- Nouveau bouton "Imprimer" dans le header pour accéder à la page
- Bouton retour pour revenir à la vue principale

## Scope

### In Scope
- Page dédiée à l'impression avec prévisualisation
- Mode mur complet multi-pages
- Mode couloir par couloir multi-pages
- Configuration orientation, nombre de pages, chevauchement
- Génération PDF côté frontend
- Marges d'impression

### Out of Scope
- Export PNG/JPEG (uniquement PDF)
- Repères d'alignement (les panneaux et inserts servent de repères)
- Sélection partielle des couloirs (tous sont imprimés)
- Indication de l'échelle sur les pages
- Numérotation des pages

## Impact Analysis

### Affected Specs
- `web-app` : nouvelle page, nouveau bouton header

### New Dependencies
- Librairie PDF frontend (jsPDF ou pdf-lib)

### Breaking Changes
Aucun. Nouvelle fonctionnalité additive.

## Open Questions

Aucune question ouverte.
