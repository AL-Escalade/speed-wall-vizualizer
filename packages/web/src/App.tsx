import { useEffect, useMemo } from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary, Header, Sidebar, Viewer } from '@/components';
import { MobileNav } from '@/components/MobileNav';
import { SharedConfigLoader } from '@/components/layouts/SharedConfigLoader';
import { PrintPage } from '@/pages';
import { useConfigStore } from '@/store';
import { ROUTES } from '@/utils/routes';
import { useUrlSync } from '@/hooks/useUrlSync';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useMobileTab } from '@/hooks/useMobileTab';
import { resolveLocale, getMessages } from '@/i18n';

function DesktopLayout() {
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

function MobileLayout() {
  const activeTab = useMobileTab((s) => s.activeTab);

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 relative min-h-0 pb-14 overflow-hidden">
        {/* Sidebar visible only on config tab */}
        <div className={`absolute inset-x-0 top-0 bottom-14 overflow-y-auto ${activeTab === 'config' ? '' : 'hidden'}`}>
          <Sidebar />
        </div>
        {/* Viewer always rendered for SVG export, positioned offscreen on config tab */}
        <div className={`absolute inset-x-0 top-0 bottom-14 flex ${activeTab === 'viewer' ? '' : 'pointer-events-none -translate-x-full'}`}>
          <Viewer />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}

function MainView() {
  // Keep URL in sync with current configuration
  useUrlSync();
  const isMobile = useIsMobile();

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}

function App() {
  const deduplicateConfigurations = useConfigStore((s) => s.deduplicateConfigurations);
  const language = useConfigStore((s) => {
    const config = s.configurations.find((c) => c.id === s.activeConfigId);
    return config?.language ?? 'auto';
  });

  // Run deduplication once on mount to clean up any existing duplicates
  useEffect(() => {
    deduplicateConfigurations();
  }, [deduplicateConfigurations]);

  // Resolve effective locale from language setting
  const locale = useMemo(() => resolveLocale(language), [language]);
  const messages = useMemo(() => getMessages(locale), [locale]);

  return (
    <IntlProvider locale={locale} messages={messages} defaultLocale="fr">
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path={ROUTES.HOME} element={<MainView />} />
            <Route path={ROUTES.PRINT} element={<PrintPage />} />
            <Route path={ROUTES.SHARE_PATTERN} element={<SharedConfigLoader />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </IntlProvider>
  );
}

export default App;
