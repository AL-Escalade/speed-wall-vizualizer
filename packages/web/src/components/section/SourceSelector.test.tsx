import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SourceSelector } from './SourceSelector';
import { ROUTE_DISPLAY_NAMES } from '@/constants/routes';
import { renderWithIntl } from '@/test/intlWrapper';

const ROUTE_NAMES = ['ifsc', 'u15', 'training'];

describe('SourceSelector', () => {
  it('should render with the label "Voie source"', () => {
    renderWithIntl(
      <SourceSelector
        value="ifsc"
        routeNames={ROUTE_NAMES}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Voie source')).toBeInTheDocument();
  });

  it('should render all route names as options', () => {
    renderWithIntl(
      <SourceSelector
        value="ifsc"
        routeNames={ROUTE_NAMES}
        onChange={() => {}}
      />
    );

    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');

    expect(options).toHaveLength(ROUTE_NAMES.length);
  });

  it('should display route display names from ROUTE_DISPLAY_NAMES', () => {
    renderWithIntl(
      <SourceSelector
        value="ifsc"
        routeNames={ROUTE_NAMES}
        onChange={() => {}}
      />
    );

    // Check that display names are shown instead of raw route names
    expect(screen.getByText(ROUTE_DISPLAY_NAMES['ifsc'])).toBeInTheDocument();
    expect(screen.getByText(ROUTE_DISPLAY_NAMES['u15'])).toBeInTheDocument();
    expect(screen.getByText(ROUTE_DISPLAY_NAMES['training'])).toBeInTheDocument();
  });

  it('should have correct value selected', () => {
    renderWithIntl(
      <SourceSelector
        value="u15"
        routeNames={ROUTE_NAMES}
        onChange={() => {}}
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('u15');
  });

  it('should call onChange when selection changes', () => {
    const handleChange = vi.fn();
    renderWithIntl(
      <SourceSelector
        value="ifsc"
        routeNames={ROUTE_NAMES}
        onChange={handleChange}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'training' } });

    expect(handleChange).toHaveBeenCalledWith('training');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should fallback to uppercase name if no display name exists', () => {
    renderWithIntl(
      <SourceSelector
        value="custom"
        routeNames={['custom']}
        onChange={() => {}}
      />
    );

    // Should display 'CUSTOM' (uppercase) since no display name exists
    expect(screen.getByText('CUSTOM')).toBeInTheDocument();
  });

  it('should use route name as option value', () => {
    renderWithIntl(
      <SourceSelector
        value="ifsc"
        routeNames={ROUTE_NAMES}
        onChange={() => {}}
      />
    );

    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');

    expect(options[0]).toHaveValue('ifsc');
    expect(options[1]).toHaveValue('u15');
    expect(options[2]).toHaveValue('training');
  });
});
