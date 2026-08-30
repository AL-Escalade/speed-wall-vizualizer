import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import type { ReactElement } from 'react';
import { ExcludeHoldsSelector } from './ExcludeHoldsSelector';
import { renderWithIntl } from '@/test/intlWrapper';
import enMessages from '@/i18n/en.json';

describe('ExcludeHoldsSelector', () => {
  const holdLabels = ['M1', 'M2', 'M3', 'M4', 'M5'];

  it('should render with label', () => {
    renderWithIntl(
      <ExcludeHoldsSelector holdLabels={holdLabels} excludeHolds={[]} onChange={() => {}} />
    );

    expect(screen.getByText('Prises exclues')).toBeInTheDocument();
  });

  it('should show placeholder when no holds excluded', () => {
    renderWithIntl(
      <ExcludeHoldsSelector holdLabels={holdLabels} excludeHolds={[]} onChange={() => {}} />
    );

    expect(screen.getByText('Aucune')).toBeInTheDocument();
  });

  it('should show excluded hold labels in summary', () => {
    renderWithIntl(
      <ExcludeHoldsSelector holdLabels={holdLabels} excludeHolds={['M2', 'M4']} onChange={() => {}} />
    );

    expect(screen.getByText('M2, M4')).toBeInTheDocument();
  });

  it('should show checkboxes when opened', () => {
    renderWithIntl(
      <ExcludeHoldsSelector holdLabels={holdLabels} excludeHolds={[]} onChange={() => {}} />
    );

    fireEvent.click(screen.getByRole('button'));

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(5);
  });

  it('should check excluded holds', () => {
    renderWithIntl(
      <ExcludeHoldsSelector holdLabels={holdLabels} excludeHolds={['M2']} onChange={() => {}} />
    );

    fireEvent.click(screen.getByRole('button'));

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked(); // M1
    expect(checkboxes[1]).toBeChecked(); // M2
    expect(checkboxes[2]).not.toBeChecked(); // M3
  });

  it('should call onChange with added hold when unchecked hold is clicked', () => {
    const handleChange = vi.fn();
    renderWithIntl(
      <ExcludeHoldsSelector holdLabels={holdLabels} excludeHolds={['M2']} onChange={handleChange} />
    );

    fireEvent.click(screen.getByRole('button'));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]); // Click M3

    expect(handleChange).toHaveBeenCalledWith(['M2', 'M3']);
  });

  it('should filter stale holds from summary', () => {
    renderWithIntl(
      <ExcludeHoldsSelector holdLabels={['M1', 'M2', 'M3']} excludeHolds={['M2', 'M99']} onChange={() => {}} />
    );

    // M99 is stale (not in holdLabels), only M2 should appear
    expect(screen.getByText('M2')).toBeInTheDocument();
    expect(screen.queryByText('M99')).not.toBeInTheDocument();
  });

  it('should not pass stale holds to onChange', () => {
    const handleChange = vi.fn();
    renderWithIntl(
      <ExcludeHoldsSelector holdLabels={['M1', 'M2', 'M3']} excludeHolds={['M2', 'M99']} onChange={handleChange} />
    );

    fireEvent.click(screen.getByRole('button'));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]); // Click M1 to add it

    // Should contain M2 and M1, but NOT M99
    expect(handleChange).toHaveBeenCalledWith(['M2', 'M1']);
  });

  it('should call onChange with removed hold when checked hold is clicked', () => {
    const handleChange = vi.fn();
    renderWithIntl(
      <ExcludeHoldsSelector holdLabels={holdLabels} excludeHolds={['M2', 'M4']} onChange={handleChange} />
    );

    fireEvent.click(screen.getByRole('button'));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Unclick M2

    expect(handleChange).toHaveBeenCalledWith(['M4']);
  });
});

/**
 * The raw label written in the route data is the identity persisted in
 * `excludeHolds` (localStorage, exported files, shared URLs). Only the text
 * shown to the user follows the interface language.
 */
describe('ExcludeHoldsSelector hold label translation', () => {
  const holdLabels = ['M1', 'M2', 'M3'];

  function renderInEnglish(ui: ReactElement) {
    return render(ui, {
      wrapper: ({ children }) => (
        <IntlProvider locale="en" messages={enMessages} defaultLocale="fr">
          {children}
        </IntlProvider>
      ),
    });
  }

  it('should display the English prefix while keeping the raw route label as the checkbox identity, so shared configurations stay compatible', () => {
    renderInEnglish(
      <ExcludeHoldsSelector holdLabels={holdLabels} excludeHolds={['M2']} onChange={() => {}} />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('H1')).toBeInTheDocument();
    expect(screen.getByText('H3')).toBeInTheDocument();
    // H2 shows both in the summary and in the checkbox list
    expect(screen.getAllByText('H2')).toHaveLength(2);
    expect(screen.queryByText('M1')).not.toBeInTheDocument();

    // State still keyed on the raw label
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[1]).toBeChecked();
  });

  it('should show the translated summary of excluded holds while storing the raw route labels, so shared configurations stay compatible', () => {
    const handleChange = vi.fn();
    renderInEnglish(
      <ExcludeHoldsSelector holdLabels={holdLabels} excludeHolds={['M2']} onChange={handleChange} />
    );

    expect(screen.getByText('H2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[2]); // displayed as H3, stored as M3

    expect(handleChange).toHaveBeenCalledWith(['M2', 'M3']);
  });
});
