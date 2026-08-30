import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import type { ReactElement } from 'react';
import { HoldRangeSelector } from './HoldRangeSelector';
import { renderWithIntl } from '@/test/intlWrapper';
import enMessages from '@/i18n/en.json';

const HOLD_LABELS = ['P1', 'M1', 'M2', 'M3', 'TOP'];

describe('HoldRangeSelector', () => {
  it('should render both from and to selectors', () => {
    renderWithIntl(
      <HoldRangeSelector
        fromHold="P1"
        toHold="TOP"
        holdLabels={HOLD_LABELS}
        onFromChange={() => {}}
        onToChange={() => {}}
      />
    );

    expect(screen.getByText('Première prise')).toBeInTheDocument();
    expect(screen.getByText('Dernière prise')).toBeInTheDocument();
  });

  it('should render all hold labels as options', () => {
    renderWithIntl(
      <HoldRangeSelector
        fromHold="P1"
        toHold="TOP"
        holdLabels={HOLD_LABELS}
        onFromChange={() => {}}
        onToChange={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);

    // Each select should have all hold labels as options
    const fromOptions = selects[0].querySelectorAll('option');
    const toOptions = selects[1].querySelectorAll('option');

    expect(fromOptions).toHaveLength(HOLD_LABELS.length);
    expect(toOptions).toHaveLength(HOLD_LABELS.length);
  });

  it('should have correct initial values selected', () => {
    renderWithIntl(
      <HoldRangeSelector
        fromHold="M1"
        toHold="M3"
        holdLabels={HOLD_LABELS}
        onFromChange={() => {}}
        onToChange={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects[0].value).toBe('M1');
    expect(selects[1].value).toBe('M3');
  });

  it('should call onFromChange when from hold changes', () => {
    const handleFromChange = vi.fn();
    renderWithIntl(
      <HoldRangeSelector
        fromHold="P1"
        toHold="TOP"
        holdLabels={HOLD_LABELS}
        onFromChange={handleFromChange}
        onToChange={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'M2' } });

    expect(handleFromChange).toHaveBeenCalledWith('M2');
    expect(handleFromChange).toHaveBeenCalledTimes(1);
  });

  it('should call onToChange when to hold changes', () => {
    const handleToChange = vi.fn();
    renderWithIntl(
      <HoldRangeSelector
        fromHold="P1"
        toHold="TOP"
        holdLabels={HOLD_LABELS}
        onFromChange={() => {}}
        onToChange={handleToChange}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'M3' } });

    expect(handleToChange).toHaveBeenCalledWith('M3');
    expect(handleToChange).toHaveBeenCalledTimes(1);
  });

  it('should handle numeric hold values', () => {
    renderWithIntl(
      <HoldRangeSelector
        fromHold={1}
        toHold={5}
        holdLabels={['1', '2', '3', '4', '5']}
        onFromChange={() => {}}
        onToChange={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    // Numeric values are converted to strings
    expect(selects[0].value).toBe('1');
    expect(selects[1].value).toBe('5');
  });

  it('should render with empty hold labels', () => {
    renderWithIntl(
      <HoldRangeSelector
        fromHold=""
        toHold=""
        holdLabels={[]}
        onFromChange={() => {}}
        onToChange={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox');
    expect(selects[0].querySelectorAll('option')).toHaveLength(0);
    expect(selects[1].querySelectorAll('option')).toHaveLength(0);
  });
});

/**
 * The raw label written in the route data is the identity used by stored
 * configurations (localStorage, exported files, shared URLs). Only the text
 * shown to the user follows the interface language.
 */
describe('HoldRangeSelector hold label translation', () => {
  function renderInEnglish(ui: ReactElement) {
    return render(ui, {
      wrapper: ({ children }) => (
        <IntlProvider locale="en" messages={enMessages} defaultLocale="fr">
          {children}
        </IntlProvider>
      ),
    });
  }

  it('should display the English prefix while keeping the raw route label as the option value, so shared configurations stay compatible', () => {
    renderInEnglish(
      <HoldRangeSelector
        fromHold="M1"
        toHold="M3"
        holdLabels={['M1', 'M2', 'M3']}
        onFromChange={() => {}}
        onToChange={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const fromOptions = Array.from(selects[0].querySelectorAll('option'));

    expect(fromOptions.map((o) => o.textContent)).toEqual(['H1', 'H2', 'H3']);
    expect(fromOptions.map((o) => o.value)).toEqual(['M1', 'M2', 'M3']);
    // The selected value is still the raw label stored in the configuration
    expect(selects[0].value).toBe('M1');
    expect(selects[1].value).toBe('M3');
  });

  it('should report the raw route label to onChange even when a translated label is displayed, so shared configurations stay compatible', () => {
    const handleFromChange = vi.fn();
    renderInEnglish(
      <HoldRangeSelector
        fromHold="M1"
        toHold="M3"
        holdLabels={['M1', 'M2', 'M3']}
        onFromChange={handleFromChange}
        onToChange={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'M2' } });

    expect(handleFromChange).toHaveBeenCalledWith('M2');
  });
});
