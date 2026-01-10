/**
 * Memoization Utilities
 *
 * Provides memoization helpers for expensive operations.
 * Useful for optimizing filter operations, calculations, and data transformations.
 */

/**
 * Simple memoization for functions with primitive arguments
 * Uses a Map for O(1) lookup
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: {
    maxSize?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T & { clear: () => void } {
  const { maxSize = 100, keyGenerator } = options;
  // Use Map for LRU: Map maintains insertion order, so we can delete and re-add to move to end
  const cache = new Map<string, ReturnType<T>>();

  const memoized = ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      // LRU: Move to end by deleting and re-adding
      const value = cache.get(key)!;
      cache.delete(key);
      cache.set(key, value);
      return value;
    }

    const result = fn(...args) as ReturnType<T>;

    // Evict oldest entry (first item in Map) if cache is full
    if (cache.size >= maxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, result);

    return result;
  }) as T & { clear: () => void };

  // Allow manual cache clearing
  memoized.clear = () => cache.clear();

  return memoized;
}

/**
 * Memoize with shallow comparison for object arguments
 * Useful for React component props
 */
export function memoizeWithShallowCompare<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize: number = 10
): T {
  const cache: Array<{ args: unknown[]; result: ReturnType<T> }> = [];

  return ((...args: unknown[]) => {
    // Find matching cached result
    const cached = cache.find((entry) =>
      entry.args.length === args.length &&
      entry.args.every((arg, i) => shallowEqual(arg, args[i]))
    );

    if (cached) {
      return cached.result;
    }

    const result = fn(...args) as ReturnType<T>;

    // Evict oldest entry if cache is full
    if (cache.length >= maxSize) {
      cache.shift();
    }

    cache.push({ args, result });

    return result;
  }) as T;
}

/**
 * Shallow equality check for objects
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  // Arrays and plain objects should not be considered equal
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Creates a Set from an array for O(1) lookups
 * Useful when you need to check if an item exists in a large array multiple times
 */
export function arrayToSet<T>(array: T[]): Set<T> {
  return new Set(array);
}

/**
 * Creates a Map from an array for O(1) lookups by key
 */
export function arrayToMap<T, K>(
  array: T[],
  keySelector: (item: T) => K
): Map<K, T> {
  return new Map(array.map((item) => [keySelector(item), item]));
}

/**
 * Debounced function creator
 * Returns the last result while debouncing
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastResult: ReturnType<T> | undefined;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      lastResult = fn(...args) as ReturnType<T>;
      timeoutId = null;
    }, delay);

    return lastResult;
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttled function creator
 * Executes at most once per interval
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  interval: number
): T {
  let lastExecuted = 0;
  let lastResult: ReturnType<T> | undefined;

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastExecuted >= interval) {
      lastResult = fn(...args) as ReturnType<T>;
      lastExecuted = now;
    }

    return lastResult;
  }) as T;
}

/**
 * Lazy evaluation - compute value only when needed
 */
export function lazy<T>(factory: () => T): () => T {
  let value: T | undefined;
  let computed = false;

  return () => {
    if (!computed) {
      value = factory();
      computed = true;
    }
    return value as T;
  };
}

/**
 * Creates a stable reference for callbacks
 * Useful when you need a callback that doesn't change identity
 * but still has access to latest values
 *
 * Returns a tuple: [stableCallback, updateCallback]
 * - stableCallback: A function with stable identity that always calls the latest callback
 * - updateCallback: Call this to update the underlying callback reference
 */
export function createStableCallback<T extends (...args: unknown[]) => unknown>(
  initialCallback: T
): [T, (newCallback: T) => void] {
  // Store the latest callback in a mutable container
  let latestCallback: T = initialCallback;

  // The stable callback maintains its identity but delegates to latestCallback
  const stableCallback = ((...args: Parameters<T>) => {
    return latestCallback(...args);
  }) as T;

  // Updater function to change the underlying callback
  const updateCallback = (newCallback: T) => {
    latestCallback = newCallback;
  };

  return [stableCallback, updateCallback];
}

// ============================================================================
// REACT-SPECIFIC HELPERS
// ============================================================================

/**
 * Creates a selector function that memoizes the result
 * Useful for creating selectors for Zustand stores
 */
export function createSelector<TState, TResult>(
  selector: (state: TState) => TResult,
  equalityFn: (a: TResult, b: TResult) => boolean = Object.is
): (state: TState) => TResult {
  let lastState: TState | undefined;
  let lastResult: TResult | undefined;

  return (state: TState) => {
    if (state !== lastState) {
      const nextResult = selector(state);
      if (lastResult === undefined || !equalityFn(lastResult, nextResult)) {
        lastResult = nextResult;
      }
      lastState = state;
    }
    return lastResult as TResult;
  };
}

/**
 * Combines multiple selectors into one
 * Only recomputes when any of the input selectors change
 */
export function combineSelectors<TState, TResults extends unknown[], TResult>(
  selectors: { [K in keyof TResults]: (state: TState) => TResults[K] },
  combiner: (...results: TResults) => TResult
): (state: TState) => TResult {
  let lastResults: TResults | undefined;
  let lastCombined: TResult | undefined;

  return (state: TState) => {
    const results = selectors.map((sel) => sel(state)) as TResults;

    const changed = !lastResults || results.some((r, i) => r !== lastResults![i]);

    if (changed) {
      lastCombined = combiner(...results);
      lastResults = results;
    }

    return lastCombined as TResult;
  };
}
