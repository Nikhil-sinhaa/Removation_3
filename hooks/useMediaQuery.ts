// hooks/useMediaQuery.ts
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook to check if a media query matches
 * @param query - CSS media query string
 * @returns Boolean indicating if query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // SSR check
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks matching Tailwind defaults
 */
export function useBreakpoint() {
  const isSm = useMediaQuery('(min-width: 640px)');
  const isMd = useMediaQuery('(min-width: 768px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const isXl = useMediaQuery('(min-width: 1280px)');
  const is2Xl = useMediaQuery('(min-width: 1536px)');

  return useMemo(
    () => ({
      isSm,
      isMd,
      isLg,
      isXl,
      is2Xl,
      // Convenience properties
      isMobile: !isMd,
      isTablet: isMd && !isLg,
      isDesktop: isLg,
      isLargeDesktop: isXl,
      // Current breakpoint name
      current: is2Xl
        ? '2xl'
        : isXl
        ? 'xl'
        : isLg
        ? 'lg'
        : isMd
        ? 'md'
        : isSm
        ? 'sm'
        : 'xs',
    }),
    [isSm, isMd, isLg, isXl, is2Xl]
  );
}

/**
 * Hook for color scheme preference (dark mode)
 */
export function usePrefersColorScheme(): 'light' | 'dark' {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  return prefersDark ? 'dark' : 'light';
}

/**
 * Hook for reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook for high contrast preference
 */
export function usePrefersContrast(): 'no-preference' | 'more' | 'less' | 'custom' {
  const prefersMore = useMediaQuery('(prefers-contrast: more)');
  const prefersLess = useMediaQuery('(prefers-contrast: less)');
  const prefersCustom = useMediaQuery('(prefers-contrast: custom)');

  if (prefersMore) return 'more';
  if (prefersLess) return 'less';
  if (prefersCustom) return 'custom';
  return 'no-preference';
}

/**
 * Hook for reduced transparency preference
 */
export function usePrefersReducedTransparency(): boolean {
  return useMediaQuery('(prefers-reduced-transparency: reduce)');
}

/**
 * Hook for color gamut support
 */
export function useColorGamut(): 'srgb' | 'p3' | 'rec2020' {
  const supportsRec2020 = useMediaQuery('(color-gamut: rec2020)');
  const supportsP3 = useMediaQuery('(color-gamut: p3)');

  if (supportsRec2020) return 'rec2020';
  if (supportsP3) return 'p3';
  return 'srgb';
}

/**
 * Hook for pointer type (touch vs mouse)
 */
export function usePointerType(): 'fine' | 'coarse' | 'none' {
  const isFine = useMediaQuery('(pointer: fine)');
  const isCoarse = useMediaQuery('(pointer: coarse)');

  if (isFine) return 'fine';
  if (isCoarse) return 'coarse';
  return 'none';
}

/**
 * Hook for hover capability
 */
export function useHoverCapability(): 'hover' | 'none' {
  const canHover = useMediaQuery('(hover: hover)');
  return canHover ? 'hover' : 'none';
}

/**
 * Hook for print media
 */
export function useIsPrint(): boolean {
  return useMediaQuery('print');
}

/**
 * Hook for orientation
 */
export function useMediaOrientation(): 'portrait' | 'landscape' {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  return isPortrait ? 'portrait' : 'landscape';
}

/**
 * Hook for aspect ratio queries
 */
export function useAspectRatio() {
  const is16by9 = useMediaQuery('(aspect-ratio: 16/9)');
  const is4by3 = useMediaQuery('(aspect-ratio: 4/3)');
  const isWide = useMediaQuery('(min-aspect-ratio: 16/9)');
  const isTall = useMediaQuery('(max-aspect-ratio: 9/16)');

  return { is16by9, is4by3, isWide, isTall };
}

/**
 * Hook for display mode (PWA)
 */
export function useDisplayMode(): 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen' {
  const isStandalone = useMediaQuery('(display-mode: standalone)');
  const isMinimalUI = useMediaQuery('(display-mode: minimal-ui)');
  const isFullscreen = useMediaQuery('(display-mode: fullscreen)');

  if (isFullscreen) return 'fullscreen';
  if (isStandalone) return 'standalone';
  if (isMinimalUI) return 'minimal-ui';
  return 'browser';
}

/**
 * Hook for checking multiple media queries at once
 */
export function useMediaQueries<T extends Record<string, string>>(
  queries: T
): Record<keyof T, boolean> {
  const [matches, setMatches] = useState<Record<keyof T, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const key in queries) {
      initial[key] = false;
    }
    return initial as Record<keyof T, boolean>;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryLists: { key: keyof T; mql: MediaQueryList }[] = [];

    const handleChange = () => {
      const newMatches: Record<string, boolean> = {};
      for (const { key, mql } of mediaQueryLists) {
        newMatches[key as string] = mql.matches;
      }
      setMatches(newMatches as Record<keyof T, boolean>);
    };

    for (const key in queries) {
      const mql = window.matchMedia(queries[key]);
      mediaQueryLists.push({ key, mql });

      if (mql.addEventListener) {
        mql.addEventListener('change', handleChange);
      } else {
        mql.addListener(handleChange);
      }
    }

    // Initial check
    handleChange();

    return () => {
      for (const { mql } of mediaQueryLists) {
        if (mql.removeEventListener) {
          mql.removeEventListener('change', handleChange);
        } else {
          mql.removeListener(handleChange);
        }
      }
    };
  }, [queries]);

  return matches;
}

/**
 * Hook for responsive value based on breakpoints
 */
export function useResponsiveValue<T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T | undefined {
  const breakpoint = useBreakpoint();

  return useMemo(() => {
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
    const currentIndex = breakpoints.indexOf(breakpoint.current as any);

    // Find the value for current breakpoint or the nearest smaller one
    for (let i = currentIndex; i >= 0; i--) {
      const key = breakpoints[i];
      if (values[key] !== undefined) {
        return values[key];
      }
    }

    return undefined;
  }, [breakpoint.current, values]);
}

/**
 * Hook for container queries (if supported)
 */
export function useContainerQuery(
  containerRef: React.RefObject<HTMLElement>,
  query: string
): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const checkQuery = () => {
      const width = container.offsetWidth;
      const height = container.offsetHeight;

      // Parse simple width queries like "(min-width: 400px)"
      const minWidthMatch = query.match(/\(min-width:\s*(\d+)px\)/);
      const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/);
      const minHeightMatch = query.match(/\(min-height:\s*(\d+)px\)/);
      const maxHeightMatch = query.match(/\(max-height:\s*(\d+)px\)/);

      let result = true;

      if (minWidthMatch) {
        result = result && width >= parseInt(minWidthMatch[1]);
      }
      if (maxWidthMatch) {
        result = result && width <= parseInt(maxWidthMatch[1]);
      }
      if (minHeightMatch) {
        result = result && height >= parseInt(minHeightMatch[1]);
      }
      if (maxHeightMatch) {
        result = result && height <= parseInt(maxHeightMatch[1]);
      }

      setMatches(result);
    };

    const observer = new ResizeObserver(checkQuery);
    observer.observe(container);
    checkQuery();

    return () => observer.disconnect();
  }, [containerRef, query]);

  return matches;
}

/**
 * Comprehensive device capabilities hook
 */
export function useDeviceCapabilities() {
  const colorScheme = usePrefersColorScheme();
  const reducedMotion = usePrefersReducedMotion();
  const contrast = usePrefersContrast();
  const colorGamut = useColorGamut();
  const pointerType = usePointerType();
  const hoverCapability = useHoverCapability();
  const orientation = useMediaOrientation();
  const displayMode = useDisplayMode();
  const breakpoint = useBreakpoint();

  return useMemo(
    () => ({
      colorScheme,
      reducedMotion,
      contrast,
      colorGamut,
      pointerType,
      hoverCapability,
      orientation,
      displayMode,
      breakpoint,
      // Computed convenience values
      supportsHover: hoverCapability === 'hover',
      isTouchDevice: pointerType === 'coarse',
      isHighEnd: colorGamut !== 'srgb' && !reducedMotion,
    }),
    [
      colorScheme,
      reducedMotion,
      contrast,
      colorGamut,
      pointerType,
      hoverCapability,
      orientation,
      displayMode,
      breakpoint,
    ]
  );
}

export default useMediaQuery;