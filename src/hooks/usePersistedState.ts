/**
 * Custom hook for persisted state management
 *
 * Eliminates the duplicate localStorage pattern across hooks by providing
 * a reusable hook that handles loading, saving, and error handling for
 * localStorage-backed state.
 *
 * @module hooks/usePersistedState
 *
 * @example
 * ```typescript
 * import { usePersistedState } from '@/hooks/usePersistedState';
 *
 * function MyComponent() {
 *   const [data, setData] = usePersistedState<MyData>(
 *     'my-storage-key',
 *     { defaultValue: 'initial' },
 *     { loggerPrefix: 'MyComponent' }
 *   );
 *
 *   return <div>{data.value}</div>;
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createLogger } from '@/lib/logger';

/**
 * Options for usePersistedState hook
 */
export interface UsePersistedStateOptions<T> {
  /** Logger prefix for error messages */
  loggerPrefix?: string;
  /** Custom validation function for loaded data */
  validate?: (data: unknown) => T | null;
  /** Custom serializer (defaults to JSON.stringify) */
  serialize?: (data: T) => string;
  /** Custom deserializer (defaults to JSON.parse) */
  deserialize?: (data: string) => unknown;
  /** Whether to sync across tabs via storage events */
  syncTabs?: boolean;
}

/**
 * Return type for usePersistedState hook
 */
export type UsePersistedStateReturn<T> = [
  T,
  (value: T | ((prev: T) => T)) => void,
  {
    /** Force reload data from localStorage */
    reload: () => void;
    /** Check if data has been loaded */
    isLoaded: boolean;
    /** Clear the persisted data */
    clear: () => void;
  }
];

/**
 * Custom hook for localStorage-backed state
 *
 * Provides a standardized way to manage state that persists to localStorage,
 * with proper error handling, validation, and cross-tab synchronization.
 *
 * @param key - The localStorage key to use
 * @param initialValue - The initial value if no data is stored
 * @param options - Configuration options
 * @returns Tuple of [state, setState, utilities]
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
  options: UsePersistedStateOptions<T> = {}
): UsePersistedStateReturn<T> {
  const {
    loggerPrefix,
    validate,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncTabs = false,
  } = options;

  const logger = loggerPrefix ? createLogger({ prefix: loggerPrefix }) : createLogger();
  const [state, setState] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialMount = useRef(true);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = deserialize(saved);
        if (validate) {
          const validated = validate(parsed);
          if (validated !== null) {
            setState(validated);
          }
        } else {
          setState(parsed as T);
        }
      }
    } catch (error) {
      logger.error(`Failed to load data from localStorage (${key}):`, error);
    } finally {
      setIsLoaded(true);
      isInitialMount.current = false;
    }
  }, [key, deserialize, validate]);

  // Save to localStorage when state changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) return;

    try {
      localStorage.setItem(key, serialize(state));
    } catch (error) {
      logger.error(`Failed to save data to localStorage (${key}):`, error);
    }
  }, [state, key, serialize]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    if (!syncTabs) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key || !event.newValue) return;

      try {
        const parsed = deserialize(event.newValue);
        if (validate) {
          const validated = validate(parsed);
          if (validated !== null) {
            setState(validated);
          }
        } else {
          setState(parsed as T);
        }
      } catch (error) {
        logger.error(`Failed to sync data from storage event (${key}):`, error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, deserialize, validate, syncTabs]);

  // Force reload from localStorage
  const reload = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = deserialize(saved);
        if (validate) {
          const validated = validate(parsed);
          if (validated !== null) {
            setState(validated);
          }
        } else {
          setState(parsed as T);
        }
      }
    } catch (error) {
      logger.error(`Failed to reload data from localStorage (${key}):`, error);
    }
  }, [key, deserialize, validate]);

  // Clear persisted data
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setState(initialValue);
    } catch (error) {
      logger.error(`Failed to clear data from localStorage (${key}):`, error);
    }
  }, [key, initialValue]);

  return [state, setState, { reload, isLoaded, clear }];
}

/**
 * Simplified version for simple key-value storage
 * Uses the same pattern but with less configuration
 */
export function useSimplePersistedState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = usePersistedState(key, initialValue);
  return [state, setState];
}
