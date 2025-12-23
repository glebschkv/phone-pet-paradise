# Performance Analysis Report

**Generated:** December 23, 2025
**Analyzed by:** Claude Code

## Summary

Found **19 performance issues** across the codebase:
- **4 Critical** issues requiring immediate attention
- **7 High** severity issues
- **6 Medium** severity issues
- **2 Low** severity issues

---

## Critical Issues

### 1. N+1 Query Pattern - Pet Bond Updates in Loop

**File:** `src/hooks/useBackendAppState.ts`
**Lines:** 160-163

```typescript
const activePets = supabaseData.pets.filter(pet => pet.is_favorite);
for (const pet of activePets) {
  bondSystem.interactWithPet(pet.pet_type, 'focus_session');
}
```

**Problem:** Each pet interaction triggers an individual async operation inside a loop. With 5 pets, this creates 5 sequential API calls.

**Fix:**
```typescript
const activePets = supabaseData.pets.filter(pet => pet.is_favorite);
await Promise.all(
  activePets.map(pet => bondSystem.interactWithPet(pet.pet_type, 'focus_session'))
);
```

---

### 2. Missing useEffect Dependency - Stale Closure

**File:** `src/hooks/useSpecialEvents.ts`
**Lines:** 29-41

```typescript
useEffect(() => {
  const saved = storage.get<SpecialEventsState>(STORAGE_KEYS.SPECIAL_EVENTS);
  if (saved) {
    setState(saved);
  }
  updateEvents();

  const interval = setInterval(updateEvents, 60000);
  return () => clearInterval(interval);
}, []); // Missing updateEvents in dependency
```

**Problem:** `updateEvents` is called in useEffect but not listed in dependencies. The interval will call a stale version of `updateEvents`.

**Fix:** Move `updateEvents` definition inside the effect or wrap with `useCallback` and add to dependencies.

---

### 3. Potential Memory Leak - Callback in Dependency Array

**File:** `src/components/PetInteraction.tsx`
**Lines:** 43-72

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setStats(prevStats => {
      // ...
      onStatsUpdate?.(newStats);
      return newStats;
    });
  }, 60000);

  return () => clearInterval(interval);
}, [onStatsUpdate]); // Callback prop in dependency
```

**Problem:** If `onStatsUpdate` callback changes frequently (parent re-renders), the interval is recreated each time, potentially causing memory leaks.

**Fix:** Use a ref to store the callback:
```typescript
const onStatsUpdateRef = useRef(onStatsUpdate);
useEffect(() => {
  onStatsUpdateRef.current = onStatsUpdate;
}, [onStatsUpdate]);

useEffect(() => {
  const interval = setInterval(() => {
    // ... use onStatsUpdateRef.current instead
  }, 60000);
  return () => clearInterval(interval);
}, []); // No callback dependency
```

---

### 4. Large Callback Dependency Array

**File:** `src/hooks/useBackendAppState.ts`
**Lines:** 86-202

```typescript
const awardXP = useCallback(async (sessionMinutes: number) => {
  // 100+ lines of logic
}, [isAuthenticated, localXPSystem, streaks, quests, bondSystem,
    supabaseData.pets, backendXPSystem, coinSystem, coinBooster]);
```

**Problem:** 8+ dependencies means the callback is recreated frequently, causing unnecessary re-renders in child components.

**Fix:** Split into smaller callbacks or use refs for stable values.

---

## High Severity Issues

### 5. Missing useMemo on Filter Operation

**File:** `src/components/PetCollectionGrid.tsx`
**Line:** 248

```typescript
const filteredPets = filterAnimals(searchQuery, "all", "all");
```

**Problem:** Called on every render without memoization. With 50+ pets, this is expensive.

**Fix:**
```typescript
const filteredPets = useMemo(
  () => filterAnimals(searchQuery, "all", "all"),
  [searchQuery, filterAnimals]
);
```

---

### 6. Missing React.memo on SpritePreview Component

**File:** `src/components/PetCollectionGrid.tsx`
**Lines:** 36-92

```typescript
const SpritePreview = ({ animal, scale = 4 }) => {
  // Complex animation logic with requestAnimationFrame
};
```

**Problem:** SpritePreview renders expensive sprite animations but isn't memoized. Parent grid re-renders cause all sprite previews to re-render.

**Fix:**
```typescript
const SpritePreview = memo(({ animal, scale = 4 }) => {
  // ...
});
```

---

### 7. Inline Style Objects in Loop

**File:** `src/components/PetCollectionGrid.tsx`
**Lines:** 331-338

```typescript
style={{
  border: showAsShopPet ? '2px solid hsl(35 80% 60%)' : '2px solid hsl(var(--border))',
  boxShadow: showAsLocked ? 'none' : '0 3px 0 ...'
}}
```

**Problem:** New style object created on every render for each pet in the grid (50+ items).

**Fix:** Use CSS classes or memoize computed styles:
```typescript
const petStyle = useMemo(() => ({
  border: showAsShopPet ? '2px solid hsl(35 80% 60%)' : '2px solid hsl(var(--border))',
  // ...
}), [showAsShopPet, showAsLocked]);
```

---

### 8. SVG Path Calculations on Every Render

**File:** `src/components/gamification/LuckyWheelModal.tsx`
**Lines:** 145-184

```typescript
{wheelConfig.segments.map((segment, index) => {
  const angle = 360 / wheelConfig.segmentCount;
  const startAngle = index * angle;
  // 10+ trigonometric calculations per segment
  const x1 = 50 + 50 * Math.cos(startRad);
  // ...
})}
```

**Problem:** Complex math calculations run on every render for each wheel segment.

**Fix:**
```typescript
const wheelPaths = useMemo(() =>
  wheelConfig.segments.map((segment, index) => {
    const angle = 360 / wheelConfig.segmentCount;
    // ... all calculations
    return { segment, path, textPosition };
  }),
  [wheelConfig]
);
```

---

### 9. Missing useCallback on Event Handlers

**File:** `src/components/UnifiedFocusTimer.tsx`
**Multiple locations**

**Problem:** Event handlers passed as props are recreated on every render.

**Fix:** Wrap all handler functions with `useCallback`.

---

### 10. O(n) Lookup Inside Filter (O(n²) Total)

**File:** `src/components/retro/RetroPixelPlatform.tsx`
**Lines:** 112-120

```typescript
const activeAnimalData = useMemo(() => {
  return activeHomePets
    .map(id => getAnimalById(id))
    .filter((animal): animal is AnimalData =>
      animal !== undefined &&
      (animal.unlockLevel <= currentLevel || shopOwnedCharacters.includes(animal.id)) && // O(n) lookup
      animal.spriteConfig !== undefined
    );
}, [activeHomePets, currentLevel, shopOwnedCharacters]);
```

**Problem:** `shopOwnedCharacters.includes()` is O(n) for each animal, making the total O(n²).

**Fix:**
```typescript
const shopOwnedSet = useMemo(() => new Set(shopOwnedCharacters), [shopOwnedCharacters]);

const activeAnimalData = useMemo(() => {
  return activeHomePets
    .map(id => getAnimalById(id))
    .filter((animal): animal is AnimalData =>
      animal !== undefined &&
      (animal.unlockLevel <= currentLevel || shopOwnedSet.has(animal.id)) && // O(1) lookup
      animal.spriteConfig !== undefined
    );
}, [activeHomePets, currentLevel, shopOwnedSet]);
```

---

### 11. Repeated JSON.parse in useEffect

**File:** `src/components/PetCollectionGrid.tsx`
**Lines:** 156-166

```typescript
useEffect(() => {
  const loadShopInventory = () => {
    const savedData = localStorage.getItem(SHOP_INVENTORY_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData); // Called on mount + every shop update
    }
  };
  loadShopInventory();
}, []);
```

**Problem:** JSON parsing is relatively expensive and happens multiple times.

**Fix:** Cache parsed results or use a centralized store.

---

## Medium Severity Issues

### 12. Frequent Polling with State Updates

**File:** `src/hooks/useDeviceActivity.ts`

**Problem:** 30-second interval triggers API calls and state updates, causing re-renders.

**Fix:** Use React Query or SWR for smarter caching and deduplication.

---

### 13. Event Listener Accumulation Risk

**File:** `src/components/PetCollectionGrid.tsx`
**Lines:** 179-182

**Problem:** Custom events without proper tracking can accumulate if component mounts/unmounts frequently.

**Fix:** Use a ref to track subscription state.

---

### 14. Uncleared setTimeout Patterns

**File:** `src/hooks/useBackgroundProcessing.ts`

**Problem:** Inline setTimeout without cleanup can cause issues if component unmounts.

**Fix:** Track timeouts in refs and clear on cleanup.

---

### 15-18. Various Minor Optimizations

- Missing AbortController for fetch operations
- Timer updates every second could batch
- Some useCallback dependencies could be optimized

---

## Low Severity Issues

### 19. Large Icon Imports

**File:** `src/components/PetCollectionGrid.tsx` (and others)

```typescript
import { Search, Heart, Lock, TreePine, Snowflake, MapPin, Star, ... } from "lucide-react";
```

**Problem:** 18+ icons imported across many files.

**Fix:** Consider using `@lucide/react` tree-shaking or dynamic imports.

---

## Priority Recommendations

### Immediate (Ship-blocking)
1. Fix N+1 query in `useBackendAppState.ts` - use `Promise.all()`
2. Fix missing dependency in `useSpecialEvents.ts`
3. Memoize `filteredPets` in `PetCollectionGrid.tsx`

### Short-term (This week)
4. Add `React.memo` to `SpritePreview` component
5. Memoize SVG calculations in `LuckyWheelModal.tsx`
6. Convert arrays to Sets for O(1) lookups

### Medium-term (This sprint)
7. Refactor large callback in `useBackendAppState.ts`
8. Add proper refs for callback props
9. Implement AbortController for async operations

---

## Testing Recommendations

After applying fixes, measure performance using:
1. React DevTools Profiler - check re-render counts
2. Chrome DevTools Performance tab - measure FPS during interactions
3. Lighthouse - check overall performance score
4. Bundle analyzer - verify tree-shaking effectiveness
