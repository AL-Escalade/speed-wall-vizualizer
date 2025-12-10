import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LaneSelector } from './LaneSelector';

describe('LaneSelector', () => {
  it('should render label and lane options with 0-based values and 1-based labels', () => {
    render(<LaneSelector value={0} lanesCount={3} onChange={() => {}} />);

    // Label should be visible
    expect(screen.getByText('Couloir')).toBeInTheDocument();

    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');

    // Should have correct number of options
    expect(options).toHaveLength(3);

    // Values are 0-based, labels are 1-based
    expect(options[0]).toHaveValue('0');
    expect(options[0]).toHaveTextContent('Couloir 1');
    expect(options[1]).toHaveValue('1');
    expect(options[1]).toHaveTextContent('Couloir 2');
    expect(options[2]).toHaveValue('2');
    expect(options[2]).toHaveTextContent('Couloir 3');
  });

  it('should have the correct value selected', () => {
    render(<LaneSelector value={1} lanesCount={3} onChange={() => {}} />);

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('1');
  });

  it('should call onChange with parsed integer when selection changes', () => {
    const handleChange = vi.fn();
    render(<LaneSelector value={0} lanesCount={3} onChange={handleChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '2' } });

    expect(handleChange).toHaveBeenCalledWith(2);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
