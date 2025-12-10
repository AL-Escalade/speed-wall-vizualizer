import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { ErrorBoundary, Header, Sidebar, Viewer } from '@/components';
import { MobileNav } from '@/components/MobileNav';
import { PrintPage } from '@/pages';
import { useConfigStore } from '@/store';
import { decodeConfig, hydrateShareableConfig } from '@/utils/urlConfig';
import { ROUTES } from '@/utils/routes';
import { useUrlSync } from '@/hooks/useUrlSync';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useMobileTab } from '@/hooks/useMobileTab';

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

function MainView() {
  // Keep URL in sync with current configuration
  useUrlSync();
  const isMobile = useIsMobile();

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}

/**
 * Component that loads a shared configuration from URL
 */
function SharedConfigLoader() {
  const { encoded } = useParams<{ encoded: string }>();
  const navigate = useNavigate();
  const importConfiguration = useConfigStore((s) => s.importConfiguration);
  const [error, setError] = useState<string | null>(null);
  const hasImportedRef = useRef(false);

  useEffect(() => {
    // Prevent double import on rapid navigation
    if (hasImportedRef.current) return;

    if (!encoded) {
      navigate(ROUTES.HOME, { replace: true });
      return;
    }

    const config = decodeConfig(encoded);
    if (!config) {
      setError('Le lien de partage est invalide ou corrompu.');
      return;
    }

    // Mark as imported to prevent race conditions
    hasImportedRef.current = true;

    importConfiguration(hydrateShareableConfig(config));
    navigate(ROUTES.HOME, { replace: true });
  }, [encoded, navigate, importConfiguration]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate(ROUTES.HOME, { replace: true })}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.HOME} element={<MainView />} />
          <Route path={ROUTES.PRINT} element={<PrintPage />} />
          <Route path={ROUTES.SHARE_PATTERN} element={<SharedConfigLoader />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
