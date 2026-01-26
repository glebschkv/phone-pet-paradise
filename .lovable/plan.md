

## Update Meadow Ground Level to 10%

### Change Summary
Adjust the Meadow biome's floor height from **19%** down to **10%** so pets walk at a lower position on the meadow background.

---

### What Will Change

**File:** `src/data/AnimalDatabase.ts`

In the `BIOME_DATABASE` array, the Meadow biome entry will be updated:

| Property | Before | After |
|----------|--------|-------|
| groundLevel | 19 | **10** |

---

### Technical Details

Single line change at approximately line 978:
```typescript
// Before
groundLevel: 19

// After  
groundLevel: 10
```

---

### Verification
After implementation:
1. The app will rebuild automatically
2. Press **R** key on home screen to show the ruler
3. Confirm the green "GROUND" line shows **10%** for Meadow

