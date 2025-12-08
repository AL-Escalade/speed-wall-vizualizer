## Context

L'application "Configurateur de couloirs d'escalade de vitesse" est actuellement desktop-only. Pour permettre une utilisation sur mobile (téléphones, tablettes), il faut adapter la mise en page et les interactions.

**Contraintes:**
- Maintenir la compatibilité desktop existante
- Utiliser les composants DaisyUI existants
- Pas de framework CSS supplémentaire
- Support des gestes tactiles natifs

## Goals / Non-Goals

**Goals:**
- Interface mobile-first pour écrans < 768px
- Navigation fluide entre configuration et visualisation
- Gestes tactiles pour le viewer (zoom/pan)
- Header compact avec menu déroulant

**Non-Goals:**
- Application native (PWA reste une option future)
- Mode offline
- Responsive pour tablettes intermédiaires (768-1024px) - restera desktop-like

## Decisions

### Navigation par onglets vs Drawer

**Decision:** Navigation par onglets en bas de l'écran (tab bar)

**Rationale:**
- Plus naturel sur mobile (pattern iOS/Android standard)
- Permet de voir clairement dans quelle vue on se trouve
- Pas de geste qui pourrait interférer avec le viewer

**Alternatives considérées:**
- Drawer latéral: Conflit potentiel avec le pan du viewer
- Bottom sheet: Complexité supplémentaire pour une utilisation complète

### Breakpoint mobile

**Decision:** `max-width: 767px` pour le mode mobile

**Rationale:**
- Aligné avec Tailwind `md:` breakpoint (768px)
- Couvre la majorité des téléphones
- Simple à implémenter avec `useMediaQuery`

### Gestes tactiles

**Decision:** Utiliser les événements tactiles natifs avec RAF throttling

**Rationale:**
- Le viewer utilise déjà RAF pour mouse events
- Pas besoin de bibliothèque externe (hammer.js, etc.)
- Pinch-to-zoom et pan à deux doigts sont suffisants

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Performance sur vieux appareils | Utiliser `will-change` avec parcimonie, RAF throttling |
| Conflit gestes viewer/scroll | Deux doigts = pan viewer, un doigt = scroll page si hors viewer |
| UX du menu dropdown | Tester les actions les plus fréquentes en priorité |

## Migration Plan

1. Ajouter le hook `useMediaQuery` et `useTouchGestures`
2. Créer le composant `MobileNav` avec les onglets
3. Modifier `App.tsx` pour le layout conditionnel
4. Adapter `Header.tsx` avec menu dropdown
5. Ajouter les gestes tactiles au `Viewer.tsx`
6. Tester sur différents appareils

**Rollback:** Les modifications sont conditionnelles au breakpoint, le desktop reste inchangé.

## Open Questions

- Faut-il un indicateur visuel pour montrer qu'on peut zoomer avec deux doigts ?
- Le bouton "Imprimer" a-t-il du sens sur mobile ?
