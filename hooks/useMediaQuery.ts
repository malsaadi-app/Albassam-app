'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design based on media queries
 * 
 * Breakpoints (matching Tailwind CSS):
 * - sm: 640px
 * - md: 768px
 * - lg: 1024px
 * - xl: 1280px
 * - 2xl: 1536px
 */

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Create listener
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Add listener
    media.addEventListener('change', listener);

    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Convenience hooks for common breakpoints
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

export function useIsSmallScreen(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

export function useIsLargeScreen(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

// Orientation
export function useIsPortrait(): boolean {
  return useMediaQuery('(orientation: portrait)');
}

export function useIsLandscape(): boolean {
  return useMediaQuery('(orientation: landscape)');
}

// Touch device detection
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

// Responsive values hook
export function useResponsiveValue<T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile && values.mobile !== undefined) {
    return values.mobile;
  }

  if (isTablet && values.tablet !== undefined) {
    return values.tablet;
  }

  if (values.desktop !== undefined) {
    return values.desktop;
  }

  return values.default;
}
