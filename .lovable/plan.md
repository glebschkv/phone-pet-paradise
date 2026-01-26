
## Update Meadow Ground Level to 19%

### Problem Identified
You're seeing **8%** ground level for Meadow because the app is using the default fallback value. While the database file shows `16.15`, there may be caching or build issues preventing it from taking effect. We'll update it to your requested **19%** and ensure the build errors are also fixed.

---

### Changes Overview

**1. Update Meadow ground level**
- File: `src/data/AnimalDatabase.ts`
- Change: `groundLevel: 16.15` → `groundLevel: 19`

**2. Fix build errors (required for changes to deploy)**
The following files have TypeScript errors that need fixing:
- `src/components/shop/tabs/FeaturedTab.tsx` - missing `error` property
- `src/components/shop/tabs/PowerUpsTab.tsx` - missing `error` property

---

### Technical Details

#### Ground Level Change
In `src/data/AnimalDatabase.ts` at line 978:
```typescript
// Before
groundLevel: 16.15

// After  
groundLevel: 19
```

#### Build Error Fixes
Both `FeaturedTab.tsx` and `PowerUpsTab.tsx` reference `result.error` but `PurchaseResult` type doesn't have an `error` property. Will need to either:
- Add `error?: string` to the `PurchaseResult` type, OR
- Change error handling to use the existing `message` field when `success` is false

---

### Updated Ground Levels Reference

| Biome   | Current | After Change |
|---------|---------|--------------|
| Meadow  | 16.15%  | **19%**      |
| Sunset  | 19%     | (no change)  |
| Night   | 19.4%   | (no change)  |
| Forest  | 17.7%   | (no change)  |
| Snow    | 16.1%   | (no change)  |
| City    | 23%     | (no change)  |

---

### Verification
After approval and implementation:
1. The app will rebuild with the fix
2. Press **R** key on home screen to show the ruler
3. Confirm the green "GROUND" line shows **19%** for Meadow
