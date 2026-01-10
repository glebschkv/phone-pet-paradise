import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  memoize,
  memoizeWithShallowCompare,
  shallowEqual,
  arrayToSet,
  arrayToMap,
  debounce,
  throttle,
  lazy,
  createStableCallback,
  createSelector,
  combineSelectors,
} from '@/lib/memoization';

describe('memoization utilities', () => {
  describe('memoize', () => {
    it('should cache results for same arguments', () => {
      let callCount = 0;
      const fn = (a: unknown, b: unknown) => {
        callCount++;
        return (a as number) + (b as number);
      };
      const memoized = memoize(fn);

      expect(memoized(1, 2)).toBe(3);
      expect(memoized(1, 2)).toBe(3);
      expect(memoized(1, 2)).toBe(3);

      expect(callCount).toBe(1);
    });

    it('should recompute for different arguments', () => {
      let callCount = 0;
      const fn = (x: unknown) => {
        callCount++;
        return (x as number) * 2;
      };
      const memoized = memoize(fn);

      expect(memoized(5)).toBe(10);
      expect(memoized(10)).toBe(20);
      expect(memoized(5)).toBe(10); // cached

      expect(callCount).toBe(2);
    });

    it('should respect maxSize option', () => {
      let callCount = 0;
      const fn = (x: unknown) => {
        callCount++;
        return x;
      };
      const memoized = memoize(fn, { maxSize: 2 });

      memoized(1);
      memoized(2);
      memoized(3); // Should evict 1

      expect(callCount).toBe(3);

      memoized(1); // Should recompute since 1 was evicted
      expect(callCount).toBe(4);

      memoized(3); // Still cached
      expect(callCount).toBe(4);
    });

    it('should use custom key generator', () => {
      let callCount = 0;
      const fn = (obj: unknown) => {
        callCount++;
        return (obj as { id: number }).id * 2;
      };
      const memoized = memoize(fn, {
        keyGenerator: (obj) => String((obj as { id: number }).id),
      });

      expect(memoized({ id: 5 })).toBe(10);
      expect(memoized({ id: 5 })).toBe(10); // Same key

      expect(callCount).toBe(1);
    });

    it('should have a clear method', () => {
      let callCount = 0;
      const fn = (x: unknown) => {
        callCount++;
        return x;
      };
      const memoized = memoize(fn);

      memoized(1);
      expect(callCount).toBe(1);

      memoized.clear();

      memoized(1);
      expect(callCount).toBe(2);
    });

    it('should handle object arguments with default JSON.stringify', () => {
      let callCount = 0;
      const fn = (obj: unknown) => {
        callCount++;
        return (obj as { a: number }).a;
      };
      const memoized = memoize(fn);

      expect(memoized({ a: 1 })).toBe(1);
      expect(memoized({ a: 1 })).toBe(1); // Same JSON string

      expect(callCount).toBe(1);
    });

    it('should implement LRU eviction', () => {
      let callCount = 0;
      const fn = (x: unknown) => {
        callCount++;
        return x;
      };
      const memoized = memoize(fn, { maxSize: 3 });

      memoized(1);
      memoized(2);
      memoized(3);
      memoized(1); // Access 1 again, making it most recent
      memoized(4); // Should evict 2 (oldest not recently used)

      expect(callCount).toBe(4);

      memoized(2); // Evicted, must recompute
      expect(callCount).toBe(5);

      memoized(1); // Still cached
      expect(callCount).toBe(5);
    });
  });

  describe('memoizeWithShallowCompare', () => {
    it('should cache results for shallow-equal arguments', () => {
      let callCount = 0;
      const fn = (obj: unknown) => {
        callCount++;
        return (obj as { a: number }).a * 2;
      };
      const memoized = memoizeWithShallowCompare(fn);

      const obj1 = { a: 5 };
      const obj2 = { a: 5 }; // Different reference, same content

      expect(memoized(obj1)).toBe(10);
      expect(memoized(obj2)).toBe(10); // Should use cache

      expect(callCount).toBe(1);
    });

    it('should recompute for different shallow values', () => {
      let callCount = 0;
      const fn = (obj: unknown) => {
        callCount++;
        return (obj as { a: number }).a;
      };
      const memoized = memoizeWithShallowCompare(fn);

      expect(memoized({ a: 1 })).toBe(1);
      expect(memoized({ a: 2 })).toBe(2);

      expect(callCount).toBe(2);
    });

    it('should respect maxSize', () => {
      let callCount = 0;
      const fn = (obj: unknown) => {
        callCount++;
        return (obj as { id: number }).id;
      };
      const memoized = memoizeWithShallowCompare(fn, 2);

      memoized({ id: 1 });
      memoized({ id: 2 });
      memoized({ id: 3 }); // Evicts first

      expect(callCount).toBe(3);

      memoized({ id: 1 }); // Recompute
      expect(callCount).toBe(4);
    });

    it('should handle multiple arguments', () => {
      let callCount = 0;
      const fn = (a: unknown, b: unknown) => {
        callCount++;
        return (a as { x: number }).x + (b as { y: number }).y;
      };
      const memoized = memoizeWithShallowCompare(fn);

      expect(memoized({ x: 1 }, { y: 2 })).toBe(3);
      expect(memoized({ x: 1 }, { y: 2 })).toBe(3); // Cached

      expect(callCount).toBe(1);
    });
  });

  describe('shallowEqual', () => {
    it('should return true for identical values', () => {
      expect(shallowEqual(1, 1)).toBe(true);
      expect(shallowEqual('a', 'a')).toBe(true);
      expect(shallowEqual(null, null)).toBe(true);
    });

    it('should return true for shallow-equal objects', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(shallowEqual({}, {})).toBe(true);
    });

    it('should return false for different objects', () => {
      expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(shallowEqual({ a: 1 }, { b: 1 })).toBe(false);
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('should return false for nested object differences', () => {
      // Shallow compare doesn't check nested objects
      const obj1 = { nested: { a: 1 } };
      const obj2 = { nested: { a: 1 } };
      expect(shallowEqual(obj1, obj2)).toBe(false); // Different nested refs
    });

    it('should handle null and undefined', () => {
      expect(shallowEqual(null, undefined)).toBe(false);
      expect(shallowEqual(null, {})).toBe(false);
      expect(shallowEqual(undefined, {})).toBe(false);
    });

    it('should return false for different types', () => {
      expect(shallowEqual(1, '1')).toBe(false);
      expect(shallowEqual({}, [])).toBe(false);
    });
  });

  describe('arrayToSet', () => {
    it('should convert array to Set', () => {
      const arr = [1, 2, 3, 4, 5];
      const set = arrayToSet(arr);

      expect(set).toBeInstanceOf(Set);
      expect(set.size).toBe(5);
      expect(set.has(3)).toBe(true);
    });

    it('should remove duplicates', () => {
      const arr = [1, 1, 2, 2, 3, 3];
      const set = arrayToSet(arr);

      expect(set.size).toBe(3);
    });

    it('should handle empty array', () => {
      const set = arrayToSet([]);
      expect(set.size).toBe(0);
    });

    it('should work with strings', () => {
      const arr = ['a', 'b', 'c'];
      const set = arrayToSet(arr);

      expect(set.has('a')).toBe(true);
      expect(set.has('d')).toBe(false);
    });
  });

  describe('arrayToMap', () => {
    it('should convert array to Map using key selector', () => {
      const arr = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      const map = arrayToMap(arr, (item) => item.id);

      expect(map).toBeInstanceOf(Map);
      expect(map.size).toBe(2);
      expect(map.get(1)?.name).toBe('Alice');
      expect(map.get(2)?.name).toBe('Bob');
    });

    it('should handle empty array', () => {
      const map = arrayToMap([] as { id: number }[], (item) => item.id);
      expect(map.size).toBe(0);
    });

    it('should override duplicates (last wins)', () => {
      const arr = [
        { id: 1, value: 'first' },
        { id: 1, value: 'second' },
      ];
      const map = arrayToMap(arr, (item) => item.id);

      expect(map.size).toBe(1);
      expect(map.get(1)?.value).toBe('second');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce function calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn as (...args: unknown[]) => unknown, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on each call', () => {
      const fn = vi.fn();
      const debounced = debounce(fn as (...args: unknown[]) => unknown, 100);

      debounced();
      vi.advanceTimersByTime(50);
      debounced();
      vi.advanceTimersByTime(50);
      debounced();
      vi.advanceTimersByTime(50);

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should have a cancel method', () => {
      const fn = vi.fn();
      const debounced = debounce(fn as (...args: unknown[]) => unknown, 100);

      debounced();
      debounced.cancel();

      vi.advanceTimersByTime(200);

      expect(fn).not.toHaveBeenCalled();
    });

    it('should return last result', () => {
      const fn = () => 42;
      const debounced = debounce(fn as (...args: unknown[]) => unknown, 100);

      const result1 = debounced();
      expect(result1).toBeUndefined(); // No result yet

      vi.advanceTimersByTime(100);

      const result2 = debounced();
      expect(result2).toBe(42); // Returns last result
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throttle function calls', () => {
      let callCount = 0;
      const fn = (x: unknown) => {
        callCount++;
        return x;
      };
      const throttled = throttle(fn, 100);

      throttled(1);
      throttled(2);
      throttled(3);

      expect(callCount).toBe(1);
    });

    it('should allow calls after interval', () => {
      const fn = vi.fn();
      const throttled = throttle(fn as (...args: unknown[]) => unknown, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should return last computed result during throttle', () => {
      const fn = () => 'result';
      const throttled = throttle(fn as (...args: unknown[]) => unknown, 100);

      expect(throttled()).toBe('result');
      expect(throttled()).toBe('result'); // Same cached result
      expect(throttled()).toBe('result');
    });
  });

  describe('lazy', () => {
    it('should defer computation until first call', () => {
      let factoryCalled = false;
      const factory = () => {
        factoryCalled = true;
        return 'expensive result';
      };
      const getLazy = lazy(factory);

      expect(factoryCalled).toBe(false);

      const result = getLazy();
      expect(result).toBe('expensive result');
      expect(factoryCalled).toBe(true);
    });

    it('should cache result after first call', () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return Math.random();
      };
      const getLazy = lazy(factory);

      const result1 = getLazy();
      const result2 = getLazy();
      const result3 = getLazy();

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(callCount).toBe(1);
    });

    it('should handle complex objects', () => {
      const factory = () => ({ data: [1, 2, 3] });
      const getLazy = lazy(factory);

      const obj1 = getLazy();
      const obj2 = getLazy();

      expect(obj1).toBe(obj2); // Same reference
    });
  });

  describe('createStableCallback', () => {
    it('should return a stable callback and updater', () => {
      const initial = () => 'initial';
      const [stable, update] = createStableCallback(initial as (...args: unknown[]) => unknown);

      expect(typeof stable).toBe('function');
      expect(typeof update).toBe('function');
    });

    it('should call the initial callback', () => {
      let called = false;
      const initial = () => {
        called = true;
        return 'result';
      };
      const [stable] = createStableCallback(initial as (...args: unknown[]) => unknown);

      expect(stable()).toBe('result');
      expect(called).toBe(true);
    });

    it('should call updated callback after update', () => {
      let updatedCalled = false;
      const initial = () => {
        return 'initial';
      };
      const updated = () => {
        updatedCalled = true;
        return 'updated';
      };
      const [stable, update] = createStableCallback(initial as (...args: unknown[]) => unknown);

      expect(stable()).toBe('initial');

      update(updated as (...args: unknown[]) => unknown);

      expect(stable()).toBe('updated');
      expect(updatedCalled).toBe(true);
    });

    it('should maintain stable identity', () => {
      const [stable1, update] = createStableCallback((() => 1) as (...args: unknown[]) => unknown);
      const stable1Ref = stable1;

      update((() => 2) as (...args: unknown[]) => unknown);

      expect(stable1).toBe(stable1Ref); // Same function reference
    });
  });

  describe('createSelector', () => {
    it('should memoize selector results', () => {
      let callCount = 0;
      const selector = (state: { count: number }) => {
        callCount++;
        return state.count * 2;
      };
      const memoizedSelector = createSelector(selector);

      const state = { count: 5 };

      expect(memoizedSelector(state)).toBe(10);
      expect(memoizedSelector(state)).toBe(10);

      expect(callCount).toBe(1);
    });

    it('should recompute when state changes', () => {
      let callCount = 0;
      const selector = (state: { count: number }) => {
        callCount++;
        return state.count;
      };
      const memoizedSelector = createSelector(selector);

      expect(memoizedSelector({ count: 1 })).toBe(1);
      expect(memoizedSelector({ count: 2 })).toBe(2);

      expect(callCount).toBe(2);
    });

    it('should use custom equality function', () => {
      const selector = (state: { items: number[] }) => state.items;
      const memoizedSelector = createSelector(selector, (a, b) => {
        return a.length === b.length && a.every((v, i) => v === b[i]);
      });

      const state1 = { items: [1, 2, 3] };
      const state2 = { items: [1, 2, 3] }; // Same content, different reference

      memoizedSelector(state1);
      const result2 = memoizedSelector(state2);

      // Should return same cached result due to custom equality
      expect(result2).toEqual([1, 2, 3]);
    });
  });

  describe('combineSelectors', () => {
    it('should combine multiple selectors', () => {
      type State = { a: number; b: number };
      const selectA = (state: State) => state.a;
      const selectB = (state: State) => state.b;
      const combined = combineSelectors<State, [number, number], number>(
        [selectA, selectB],
        (a, b) => a + b
      );

      expect(combined({ a: 5, b: 3 })).toBe(8);
    });

    it('should memoize combined result', () => {
      type State = { a: number; b: number };
      let combinerCallCount = 0;
      const combiner = (a: number, b: number) => {
        combinerCallCount++;
        return a + b;
      };
      const selectA = (state: State) => state.a;
      const selectB = (state: State) => state.b;
      const combined = combineSelectors<State, [number, number], number>(
        [selectA, selectB],
        combiner
      );

      const state = { a: 1, b: 2 };

      combined(state);
      combined(state);
      combined(state);

      expect(combinerCallCount).toBe(1);
    });

    it('should recompute when any input selector changes', () => {
      type State = { a: number; b: number };
      let combinerCallCount = 0;
      const combiner = (a: number, b: number) => {
        combinerCallCount++;
        return a + b;
      };
      const selectA = (state: State) => state.a;
      const selectB = (state: State) => state.b;
      const combined = combineSelectors<State, [number, number], number>(
        [selectA, selectB],
        combiner
      );

      combined({ a: 1, b: 2 });
      combined({ a: 1, b: 3 }); // b changed

      expect(combinerCallCount).toBe(2);
    });

    it('should work with more than two selectors', () => {
      type State = { x: number; y: number; z: number };
      const selectX = (s: State) => s.x;
      const selectY = (s: State) => s.y;
      const selectZ = (s: State) => s.z;

      const combined = combineSelectors<State, [number, number, number], number>(
        [selectX, selectY, selectZ],
        (x, y, z) => x + y + z
      );

      expect(combined({ x: 1, y: 2, z: 3 })).toBe(6);
    });
  });
});
