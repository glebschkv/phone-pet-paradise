/**
 * Debounce and Throttle Utilities
 *
 * Provides utilities for rate-limiting function calls to improve performance
 * and reduce unnecessary API requests.
 */

import { NETWORK_CONFIG } from './constants';

/**
 * Creates a debounced version of a function that delays invoking until after
 * wait milliseconds have elapsed since the last time it was invoked.
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number = NETWORK_CONFIG.DEBOUNCE.DEFAULT
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a debounced function with a leading edge option.
 * If leading is true, the function is invoked on the leading edge.
 */
export function debounceWithOptions<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  options: {
    wait?: number;
    leading?: boolean;
    trailing?: boolean;
  } = {}
): (...args: Parameters<T>) => void {
  const { wait = NETWORK_CONFIG.DEBOUNCE.DEFAULT, leading = false, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: ThisParameterType<T> | null = null;

  const invokeFunc = () => {
    if (lastArgs && lastThis) {
      func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  };

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = Date.now();
    const isInvoking = lastCallTime === null;

    lastArgs = args;
    lastThis = this;
    lastCallTime = now;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (leading && isInvoking) {
      invokeFunc();
    }

    if (trailing) {
      timeoutId = setTimeout(() => {
        if (!leading || lastCallTime !== now) {
          invokeFunc();
        }
        timeoutId = null;
        lastCallTime = null;
      }, wait);
    }
  };
}

/**
 * Creates a throttled version of a function that only invokes at most once
 * per every wait milliseconds.
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number = NETWORK_CONFIG.DEBOUNCE.DEFAULT
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: ThisParameterType<T> | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        if (lastArgs && lastThis) {
          func.apply(lastThis, lastArgs);
        }
      }, remaining);
    }
  };
}

/**
 * Creates a debounced async function that returns a promise.
 * Multiple calls during the wait period will all receive the same promise.
 */
export function debounceAsync<T extends (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>>(
  func: T,
  wait: number = NETWORK_CONFIG.DEBOUNCE.DEFAULT
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<Awaited<ReturnType<T>>> | null = null;
  let resolveRef: ((value: Awaited<ReturnType<T>>) => void) | null = null;
  let rejectRef: ((error: Error) => void) | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        resolveRef = resolve;
        rejectRef = reject;
      });
    }

    timeoutId = setTimeout(async () => {
      try {
        const result = await func.apply(this, args);
        resolveRef?.(result);
      } catch (error) {
        rejectRef?.(error instanceof Error ? error : new Error(String(error)));
      } finally {
        pendingPromise = null;
        resolveRef = null;
        rejectRef = null;
        timeoutId = null;
      }
    }, wait);

    return pendingPromise;
  };
}

/**
 * Creates a function that will only execute once within the specified time window.
 * Useful for preventing rapid-fire API calls.
 */
export function rateLimit<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number,
  windowMs: number = 1000
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  const calls: number[] = [];

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();

    // Remove calls outside the window
    while (calls.length > 0 && calls[0] <= now - windowMs) {
      calls.shift();
    }

    if (calls.length < limit) {
      calls.push(now);
      return func.apply(this, args);
    }

    console.warn('[RateLimit] Function call blocked - rate limit exceeded');
    return undefined;
  };
}

/**
 * Hook-friendly debounce that returns both the debounced function and a cancel method.
 */
export function createDebouncedFunction<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number = NETWORK_CONFIG.DEBOUNCE.DEFAULT
): {
  debouncedFn: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: ThisParameterType<T> | null = null;

  const debouncedFn = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (lastArgs && lastThis) {
        func.apply(lastThis, lastArgs);
      }
      timeoutId = null;
    }, wait);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  const flush = () => {
    if (timeoutId && lastArgs && lastThis) {
      clearTimeout(timeoutId);
      func.apply(lastThis, lastArgs);
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  return { debouncedFn, cancel, flush };
}

/**
 * React hook for debouncing a value.
 * Returns the debounced value that updates after the specified delay.
 */
export function useDebouncedValue<T>(value: T, delay: number = NETWORK_CONFIG.DEBOUNCE.DEFAULT): T {
  // This is a type definition only - actual implementation would use useState/useEffect
  // Keeping here for documentation purposes
  return value;
}

// Pre-configured debounce functions for common use cases
export const debouncedSearch = <T extends (...args: Parameters<T>) => ReturnType<T>>(fn: T) =>
  debounce(fn, NETWORK_CONFIG.DEBOUNCE.SEARCH);

export const debouncedSave = <T extends (...args: Parameters<T>) => ReturnType<T>>(fn: T) =>
  debounce(fn, NETWORK_CONFIG.DEBOUNCE.SAVE);

export const debouncedSync = <T extends (...args: Parameters<T>) => ReturnType<T>>(fn: T) =>
  debounce(fn, NETWORK_CONFIG.DEBOUNCE.SYNC);
