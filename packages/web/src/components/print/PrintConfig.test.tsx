import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PrintConfig } from './PrintConfig';
import type { PrintConfig as PrintConfigType } from '@/hooks/usePrintLayout';
import { renderWithIntl } from '@/test/intlWrapper';

describe('PrintConfig', () => {
  const defaultConfig: PrintConfigType = {
    mode: 'full-wall',
    orientation: 'portrait',
    pagesInHeight: 4,
    overlap: 10,
  };

  const defaultProps = {
    config: defaultConfig,
    onChange: vi.fn(),
    onExport: vi.fn(),
    isExporting: false,
    totalPages: 8,
  };

  it('should render configuration title', () => {
    renderWithIntl(<PrintConfig {...defaultProps} />);
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });

  it('should render print mode buttons', () => {
    renderWithIntl(<PrintConfig {...defaultProps} />);
    expect(screen.getByText('Mur complet')).toBeInTheDocument();
    expect(screen.getByText('Couloir par couloir')).toBeInTheDocument();
  });

  it('should call onChange when mode changes to lane-by-lane', () => {
    const onChange = vi.fn();
    renderWithIntl(<PrintConfig {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByText('Couloir par couloir'));

    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, mode: 'lane-by-lane' });
  });

  it('should call onChange when mode changes to full-wall', () => {
    const onChange = vi.fn();
    renderWithIntl(
      <PrintConfig
        {...defaultProps}
        config={{ ...defaultConfig, mode: 'lane-by-lane' }}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('Mur complet'));

    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, mode: 'full-wall' });
  });

  it('should render orientation buttons', () => {
    renderWithIntl(<PrintConfig {...defaultProps} />);
    expect(screen.getByText('Portrait')).toBeInTheDocument();
    expect(screen.getByText('Paysage')).toBeInTheDocument();
  });

  it('should call onChange when orientation changes', () => {
    const onChange = vi.fn();
    renderWithIntl(<PrintConfig {...defaultProps} onChange={onChange} />);

    fireEvent.click(screen.getByText('Paysage'));

    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, orientation: 'landscape' });
  });

  it('should render pages in height controls', () => {
    renderWithIntl(<PrintConfig {...defaultProps} />);
    expect(screen.getByText('Nombre de pages en hauteur')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(4);
  });

  it('should increase pages in height when + button clicked', () => {
    const onChange = vi.fn();
    renderWithIntl(<PrintConfig {...defaultProps} onChange={onChange} />);

    // Find the + button (second button with those classes)
    const buttons = screen.getAllByRole('button');
    const plusButton = buttons.find(btn => btn.textContent === '+');
    fireEvent.click(plusButton!);

    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, pagesInHeight: 5 });
  });

  it('should decrease pages in height when - button clicked', () => {
    const onChange = vi.fn();
    renderWithIntl(<PrintConfig {...defaultProps} onChange={onChange} />);

    const buttons = screen.getAllByRole('button');
    const minusButton = buttons.find(btn => btn.textContent === '-');
    fireEvent.click(minusButton!);

    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, pagesInHeight: 3 });
  });

  it('should not go below 1 page in height', () => {
    const onChange = vi.fn();
    renderWithIntl(
      <PrintConfig
        {...defaultProps}
        config={{ ...defaultConfig, pagesInHeight: 1 }}
        onChange={onChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    const minusButton = buttons.find(btn => btn.textContent === '-');

    expect(minusButton).toBeDisabled();
  });

  it('should not go above 20 pages in height', () => {
    const onChange = vi.fn();
    renderWithIntl(
      <PrintConfig
        {...defaultProps}
        config={{ ...defaultConfig, pagesInHeight: 20 }}
        onChange={onChange}
      />
    );

    const buttons = screen.getAllByRole('button');
    const plusButton = buttons.find(btn => btn.textContent === '+');

    expect(plusButton).toBeDisabled();
  });

  it('should update pages in height from input', () => {
    const onChange = vi.fn();
    renderWithIntl(<PrintConfig {...defaultProps} onChange={onChange} />);

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '6' } });

    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, pagesInHeight: 6 });
  });

  it('should render overlap slider', () => {
    renderWithIntl(<PrintConfig {...defaultProps} />);
    expect(screen.getByText('Chevauchement (cm)')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveValue('10');
  });

  it('should call onChange when overlap changes', () => {
    const onChange = vi.fn();
    renderWithIntl(<PrintConfig {...defaultProps} onChange={onChange} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '100' } });

    expect(onChange).toHaveBeenCalledWith({ ...defaultConfig, overlap: 100 });
  });

  it('should display total pages', () => {
    renderWithIntl(<PrintConfig {...defaultProps} totalPages={8} />);
    expect(screen.getByText('Total : 8 pages')).toBeInTheDocument();
  });

  it('should display singular page when only one', () => {
    renderWithIntl(<PrintConfig {...defaultProps} totalPages={1} />);
    expect(screen.getByText('Total : 1 page')).toBeInTheDocument();
  });

  it('should render export button', () => {
    renderWithIntl(<PrintConfig {...defaultProps} />);
    expect(screen.getByText('Exporter PDF')).toBeInTheDocument();
  });

  it('should call onExport when export button clicked', () => {
    const onExport = vi.fn();
    renderWithIntl(<PrintConfig {...defaultProps} onExport={onExport} />);

    fireEvent.click(screen.getByText('Exporter PDF'));

    expect(onExport).toHaveBeenCalled();
  });

  it('should disable export button when exporting', () => {
    const { container } = renderWithIntl(<PrintConfig {...defaultProps} isExporting={true} />);

    // When exporting, button shows spinner - find button by class
    const exportButton = container.querySelector('button.btn-primary.w-full');
    expect(exportButton).toBeDisabled();
  });

  it('should disable export button when no pages', () => {
    renderWithIntl(<PrintConfig {...defaultProps} totalPages={0} />);

    const exportButton = screen.getByText('Exporter PDF');
    expect(exportButton).toBeDisabled();
  });

  it('should show loading spinner when exporting', () => {
    const { container } = renderWithIntl(<PrintConfig {...defaultProps} isExporting={true} />);

    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('should show export progress when available', () => {
    renderWithIntl(
      <PrintConfig
        {...defaultProps}
        isExporting={true}
        exportProgress={{ current: 3, total: 8 }}
      />
    );

    expect(screen.getByText('Export 3/8')).toBeInTheDocument();
  });
});
