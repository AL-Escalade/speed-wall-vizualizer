# Proposal: Indicateur de flèche d'orientation des prises

## Summary

Ajouter une option de configuration pour dessiner un indicateur visuel de la direction de la flèche des prises. Le triangle est dessiné sous la prise, avec sa base alignée sur l'insert de la prise et pointant dans la direction d'orientation. Cette fonctionnalité permet de simplifier l'ouverture des voies en rendant visuellement explicite l'orientation de chaque prise.

## Motivation

Lors de l'ouverture d'une voie d'escalade de vitesse, il est essentiel de comprendre l'orientation de chaque prise. Actuellement, l'orientation est implicite (définie par la rotation de la prise). Un indicateur visuel sous forme de triangle permet de rendre cette information explicite et facilement lisible, même de loin ou sur une impression.

## Proposed Solution

### Indicateur de flèche

Un triangle isocèle est dessiné **sous chaque prise** (sur un calque inférieur) avec les caractéristiques suivantes :

- **Base** : centrée sur l'insert de la prise
- **Direction** : pointe dans la direction de l'orientation (de l'insert de position vers l'insert d'orientation)
- **Longueur** : 1.5× la plus grande dimension de la prise concernée (largeur ou hauteur)
- **Couleur** : même couleur que la prise (fill avec même valeur)
- **Largeur de base** : proportionnelle à la taille de la prise (ex: 50% de la plus petite dimension)

### Exclusion par type de prise

Certains types de prises (comme le pad/STOP) n'ont pas besoin d'indicateur de flèche. Une nouvelle propriété `showArrow` est ajoutée dans la configuration des types de prises (`assets/holds/holds.json`) :

```json
{
  "STOP": {
    "description": "Bouton stop",
    "dimensions": { "width": 250, "height": 250 },
    "defaultOrientation": 0,
    "showArrow": false
  }
}
```

- **Valeur par défaut** : `true` (les flèches sont affichées si non spécifié)
- **Pour le type STOP** : `showArrow: false` (pas de flèche sur le pad)

### Option globale de configuration

Une nouvelle option `showArrow` est ajoutée pour activer/désactiver globalement l'affichage :
- **Dans le générateur SVG** : option `showArrow?: boolean` (défaut: `false`)
- **Dans l'application web** : checkbox "Afficher les flèches d'orientation" dans la sidebar

### Calcul de la géométrie

Le triangle est défini par 3 points :
1. **Pointe** : position de l'insert + vecteur direction × longueur
2. **Base gauche** : position de l'insert + vecteur perpendiculaire × (largeur_base/2)
3. **Base droite** : position de l'insert - vecteur perpendiculaire × (largeur_base/2)

Le vecteur direction est calculé à partir de l'angle de rotation de la prise.

## Scope

### In Scope
- Nouvelle option de configuration `showArrow` dans le générateur SVG
- Rendu du triangle d'orientation sous chaque prise
- Option dans l'interface web pour activer/désactiver les flèches
- Persistance de l'option dans la configuration sauvegardée

### Out of Scope
- Personnalisation de la couleur de la flèche (toujours la même que la prise)
- Personnalisation des dimensions de la flèche
- Export de la flèche dans des formats autres que SVG (PDF, PNG hériteront automatiquement)

## Impact Analysis

### Affected Specs
- `svg-route-generator`: ajout de l'option `showArrow` et du rendu du triangle
- `web-app`: ajout de l'option dans l'interface utilisateur

### Breaking Changes
Aucun. L'option est désactivée par défaut, le comportement existant est préservé.

## Open Questions

Aucune question ouverte - les clarifications ont été obtenues :
- Applicable à tous les types de prises (sauf ceux avec `showArrow: false`)
- Longueur basée sur la plus grande dimension de la prise concernée
- Triangle de la couleur de la prise, dessiné sous la prise
- Les pads (type STOP) n'ont pas de flèche (`showArrow: false` dans holds.json)
