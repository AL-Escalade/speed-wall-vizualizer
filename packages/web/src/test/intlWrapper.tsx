import { IntlProvider } from 'react-intl';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import messages from '@/i18n/fr.json';
import { getMessages, type SupportedLocale } from '@/i18n';

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

/**
 * Render under an explicit locale, for behaviour that depends on the interface
 * language rather than on a translated string.
 */
export function renderWithLocale(
  ui: ReactElement,
  locale: SupportedLocale,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function LocaleWrapper({ children }: { children: React.ReactNode }) {
    return (
      <IntlProvider locale={locale} messages={getMessages(locale)} defaultLocale="fr">
        {children}
      </IntlProvider>
    );
  }

  return render(ui, { wrapper: LocaleWrapper, ...options });
}
