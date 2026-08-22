import { useEffect, useMemo } from 'react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components';
import { MainLayout } from '@/components/layouts/MainLayout';
import { SharedConfigLoader } from '@/components/layouts/SharedConfigLoader';
import { PrintPage } from '@/pages';
import { useConfigStore } from '@/store';
import { ROUTES } from '@/utils/routes';
import { resolveLocale, getMessages } from '@/i18n';

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
            <Route path={ROUTES.HOME} element={<MainLayout />} />
            <Route path={ROUTES.PRINT} element={<PrintPage />} />
            <Route path={ROUTES.SHARE_PATTERN} element={<SharedConfigLoader />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </IntlProvider>
  );
}

export default App;
