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

interface SortedEntry {
  id: string;
  position: number;
}

/**
 * Binary search to find insertion index for a position in a sorted array
 * Returns the index where the position should be inserted to maintain sort order
 */
function binarySearchInsertIndex(sortedArray: SortedEntry[], position: number): number {
  let low = 0;
  let high = sortedArray.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    if (sortedArray[mid].position < position) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

/**
 * Factory function to create a position registry hook
 * Eliminates code duplication between ground and flying animal registries
 */
function createPositionRegistryHook(): () => PositionRegistry {
  return function usePositionRegistry(): PositionRegistry {
    const positionsRef = useRef<Map<string, number>>(new Map());
    // Maintain a sorted array for O(log n) nearest neighbor lookups
    const sortedPositionsRef = useRef<SortedEntry[]>([]);

    const updatePosition = useCallback((id: string, position: number) => {
      const positions = positionsRef.current;
      const sorted = sortedPositionsRef.current;
      const oldPosition = positions.get(id);

      // Remove old entry from sorted array if exists
      if (oldPosition !== undefined) {
        const oldIndex = sorted.findIndex(e => e.id === id);
        if (oldIndex !== -1) {
          sorted.splice(oldIndex, 1);
        }
      }

      // Update map
      positions.set(id, position);

      // Insert into sorted array at correct position
      const insertIndex = binarySearchInsertIndex(sorted, position);
      sorted.splice(insertIndex, 0, { id, position });
    }, []);

    const removePosition = useCallback((id: string) => {
      const positions = positionsRef.current;
      const sorted = sortedPositionsRef.current;

      if (positions.has(id)) {
        positions.delete(id);
        const index = sorted.findIndex(e => e.id === id);
        if (index !== -1) {
          sorted.splice(index, 1);
        }
      }
    }, []);

    /**
     * Find the nearest animal to the current position using binary search
     * O(log n) complexity instead of O(n)
     */
    const getNearestAnimal = useCallback((id: string, currentPosition: number): NearbyAnimal | null => {
      const sorted = sortedPositionsRef.current;

      if (sorted.length <= 1) return null;

      // Find insertion point using binary search
      const insertIndex = binarySearchInsertIndex(sorted, currentPosition);

      let nearest: NearbyAnimal | null = null;
      let nearestDistance = Infinity;

      // Check neighbors around the insertion point (at most 2-3 candidates)
      const candidates: number[] = [];
      if (insertIndex > 0) candidates.push(insertIndex - 1);
      if (insertIndex < sorted.length) candidates.push(insertIndex);
      if (insertIndex + 1 < sorted.length) candidates.push(insertIndex + 1);
      if (insertIndex > 1) candidates.push(insertIndex - 2);

      for (const idx of candidates) {
        const entry = sorted[idx];
        if (entry.id === id) continue;

        const distance = Math.abs(entry.position - currentPosition);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = { id: entry.id, position: entry.position };
        }
      }

      return nearest;
    }, []);

    /**
     * Get all animals within a certain range using binary search
     * O(log n + k) where k is the number of results
     */
    const getAnimalsInRange = useCallback((id: string, currentPosition: number, range: number): NearbyAnimal[] => {
      const sorted = sortedPositionsRef.current;
      const result: NearbyAnimal[] = [];

      if (sorted.length <= 1) return result;

      // Find the starting point using binary search
      const minPosition = currentPosition - range;
      const maxPosition = currentPosition + range;
      let startIndex = binarySearchInsertIndex(sorted, minPosition);

      // Scan forward while within range
      for (let i = startIndex; i < sorted.length; i++) {
        const entry = sorted[i];
        if (entry.position > maxPosition) break;
        if (entry.id === id) continue;

        const distance = Math.abs(entry.position - currentPosition);
        if (distance < range) {
          result.push({ id: entry.id, position: entry.position });
        }
      }

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
  };
}

/**
 * Hook to create a shared position registry for ground animals
 */
export const useAnimalPositionRegistry = createPositionRegistryHook();

/**
 * Hook to create a shared position registry for flying animals
 */
export const useFlyingPositionRegistry = createPositionRegistryHook();
