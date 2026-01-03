/**
 * useIsMounted Hook
 *
 * Simple hook to track if a component is still mounted.
 * Useful for preventing state updates on unmounted components
 * in async operations that don't support AbortController.
 *
 * Usage:
 * ```tsx
 * const isMounted = useIsMounted();
 *
 * useEffect(() => {
 *   async function fetchData() {
 *     const result = await someAsyncOperation();
 *     if (isMounted()) {
 *       setState(result);
 *     }
 *   }
 *   fetchData();
 * }, [isMounted]);
 * ```
 */

import { useRef, useEffect, useCallback } from 'react';

export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Hook for safe async state updates
 * Returns a function that only calls setState if component is mounted
 */
export function useSafeState<T>(
  setState: React.Dispatch<React.SetStateAction<T>>
): React.Dispatch<React.SetStateAction<T>> {
  const isMounted = useIsMounted();

  return useCallback(
    (value: React.SetStateAction<T>) => {
      if (isMounted()) {
        setState(value);
      }
    },
    [isMounted, setState]
  );
}
