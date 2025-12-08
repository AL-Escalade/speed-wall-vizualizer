# Tasks: Indicateur de flèche d'orientation des prises

## Implementation Tasks

### 1. Core: Ajouter showArrow à la config des types de prises
- [x] Ajouter `showArrow?: boolean` à l'interface `HoldTypeConfig` dans `src/types.ts`
- [x] Ajouter `showArrow: false` pour le type STOP dans `assets/holds/holds.json`
- [x] Créer une fonction `getHoldShowArrow(holdType)` dans `src/hold-svg-parser.ts` (défaut: `true`)
- **Validation** : Le build TypeScript passe sans erreur

### 2. Core: Ajouter l'option showArrow au générateur SVG
- [x] Ajouter `showArrow?: boolean` à l'interface `SvgOptions` dans `src/svg-generator.ts`
- [x] Ajouter la valeur par défaut `showArrow: false` dans `DEFAULT_OPTIONS`
- **Validation** : Le build TypeScript passe sans erreur

### 3. Core: Implémenter la fonction de génération du triangle
- [x] Créer une fonction `generateArrowIndicator(hold, rotation, holdDimensions, wallDimensions, color)` dans `src/svg-generator.ts`
- [x] Calculer le vecteur direction à partir de l'angle de rotation
- [x] Calculer longueur = 1.5 × max(width, height) de la prise
- [x] Calculer largeur base = 0.5 × min(width, height) de la prise
- [x] Calculer les 3 points du triangle (pointe + 2 points de base)
- [x] Retourner un élément SVG `<polygon>` avec les coordonnées calculées
- **Validation** : Tests unitaires pour le calcul des coordonnées du triangle

### 4. Core: Intégrer les triangles dans le rendu SVG
- [x] Créer un nouveau groupe `<g id="arrows">` **avant** le groupe `<g id="holds">`
- [x] Pour chaque prise, vérifier si `showArrow` est activé ET si le type de prise supporte les flèches
- [x] Si oui, appeler `generateArrowIndicator` et ajouter le triangle au groupe "arrows"
- **Validation** : Le SVG généré avec `showArrow: true` contient les triangles (sauf pour STOP)

### 5. Core: Exporter l'option depuis le package
- [x] Mettre à jour l'export de `SvgOptions` si nécessaire
- [x] Ajouter `getHoldShowArrow` aux exports du package core
- **Validation** : Le build et les types sont corrects

### 6. Web: Ajouter l'état showArrow au store
- [x] Ajouter `showArrow?: boolean` à l'interface `SavedConfiguration` dans `web/src/store/types.ts`
- [x] Ajouter l'action `setShowArrow(showArrow: boolean)` au store
- **Validation** : L'état est persisté correctement dans localStorage

### 7. Web: Ajouter le toggle dans la sidebar
- [x] Ajouter une checkbox "Afficher les flèches d'orientation" dans la section de configuration du mur
- [x] Connecter la checkbox au store
- **Validation** : La checkbox toggle l'état et le SVG se met à jour

### 8. Web: Passer l'option au générateur SVG
- [x] Modifier l'appel à `generateSvg` dans `Viewer.tsx` pour inclure `showArrow`
- **Validation** : Les triangles apparaissent/disparaissent selon l'option

### 9. Tests et validation finale
- [ ] Vérifier le rendu avec différentes orientations de prises
- [ ] Vérifier le rendu avec différents types de prises (BIG, FOOT, STOP)
- [ ] Vérifier que les triangles sont bien sous les prises (ordre de rendu)
- [ ] Vérifier que la couleur des triangles correspond à la couleur des prises
- [ ] Vérifier que le type STOP (pad) n'a pas de flèche
- **Validation** : Tests manuels sur l'interface web

## Dependencies

- Tâches 2-4 dépendent de la tâche 1
- Tâche 4 dépend des tâches 2 et 3
- Tâches 6-8 peuvent être faites en parallèle avec les tâches 1-5
- Tâche 9 dépend de toutes les autres tâches

## Estimation

Complexité : Faible à Moyenne
- Principalement du code de rendu SVG
- Calculs géométriques simples (trigonométrie)
- Intégration UI minime (une checkbox)
