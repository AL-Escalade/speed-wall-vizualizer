/**
 * Main layout component
 * Selects between desktop and mobile layout based on screen size
 * Keeps URL in sync with current configuration
 */

import { useUrlSync } from '@/hooks/useUrlSync';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';

export function MainLayout() {
  // Keep URL in sync with current configuration
  useUrlSync();
  const isMobile = useIsMobile();

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
