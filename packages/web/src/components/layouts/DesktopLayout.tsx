/**
 * Desktop layout component
 * Renders header, sidebar and viewer in a horizontal split
 */

import { Header, Sidebar, Viewer } from '@/components';

export function DesktopLayout() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <Viewer />
      </div>
    </div>
  );
}
