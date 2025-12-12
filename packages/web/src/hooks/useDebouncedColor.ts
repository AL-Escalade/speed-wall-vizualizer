/**
 * Hook for managing color state with debounced updates
 * Provides immediate visual feedback while debouncing store updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing a color value with debounced updates.
 *
 * @param initialColor - The initial color value (usually from store/props)
 * @param onColorChange - Callback to update the store/parent (will be debounced)
 * @param delay - Debounce delay in milliseconds (default: 150)
 * @returns Tuple of [localColor, handleColorChange]
 */
export function useDebouncedColor(
  initialColor: string,
  onColorChange: (color: string) => void,
  delay = 150
): [string, (color: string) => void] {
  const [localColor, setLocalColor] = useState(initialColor);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local color when initialColor changes externally
  useEffect(() => {
    setLocalColor(initialColor);
  }, [initialColor]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleColorChange = useCallback(
    (color: string) => {
      // Update local state immediately for visual feedback
      setLocalColor(color);

      // Clear pending store update
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce store update to avoid excessive rerenders
      debounceRef.current = setTimeout(() => {
        onColorChange(color);
      }, delay);
    },
    [onColorChange, delay]
  );

  return [localColor, handleColorChange];
}
