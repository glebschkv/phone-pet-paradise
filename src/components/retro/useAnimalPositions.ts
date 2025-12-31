import { useRef, useCallback, useMemo } from 'react';

export interface NearbyAnimal {
  id: string;
  position: number;
}

export interface PositionRegistry {
  positions: Map<string, number>;
  updatePosition: (id: string, position: number) => void;
  removePosition: (id: string) => void;
  getNearestAnimal: (id: string, currentPosition: number) => NearbyAnimal | null;
  getAnimalsInRange: (id: string, currentPosition: number, range: number) => NearbyAnimal[];
  getSpeedMultiplier: (id: string, currentPosition: number, baseSpeed: number) => number;
  getSeparationOffset: (id: string, currentPosition: number) => number;
}

/**
 * Hook to create a shared position registry for animals
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
   * Find the nearest animal to the current position
   */
  const getNearestAnimal = useCallback((id: string, currentPosition: number): NearbyAnimal | null => {
    const positions = positionsRef.current;

    if (positions.size <= 1) return null;

    let nearest: NearbyAnimal | null = null;
    let nearestDistance = Infinity;

    positions.forEach((pos, animalId) => {
      if (animalId === id) return;

      const distance = Math.abs(pos - currentPosition);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = { id: animalId, position: pos };
      }
    });

    return nearest;
  }, []);

  /**
   * Get all animals within a certain range
   */
  const getAnimalsInRange = useCallback((id: string, currentPosition: number, range: number): NearbyAnimal[] => {
    const positions = positionsRef.current;
    const result: NearbyAnimal[] = [];

    if (positions.size <= 1) return result;

    positions.forEach((pos, animalId) => {
      if (animalId === id) return;

      const distance = Math.abs(pos - currentPosition);

      if (distance < range) {
        result.push({ id: animalId, position: pos });
      }
    });

    return result;
  }, []);

  // Kept for interface compatibility
  const getSpeedMultiplier = useCallback(() => 1, []);
  const getSeparationOffset = useCallback(() => 0, []);

  return useMemo(() => ({
    positions: positionsRef.current,
    updatePosition,
    removePosition,
    getNearestAnimal,
    getAnimalsInRange,
    getSpeedMultiplier,
    getSeparationOffset,
  }), [updatePosition, removePosition, getNearestAnimal, getAnimalsInRange, getSpeedMultiplier, getSeparationOffset]);
}

/**
 * Same concept for flying animals
 */
export function useFlyingPositionRegistry(): PositionRegistry {
  const positionsRef = useRef<Map<string, number>>(new Map());

  const updatePosition = useCallback((id: string, position: number) => {
    positionsRef.current.set(id, position);
  }, []);

  const removePosition = useCallback((id: string) => {
    positionsRef.current.delete(id);
  }, []);

  const getNearestAnimal = useCallback((id: string, currentPosition: number): NearbyAnimal | null => {
    const positions = positionsRef.current;

    if (positions.size <= 1) return null;

    let nearest: NearbyAnimal | null = null;
    let nearestDistance = Infinity;

    positions.forEach((pos, animalId) => {
      if (animalId === id) return;

      const distance = Math.abs(pos - currentPosition);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = { id: animalId, position: pos };
      }
    });

    return nearest;
  }, []);

  const getAnimalsInRange = useCallback((id: string, currentPosition: number, range: number): NearbyAnimal[] => {
    const positions = positionsRef.current;
    const result: NearbyAnimal[] = [];

    if (positions.size <= 1) return result;

    positions.forEach((pos, animalId) => {
      if (animalId === id) return;

      const distance = Math.abs(pos - currentPosition);

      if (distance < range) {
        result.push({ id: animalId, position: pos });
      }
    });

    return result;
  }, []);

  const getSpeedMultiplier = useCallback(() => 1, []);
  const getSeparationOffset = useCallback(() => 0, []);

  return useMemo(() => ({
    positions: positionsRef.current,
    updatePosition,
    removePosition,
    getNearestAnimal,
    getAnimalsInRange,
    getSpeedMultiplier,
    getSeparationOffset,
  }), [updatePosition, removePosition, getNearestAnimal, getAnimalsInRange, getSpeedMultiplier, getSeparationOffset]);
}
