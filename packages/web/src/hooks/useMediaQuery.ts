/**
 * Hook to detect media query matches
 * Used for responsive layout switching
 */

import { useState, useEffect } from 'react';

/**
 * Returns true if the media query matches
 * @param query - CSS media query string (e.g., '(max-width: 767px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Breakpoint for mobile devices (< 768px) */
export const MOBILE_BREAKPOINT = '(max-width: 767px)';

/** Hook specifically for detecting mobile screens */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_BREAKPOINT);
}
