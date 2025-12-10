## 1. Foundation

- [x] 1.1 Create `useMediaQuery` hook in `web/src/hooks/useMediaQuery.ts`
- [x] 1.2 Create `useTouchGestures` hook in `web/src/hooks/useTouchGestures.ts`
- [x] 1.3 Add mobile viewport meta tag if missing in `web/index.html`

## 2. Mobile Navigation

- [x] 2.1 Create `MobileNav` component with bottom tab bar (`web/src/components/MobileNav.tsx`)
- [x] 2.2 Add tab state management (active tab: 'config' | 'viewer') - `web/src/hooks/useMobileTab.ts`
- [x] 2.3 Update `App.tsx` with conditional layout based on screen size
- [x] 2.4 Test tab switching preserves configuration state

## 3. Header Adaptation

- [x] 3.1 Create dropdown menu component for mobile actions
- [x] 3.2 Update `Header.tsx` with responsive layout (title + menu on mobile)
- [x] 3.3 Move all action buttons into dropdown on mobile
- [x] 3.4 Add hamburger/menu icon button (MoreVertical)

## 4. Touch Gestures

- [x] 4.1 Implement pinch-to-zoom in `useTouchGestures` hook
- [x] 4.2 Implement two-finger pan in `useTouchGestures` hook
- [x] 4.3 Implement double-tap to reset zoom
- [x] 4.4 Integrate touch gestures into `Viewer.tsx`
- [x] 4.5 Ensure single-finger touch does not interfere with page scroll (touch-none class)

## 5. Configuration View

- [x] 5.1 Update `Sidebar.tsx` to be full-screen on mobile (remove fixed width)
- [x] 5.2 Adjust form inputs for touch (larger touch targets)
- [x] 5.3 Make section cards full-width on mobile
- [x] 5.4 Ensure proper scroll behavior within configuration view

## 6. Viewer Adjustments

- [x] 6.1 Update `Birdview` to hide on very small screens (< 400px)
- [x] 6.2 Ensure zoom controls are accessible on mobile (responsive positioning)
- [x] 6.3 Add visual hint for pinch-to-zoom (contextual messages on empty state)

## 7. Testing & Polish

- [x] 7.1 Build verification passes
- [x] 7.2 Desktop functionality preserved (conditional rendering)
- [x] 7.3 Mobile layout with tab navigation implemented
- [x] 7.4 Touch gestures integrated
- [x] 7.5 Responsive header with dropdown menu
