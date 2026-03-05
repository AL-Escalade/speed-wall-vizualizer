import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ExcludeHoldsSelector } from './ExcludeHoldsSelector';
import { renderWithIntl } from '@/test/intlWrapper';

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
