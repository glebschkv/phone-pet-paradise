

## Update City Ground Level to 19%

### Change Summary
Adjust the City biome's floor height from **18.5%** to **19%**.

---

### What Will Change

**File:** `src/data/AnimalDatabase.ts`

| Biome | Current | New Value |
|-------|---------|-----------|
| City  | 18.5%   | **19%**   |

---

### Technical Details

Single line change at approximately line 1018:
```typescript
// Before
groundLevel: 18.5

// After  
groundLevel: 19
```

---

### Verification
After implementation:
1. The app will rebuild automatically
2. Press **R** key on home screen to show the ruler
3. Switch to the City biome to confirm the ground line shows **19%**

