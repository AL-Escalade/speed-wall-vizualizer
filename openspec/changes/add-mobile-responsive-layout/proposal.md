# Change: Add Mobile Responsive Layout

## Why

L'application web actuelle est conçue uniquement pour desktop avec une sidebar fixe de 320px. Les utilisateurs mobiles ne peuvent pas utiliser l'application de manière confortable car la mise en page ne s'adapte pas aux petits écrans.

## What Changes

- Ajout d'un système de navigation par onglets sur mobile (< 768px)
- L'interface bascule entre une vue "Configuration" et une vue "Mur"
- Le header s'adapte avec un menu déroulant pour les actions sur mobile
- Le viewer supporte les gestes tactiles (pinch-to-zoom, pan à deux doigts)
- Le footer mobile affiche les onglets de navigation

## Impact

- Affected specs: `web-app`
- Affected code:
  - `web/src/App.tsx` - Layout principal avec système d'onglets
  - `web/src/components/Header.tsx` - Header responsive avec menu mobile
  - `web/src/components/Sidebar.tsx` - Devient vue pleine page sur mobile
  - `web/src/components/Viewer.tsx` - Ajout gestes tactiles
  - Nouveau: `web/src/components/MobileNav.tsx` - Navigation par onglets
  - Nouveau: `web/src/hooks/useMediaQuery.ts` - Détection responsive
