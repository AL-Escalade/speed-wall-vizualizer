# Tasks: Impression multi-pages

## Implementation Tasks

### 1. Setup: Ajouter la dépendance PDF
- [x] Ajouter `jspdf` au package.json du workspace web
- [x] Vérifier la compatibilité avec le build Vite
- **Validation** : `npm run build:web` passe sans erreur

### 2. Core: Créer le hook usePrintLayout
- [x] Créer `web/src/hooks/usePrintLayout.ts`
- [x] Implémenter le calcul des dimensions A4 (portrait/paysage) avec marges
- [x] Implémenter le calcul de l'échelle à partir du nombre de pages en hauteur
- [x] Implémenter le calcul du nombre de pages en largeur
- [x] Implémenter le calcul des coordonnées de découpe pour chaque page
- [x] Gérer le chevauchement configurable
- **Validation** : Tests unitaires pour les calculs de layout

### 3. Core: Créer le générateur PDF
- [x] Créer `web/src/utils/pdfGenerator.ts`
- [x] Implémenter la fonction de rasterisation SVG vers canvas
- [x] Implémenter la génération PDF multi-pages avec jsPDF
- [x] Ajouter les métadonnées par page (nom config, date)
- [x] Gérer les marges d'impression
- **Validation** : Export PDF fonctionnel avec contenu visible

### 4. UI: Créer le composant PrintConfig
- [x] Créer `web/src/components/print/PrintConfig.tsx`
- [x] Ajouter le sélecteur de mode (mur complet / couloir par couloir)
- [x] Ajouter le sélecteur d'orientation (portrait / paysage)
- [x] Ajouter l'input nombre de pages en hauteur
- [x] Ajouter l'input zone de chevauchement (mm)
- [x] Ajouter le bouton "Exporter PDF"
- **Validation** : Les contrôles sont fonctionnels et mettent à jour l'état

### 5. UI: Créer le composant PageGrid
- [x] Créer `web/src/components/print/PageGrid.tsx`
- [x] Afficher une grille de miniatures des pages
- [x] Montrer visuellement le découpage sur le SVG
- [x] Permettre la sélection d'une page au clic
- [x] Mettre en évidence la page sélectionnée
- **Validation** : La grille reflète le layout calculé

### 6. UI: Créer le composant PageDetail
- [x] Créer `web/src/components/print/PageDetail.tsx`
- [x] Afficher la page sélectionnée en grand
- [x] Montrer le contenu exact qui sera imprimé
- [x] Afficher les métadonnées (nom config, date)
- **Validation** : Le détail correspond à ce qui sera exporté

### 7. UI: Créer la page PrintPage
- [x] Créer `web/src/pages/PrintPage.tsx`
- [x] Intégrer PrintConfig, PageGrid et PageDetail
- [x] Gérer l'état local de configuration
- [x] Connecter au store pour récupérer la config et le SVG
- [x] Ajouter un bouton retour vers la vue principale
- **Validation** : La page affiche correctement tous les composants

### 8. Navigation: Ajouter le routing
- [x] Installer react-router-dom si nécessaire
- [x] Configurer les routes (`/` et `/print`)
- [x] Ajouter le bouton "Imprimer" dans le Header
- [x] Implémenter la navigation entre les pages
- **Validation** : Navigation fluide entre vue principale et page impression

### 9. Feature: Implémenter le mode mur complet
- [x] Calculer le layout pour le SVG complet du mur
- [x] Générer la prévisualisation grille
- [x] Générer le PDF avec toutes les pages
- **Validation** : Export PDF du mur complet sur plusieurs pages

### 10. Feature: Implémenter le mode couloir par couloir
- [x] Calculer les limites de chaque couloir (SNx + DXx)
- [x] Générer le layout pour chaque couloir
- [x] Générer la prévisualisation avec séparation par couloir
- [x] Générer le PDF avec tous les couloirs séquentiellement
- **Validation** : Export PDF couloir par couloir

### 11. Polish: Finalisation
- [x] Ajouter des états de chargement pendant la génération PDF
- [x] Gérer les erreurs (pas de config, SVG vide, etc.)
- [ ] Tester sur différentes configurations de mur
- [ ] Vérifier l'impression réelle sur papier A4
- **Validation** : Tests manuels complets

## Dependencies

- Tâche 2 peut commencer immédiatement
- Tâches 3-6 dépendent de la tâche 2
- Tâche 7 dépend des tâches 4, 5, 6
- Tâche 8 peut être faite en parallèle avec 2-7
- Tâches 9-10 dépendent de 7 et 8
- Tâche 11 dépend de toutes les autres

## Estimation

Complexité : Moyenne à Élevée
- Calculs géométriques pour le découpage
- Intégration librairie PDF
- Rasterisation SVG
- Nouvelle page avec routing
