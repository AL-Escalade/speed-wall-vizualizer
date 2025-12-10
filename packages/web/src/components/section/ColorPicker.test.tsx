import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from './ColorPicker';

describe('ColorPicker', () => {
  it('should render with the provided value', () => {
    const { container } = render(<ColorPicker value="#FF0000" onChange={() => {}} />);

    const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;

    expect(colorInput).toBeInTheDocument();
    expect(colorInput.value).toBe('#ff0000');
  });

  it('should display the label "Couleur"', () => {
    render(<ColorPicker value="#00FF00" onChange={() => {}} />);

    expect(screen.getByText('Couleur')).toBeInTheDocument();
  });

  it('should call onChange when color changes', () => {
    const handleChange = vi.fn();
    const { container } = render(<ColorPicker value="#0000FF" onChange={handleChange} />);

    const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;
    fireEvent.input(colorInput, { target: { value: '#FF5500' } });

    expect(handleChange).toHaveBeenCalledWith('#ff5500');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
