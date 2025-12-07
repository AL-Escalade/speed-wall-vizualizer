## 1. Renommage de l'application

- [x] 1.1 Header : "Voie Vitesse" → "Configurateur de couloirs d'escalade de vitesse"

## 2. Configuration par défaut

- [x] 2.1 Créer une configuration par défaut au premier chargement (si aucune n'existe)
- [x] 2.2 Ajouter la voie IFSC sur les 2 couloirs par défaut
- [x] 2.3 Permettre de renommer une configuration (champ éditable)

## 3. Terminologie française

- [x] 3.1 Sidebar : "Mur" → "Dimensions du mur"
- [x] 3.2 Sidebar : "Lanes" → "Largeur (couloirs)"
- [x] 3.3 Sidebar : "Panneaux" → "Hauteur (panneaux)"
- [x] 3.4 Sidebar : "Du" → "Prise de départ"
- [x] 3.5 Sidebar : "Au" → "Prise d'arrivée"
- [x] 3.6 Header : "Exporter JSON" → "Télécharger la configuration"
- [x] 3.7 Header : "Importer JSON" → "Importer la configuration"
- [x] 3.8 Routes : "Training" → "Combinaison voie U15 et IFSC"

## 4. Sélection des prises par labels

- [x] 4.1 Remplacer les inputs numériques par des selects avec labels de prises
- [x] 4.2 Afficher les labels (M1, P2, etc.) au lieu des indices
- [x] 4.3 Auto-sélectionner première/dernière prise lors du changement de voie source
- [x] 4.4 Ajouter un champ optionnel pour spécifier la position d'ancrage (panneau, colonne, ligne)

## 5. Vue d'ensemble (Birdview)

- [x] 5.1 Renommer "Birdview" → "Vue d'ensemble"
- [x] 5.2 Corriger le zoom pour afficher tout le mur
- [x] 5.3 Implémenter le drag & drop pour naviguer (au lieu du clic simple)

## 6. Viewer

- [x] 6.1 Ne pas reset le zoom/pan lors des modifications de configuration
- [x] 6.2 Installer une bibliothèque d'icônes (lucide-react recommandé avec Tailwind)
- [x] 6.3 Remplacer les caractères par des icônes (ZoomIn, ZoomOut, Home, etc.)

## 7. Header

- [x] 7.1 Ajouter des marges entre les boutons
