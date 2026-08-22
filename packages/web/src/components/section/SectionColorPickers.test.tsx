import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SectionColorPickers } from './SectionColorPickers';
import { renderWithIntl } from '@/test/intlWrapper';

const noop = () => {};

describe('SectionColorPickers', () => {
  it('should render a single unnamed picker for a single-color route', () => {
    const { container } = renderWithIntl(
      <SectionColorPickers
        tags={['DEFAULT']}
        values={{ DEFAULT: '#FF0000' }}
        isCustomized={false}
        onChange={noop}
        onReset={noop}
      />
    );

    expect(container.querySelectorAll('input[type="color"]')).toHaveLength(1);
    // Same generic caption as before multi-color routes existed
    expect(screen.getByText('Couleur')).toBeInTheDocument();
  });

  it('should render one named picker per tag of a multi-color route', () => {
    const { container } = renderWithIntl(
      <SectionColorPickers
        tags={['RED', 'DARKGREEN']}
        values={{ RED: '#FF0000', DARKGREEN: '#006400' }}
        isCustomized={false}
        onChange={noop}
        onReset={noop}
      />
    );

    expect(container.querySelectorAll('input[type="color"]')).toHaveLength(2);
    expect(screen.getByText('Prises IFSC')).toBeInTheDocument();
    expect(screen.getByText('Prises ajoutées')).toBeInTheDocument();
  });

  it('should fall back to the raw tag when no translation exists', () => {
    renderWithIntl(
      <SectionColorPickers
        tags={['RED', 'PURPLE']}
        values={{ RED: '#FF0000', PURPLE: '#800080' }}
        isCustomized={false}
        onChange={noop}
        onReset={noop}
      />
    );

    expect(screen.getByText('PURPLE')).toBeInTheDocument();
  });

  it('should report which tag changed', () => {
    const handleChange = vi.fn();
    const { container } = renderWithIntl(
      <SectionColorPickers
        tags={['RED', 'DARKGREEN']}
        values={{ RED: '#FF0000', DARKGREEN: '#006400' }}
        isCustomized={false}
        onChange={handleChange}
        onReset={noop}
      />
    );

    const inputs = container.querySelectorAll('input[type="color"]');
    fireEvent.input(inputs[1], { target: { value: '#123456' } });

    expect(handleChange).toHaveBeenCalledWith('DARKGREEN', '#123456');
  });

  it('should only offer a reset once the section is customized', () => {
    const handleReset = vi.fn();
    const { rerender } = renderWithIntl(
      <SectionColorPickers
        tags={['RED']}
        values={{ RED: '#FF0000' }}
        isCustomized={false}
        onChange={noop}
        onReset={handleReset}
      />
    );

    expect(screen.queryByText('Réinitialiser les couleurs')).not.toBeInTheDocument();

    rerender(
      <SectionColorPickers
        tags={['RED']}
        values={{ RED: '#123456' }}
        isCustomized
        onChange={noop}
        onReset={handleReset}
      />
    );

    fireEvent.click(screen.getByText('Réinitialiser les couleurs'));
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
