import { useState, useEffect, useRef } from "react";

/**
 * Animates a number from 0 to `target` on mount (or when target changes).
 * Uses easeOutExpo for a satisfying fast-start, slow-finish effect.
 */
export function useAnimatedCounter(
  target: number,
  duration = 800,
  enabled = true
): number {
  const [current, setCurrent] = useState(enabled ? 0 : target);
  const prevTarget = useRef(target);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      setCurrent(target);
      return;
    }

    const from = prevTarget.current === target ? 0 : prevTarget.current;
    prevTarget.current = target;

    const startTime = performance.now();
    const diff = target - from;

    if (diff === 0) {
      setCurrent(target);
      return;
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const value = from + diff * eased;

      setCurrent(Number.isInteger(target) ? Math.round(value) : parseFloat(value.toFixed(1)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, enabled]);

  return current;
}
