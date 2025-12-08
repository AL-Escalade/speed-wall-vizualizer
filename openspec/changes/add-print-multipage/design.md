# Design: Impression multi-pages

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      PrintPage                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │ PrintConfig     │  │ PrintPreview                    │  │
│  │                 │  │                                 │  │
│  │ - Mode          │  │  ┌─────────────────────────┐   │  │
│  │ - Orientation   │  │  │ PageGrid (miniatures)   │   │  │
│  │ - Pages height  │  │  │ - Clickable tiles       │   │  │
│  │ - Overlap       │  │  └─────────────────────────┘   │  │
│  │                 │  │                                 │  │
│  │ [Export PDF]    │  │  ┌─────────────────────────┐   │  │
│  │                 │  │  │ PageDetail (selected)   │   │  │
│  └─────────────────┘  │  │ - Full page preview     │   │  │
│                       │  └─────────────────────────┘   │  │
│                       └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. PrintPage
Route `/print` - Page principale contenant la configuration et la prévisualisation.

### 2. PrintConfig
Panneau de configuration avec :
- Sélecteur de mode (mur complet / couloir par couloir)
- Sélecteur d'orientation (portrait / paysage)
- Input nombre de pages en hauteur
- Input zone de chevauchement (mm)
- Bouton export PDF

### 3. PrintPreview
Zone de prévisualisation avec :
- Grille des pages miniatures
- Vue détaillée de la page sélectionnée

### 4. usePrintLayout (hook)
Calcule le layout d'impression :
- Dimensions effectives par page (A4 - marges)
- Échelle résultante
- Nombre de pages en largeur (calculé)
- Coordonnées de découpe pour chaque page

### 5. PDF Generator (utility)
Génère le PDF multi-pages :
- Utilise jsPDF ou pdf-lib
- Rasterise chaque page du SVG
- Ajoute les métadonnées (nom config, date)

## Calculs clés

### Dimensions page imprimable
```
A4 Portrait: 210mm × 297mm
A4 Paysage: 297mm × 210mm
Marges: 10mm (configurable)
Zone imprimable Portrait: 190mm × 277mm
Zone imprimable Paysage: 277mm × 190mm
```

### Calcul de l'échelle
```
contentHeight = hauteur du contenu SVG (mur ou couloir)
pagesHeight = nombre de pages en hauteur choisi
overlap = chevauchement entre pages

effectivePageHeight = pageHeight - (2 * margin)
totalPrintHeight = (pagesHeight * effectivePageHeight) - ((pagesHeight - 1) * overlap)

scale = totalPrintHeight / contentHeight
```

### Calcul du nombre de pages en largeur
```
contentWidth = largeur du contenu SVG
scaledWidth = contentWidth * scale
pagesWidth = ceil((scaledWidth + (pagesWidth - 1) * overlap) / effectivePageWidth)
```

## Mode couloir par couloir

Chaque couloir (SNx + DXx) est traité comme un contenu indépendant :
1. Extraire la zone du couloir du SVG global
2. Appliquer le layout multi-pages pour ce couloir
3. Générer les pages pour ce couloir
4. Passer au couloir suivant

Le PDF final contient tous les couloirs à la suite.

## Choix techniques

### Librairie PDF
**jsPDF** recommandé car :
- Plus mature et documenté
- Support natif SVG vers PDF
- Bonne gestion des pages multiples

### Rasterisation SVG
Pour chaque page :
1. Créer un canvas avec les dimensions de la page
2. Dessiner la portion du SVG correspondante (avec clip)
3. Exporter en image
4. Ajouter au PDF

Alternative : conversion SVG directe avec jsPDF (si supporté pour notre complexité SVG).

## État local vs global

L'état de configuration d'impression est **local à la page** (useState) car :
- Pas besoin de persistance
- Pas partagé avec d'autres composants
- Simplifie l'implémentation
