

# Reorder Background Theme Unlock Progression

## Overview

You want to change the order in which background themes are unlocked. The City background also needs to be added to the unlock progression since it currently exists but isn't in the unlockable themes list.

## Current vs New Unlock Order

| Unlock # | Current | New |
|----------|---------|-----|
| 1st (Level 1) | Day (Meadow) | Snow |
| 2nd (Level 3) | Sunset | Night |
| 3rd (Level 5) | Night | Meadow (Day) |
| 4th (Level 8) | Forest | Sunset |
| 5th (Level 12) | Snow | Forest |
| 6th (NEW) | - | City |

## File to Modify

| File | Change |
|------|--------|
| `src/components/focus-timer/constants.ts` | Reorder `BACKGROUND_THEMES` array and add City |

## Implementation Details

**Lines 17-23 in `constants.ts`:**

```typescript
// Before
export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { id: 'sky', name: 'Day', icon: Sun, unlockLevel: 1 },
  { id: 'sunset', name: 'Sunset', icon: Sunset, unlockLevel: 3 },
  { id: 'night', name: 'Night', icon: Moon, unlockLevel: 5 },
  { id: 'forest', name: 'Forest', icon: TreePine, unlockLevel: 8 },
  { id: 'snow', name: 'Snow', icon: Snowflake, unlockLevel: 12 },
];

// After
export const BACKGROUND_THEMES: BackgroundTheme[] = [
  { id: 'snow', name: 'Snow', icon: Snowflake, unlockLevel: 1 },
  { id: 'night', name: 'Night', icon: Moon, unlockLevel: 3 },
  { id: 'sky', name: 'Meadow', icon: Sun, unlockLevel: 5 },
  { id: 'sunset', name: 'Sunset', icon: Sunset, unlockLevel: 8 },
  { id: 'forest', name: 'Forest', icon: TreePine, unlockLevel: 12 },
  { id: 'city', name: 'City', icon: Building2, unlockLevel: 15 },
];
```

**Import update (Line 1):**

Add `Building2` to the lucide-react imports for the City icon.

## Technical Notes

- The `id` values (`sky`, `snow`, `night`, etc.) must match the theme switch cases in `RetroBackground.tsx` - these are already correct
- Renamed "Day" to "Meadow" to better match the biome naming convention
- City added at level 15 as the final unlock (you can adjust this level if needed)
- `Building2` icon is the standard city/building icon from lucide-react

## Verification

After this change:
1. Level 1 users start with Snow background
2. Level 3 unlocks Night
3. Level 5 unlocks Meadow (previously Day)
4. Level 8 unlocks Sunset
5. Level 12 unlocks Forest
6. Level 15 unlocks City (new)

