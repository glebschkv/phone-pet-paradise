/**
 * useReducedMotion — Respects the OS "Reduce Motion" accessibility setting
 *
 * Returns `true` when the user has enabled "Reduce Motion" in:
 *   - iOS: Settings → Accessibility → Motion → Reduce Motion
 *   - macOS: System Settings → Accessibility → Display → Reduce motion
 *   - Android: Settings → Accessibility → Remove animations
 *
 * Usage:
 *   const prefersReducedMotion = useReducedMotion();
 *   // Skip particle effects, spring animations, etc. when true
 */

import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** SSR-safe initial value */
function getInitialValue(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialValue);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    mql.addEventListener('change', handler);
    // Sync in case the value changed between render and effect
    setPrefersReducedMotion(mql.matches);

    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};
