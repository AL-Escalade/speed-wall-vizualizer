import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedColor } from './useDebouncedColor';

describe('useDebouncedColor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial color', () => {
    const onColorChange = vi.fn();
    const { result } = renderHook(() => useDebouncedColor('#ff0000', onColorChange));

    expect(result.current[0]).toBe('#ff0000');
  });

  it('should update local color immediately on change', () => {
    const onColorChange = vi.fn();
    const { result } = renderHook(() => useDebouncedColor('#ff0000', onColorChange));

    act(() => {
      result.current[1]('#00ff00');
    });

    expect(result.current[0]).toBe('#00ff00');
    expect(onColorChange).not.toHaveBeenCalled();
  });

  it('should debounce the callback', () => {
    const onColorChange = vi.fn();
    const { result } = renderHook(() => useDebouncedColor('#ff0000', onColorChange));

    act(() => {
      result.current[1]('#00ff00');
    });

    expect(onColorChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onColorChange).toHaveBeenCalledWith('#00ff00');
    expect(onColorChange).toHaveBeenCalledTimes(1);
  });

  it('should use custom delay', () => {
    const onColorChange = vi.fn();
    const { result } = renderHook(() => useDebouncedColor('#ff0000', onColorChange, 300));

    act(() => {
      result.current[1]('#00ff00');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onColorChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(onColorChange).toHaveBeenCalledWith('#00ff00');
  });

  it('should reset debounce timer on rapid changes', () => {
    const onColorChange = vi.fn();
    const { result } = renderHook(() => useDebouncedColor('#ff0000', onColorChange));

    act(() => {
      result.current[1]('#00ff00');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current[1]('#0000ff');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onColorChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(onColorChange).toHaveBeenCalledWith('#0000ff');
    expect(onColorChange).toHaveBeenCalledTimes(1);
  });

  it('should sync local color when initial color changes', () => {
    const onColorChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ initialColor }) => useDebouncedColor(initialColor, onColorChange),
      { initialProps: { initialColor: '#ff0000' } }
    );

    expect(result.current[0]).toBe('#ff0000');

    rerender({ initialColor: '#00ff00' });

    expect(result.current[0]).toBe('#00ff00');
  });

  it('should cleanup timer on unmount', () => {
    const onColorChange = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedColor('#ff0000', onColorChange));

    act(() => {
      result.current[1]('#00ff00');
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Callback should not be called after unmount
    expect(onColorChange).not.toHaveBeenCalled();
  });
});
