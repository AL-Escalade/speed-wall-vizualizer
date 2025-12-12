/**
 * Mobile layout component
 * Renders header with tab-based content switching
 */

import { Header, Sidebar, Viewer } from '@/components';
import { MobileNav } from '@/components/MobileNav';
import { useMobileTab } from '@/hooks/useMobileTab';

export function MobileLayout() {
  const activeTab = useMobileTab((s) => s.activeTab);

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative min-h-0 pb-14 overflow-hidden">
        {/* Sidebar visible only on config tab */}
        <div className={`absolute inset-0 overflow-y-auto ${activeTab === 'config' ? '' : 'hidden'}`}>
          <Sidebar />
        </div>
        {/* Viewer always rendered for SVG export, positioned offscreen on config tab */}
        <div className={`absolute inset-0 flex ${activeTab === 'viewer' ? '' : 'pointer-events-none -translate-x-full'}`}>
          <Viewer />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
