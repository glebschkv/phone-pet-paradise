import { useRef, useCallback, useMemo } from 'react';

// Minimum distance between animals (as fraction of screen width)
const MIN_DISTANCE = 0.12;

// Speed adjustment factors
const SLOW_DOWN_FACTOR = 0.3;  // Slow to 30% when too close
const SPEED_UP_FACTOR = 1.4;   // Speed up to 140% when far apart
const NORMAL_DISTANCE = 0.2;   // Distance at which speed is normal

export interface PositionRegistry {
  positions: Map<string, number>;
  updatePosition: (id: string, position: number) => void;
  removePosition: (id: string) => void;
  getSpeedMultiplier: (id: string, currentPosition: number, baseSpeed: number) => number;
}

/**
 * Hook to create a shared position registry for animals
 * This allows animals to be aware of each other's positions and maintain spacing
 */
export function useAnimalPositionRegistry(): PositionRegistry {
  const positionsRef = useRef<Map<string, number>>(new Map());

  const updatePosition = useCallback((id: string, position: number) => {
    positionsRef.current.set(id, position);
  }, []);

  const removePosition = useCallback((id: string) => {
    positionsRef.current.delete(id);
  }, []);

  /**
   * Calculate speed multiplier based on distance to nearest animal ahead
   * - If too close to animal ahead: slow down
   * - If far from animal ahead: speed up slightly
   * - Otherwise: normal speed
   */
  const getSpeedMultiplier = useCallback((id: string, currentPosition: number, baseSpeed: number) => {
    const positions = positionsRef.current;

    if (positions.size <= 1) return 1; // No other animals, normal speed

    let nearestAheadDistance = Infinity;
    let nearestBehindDistance = Infinity;

    positions.forEach((pos, animalId) => {
      if (animalId === id) return;

      // Calculate distance considering screen wrap
      // Animals ahead are at higher positions (to the right)
      let distanceAhead = pos - currentPosition;
      let distanceBehind = currentPosition - pos;

      // Handle wrap-around: if distance is negative, add 1.3 (full screen + margins)
      if (distanceAhead < 0) distanceAhead += 1.3;
      if (distanceBehind < 0) distanceBehind += 1.3;

      if (distanceAhead < nearestAheadDistance) {
        nearestAheadDistance = distanceAhead;
      }
      if (distanceBehind < nearestBehindDistance) {
        nearestBehindDistance = distanceBehind;
      }
    });

    // If too close to animal ahead, slow down significantly
    if (nearestAheadDistance < MIN_DISTANCE) {
      // The closer we are, the more we slow down
      const closeness = 1 - (nearestAheadDistance / MIN_DISTANCE);
      return SLOW_DOWN_FACTOR + (1 - SLOW_DOWN_FACTOR) * (1 - closeness);
    }

    // If there's a lot of space ahead but animal behind is close, speed up
    if (nearestAheadDistance > NORMAL_DISTANCE && nearestBehindDistance < MIN_DISTANCE) {
      return SPEED_UP_FACTOR;
    }

    // Normal speed
    return 1;
  }, []);

  return useMemo(() => ({
    positions: positionsRef.current,
    updatePosition,
    removePosition,
    getSpeedMultiplier,
  }), [updatePosition, removePosition, getSpeedMultiplier]);
}

/**
 * Same concept for flying animals but with height consideration
 */
export function useFlyingPositionRegistry(): PositionRegistry {
  const positionsRef = useRef<Map<string, number>>(new Map());

  const updatePosition = useCallback((id: string, position: number) => {
    positionsRef.current.set(id, position);
  }, []);

  const removePosition = useCallback((id: string) => {
    positionsRef.current.delete(id);
  }, []);

  const getSpeedMultiplier = useCallback((id: string, currentPosition: number, baseSpeed: number) => {
    const positions = positionsRef.current;

    if (positions.size <= 1) return 1;

    let nearestAheadDistance = Infinity;

    positions.forEach((pos, animalId) => {
      if (animalId === id) return;

      let distanceAhead = pos - currentPosition;
      if (distanceAhead < 0) distanceAhead += 1.4; // Wrap distance for flying

      if (distanceAhead < nearestAheadDistance) {
        nearestAheadDistance = distanceAhead;
      }
    });

    // Flying animals have slightly larger minimum distance
    const flyingMinDistance = 0.15;

    if (nearestAheadDistance < flyingMinDistance) {
      const closeness = 1 - (nearestAheadDistance / flyingMinDistance);
      return SLOW_DOWN_FACTOR + (1 - SLOW_DOWN_FACTOR) * (1 - closeness);
    }

    return 1;
  }, []);

  return useMemo(() => ({
    positions: positionsRef.current,
    updatePosition,
    removePosition,
    getSpeedMultiplier,
  }), [updatePosition, removePosition, getSpeedMultiplier]);
}
