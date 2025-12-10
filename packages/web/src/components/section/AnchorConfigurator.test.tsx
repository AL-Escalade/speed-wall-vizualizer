import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnchorConfigurator } from './AnchorConfigurator';
import type { AnchorPosition } from './types';

const DEFAULT_ANCHOR: AnchorPosition = {
  side: 'SN',
  column: 'A',
  row: 1,
};

describe('AnchorConfigurator', () => {
  it('should render all three selectors (side, column, row)', () => {
    render(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />
    );

    expect(screen.getByText('Côté')).toBeInTheDocument();
    expect(screen.getByText('Colonne')).toBeInTheDocument();
    expect(screen.getByText('Ligne')).toBeInTheDocument();
  });

  it('should render the header label', () => {
    render(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />
    );

    expect(screen.getByText('Position de la première prise')).toBeInTheDocument();
  });

  it('should render reset button', () => {
    render(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />
    );

    expect(screen.getByText('Réinitialiser')).toBeInTheDocument();
  });

  it('should use defaultAnchor values when anchor is undefined', () => {
    render(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects[0].value).toBe('SN'); // side
    expect(selects[1].value).toBe('A'); // column
    expect(selects[2].value).toBe('1'); // row
  });

  it('should use anchor values when provided', () => {
    const customAnchor: AnchorPosition = {
      side: 'DX',
      column: 'F',
      row: 5,
    };

    render(
      <AnchorConfigurator
        anchor={customAnchor}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    expect(selects[0].value).toBe('DX'); // side
    expect(selects[1].value).toBe('F'); // column
    expect(selects[2].value).toBe('5'); // row
  });

  it('should call onUpdate when side changes', () => {
    const handleUpdate = vi.fn();
    render(
      <AnchorConfigurator
        anchor={DEFAULT_ANCHOR}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={handleUpdate}
        onReset={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'DX' } });

    expect(handleUpdate).toHaveBeenCalledWith({
      ...DEFAULT_ANCHOR,
      side: 'DX',
    });
  });

  it('should call onUpdate when column changes', () => {
    const handleUpdate = vi.fn();
    render(
      <AnchorConfigurator
        anchor={DEFAULT_ANCHOR}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={handleUpdate}
        onReset={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'E' } });

    expect(handleUpdate).toHaveBeenCalledWith({
      ...DEFAULT_ANCHOR,
      column: 'E',
    });
  });

  it('should call onUpdate with parsed integer when row changes', () => {
    const handleUpdate = vi.fn();
    render(
      <AnchorConfigurator
        anchor={DEFAULT_ANCHOR}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={handleUpdate}
        onReset={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[2], { target: { value: '8' } });

    expect(handleUpdate).toHaveBeenCalledWith({
      ...DEFAULT_ANCHOR,
      row: 8,
    });
  });

  it('should call onReset when reset button is clicked', () => {
    const handleReset = vi.fn();
    render(
      <AnchorConfigurator
        anchor={{ side: 'DX', column: 'K', row: 10 }}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={handleReset}
      />
    );

    fireEvent.click(screen.getByText('Réinitialiser'));

    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('should render side options (Gauche/Droite)', () => {
    render(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const sideOptions = selects[0].querySelectorAll('option');

    expect(sideOptions).toHaveLength(2);
    expect(sideOptions[0]).toHaveTextContent('Gauche');
    expect(sideOptions[1]).toHaveTextContent('Droite');
  });

  it('should render row options 1-10', () => {
    render(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const rowOptions = selects[2].querySelectorAll('option');

    expect(rowOptions).toHaveLength(10);
    expect(rowOptions[0]).toHaveValue('1');
    expect(rowOptions[9]).toHaveValue('10');
  });

  it('should render column options A-K by default', () => {
    render(
      <AnchorConfigurator
        anchor={undefined}
        defaultAnchor={DEFAULT_ANCHOR}
        onUpdate={() => {}}
        onReset={() => {}}
      />
    );

    const selects = screen.getAllByRole('combobox');
    const columnOptions = selects[1].querySelectorAll('option');

    expect(columnOptions).toHaveLength(11); // A-K (11 columns)
    expect(columnOptions[0]).toHaveValue('A');
    expect(columnOptions[10]).toHaveValue('K');
  });
});
