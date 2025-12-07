# Change: Amélioration UX de l'application web

## Why

L'expérience utilisateur initiale est frustrante : l'utilisateur arrive sur une page vide et doit comprendre qu'il faut créer une configuration. De plus, la terminologie anglaise ("Lanes", "Mur") n'est pas adaptée à une application en français. Enfin, les indices numériques pour les prises ne sont pas parlants pour l'utilisateur.

## What Changes

- Renommer l'application "Voie Vitesse" → "Configurateur de couloirs d'escalade de vitesse"
- Configuration par défaut créée automatiquement au premier chargement
- Configuration par défaut avec la voie IFSC sur les 2 couloirs
- Possibilité de renommer une configuration
- Terminologie française :
  - "Mur" → "Dimensions du mur"
  - "Lanes" → "Largeur (couloirs)"
  - "Panneaux" → "Hauteur (panneaux)"
  - "Du" → "Prise de départ"
  - "Au" → "Prise d'arrivée"
  - "Exporter JSON" → "Télécharger la configuration"
  - "Importer JSON" → "Importer la configuration"
- Sélection début/fin de section par labels de prises (ex: "M1", "P2") au lieu d'index numériques
- Vue d'ensemble (ex-Birdview) :
  - Renommer "Birdview" → "Vue d'ensemble"
  - Navigation par drag & drop (pas seulement clic)
  - Correction du zoom pour afficher tout le mur
- Viewer : conserver le zoom/pan quand la configuration change (ne pas reset à chaque modification)
- Section : quand on change de voie source, sélectionner automatiquement la première et dernière prise
- Section : permettre de spécifier une position d'ancrage personnalisée pour la prise de départ (panneau, colonne, ligne)
- Renommer la voie "Training" en "Combinaison voie U15 et IFSC"
- Header : ajouter des marges entre les boutons
- Utiliser une bibliothèque d'icônes (react-icons ou lucide-react) pour des icônes plus esthétiques
- Zoom controls : agrandir les icônes (+, -, Home)

## Impact

- Affected specs: web-app
- Affected code: `web/src/store/configStore.ts`, `web/src/components/Sidebar.tsx`, `web/src/components/Birdview.tsx`, `web/src/components/Viewer.tsx`, `web/src/components/Header.tsx`, `web/src/store/routesStore.ts`
- New dependency: bibliothèque d'icônes (react-icons ou lucide-react)
