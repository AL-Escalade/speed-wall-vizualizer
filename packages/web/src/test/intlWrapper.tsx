import { IntlProvider } from 'react-intl';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import messages from '@/i18n/fr.json';

function IntlWrapper({ children }: { children: React.ReactNode }) {
  return (
    <IntlProvider locale="fr" messages={messages} defaultLocale="fr">
      {children}
    </IntlProvider>
  );
}

export function renderWithIntl(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: IntlWrapper, ...options });
}
