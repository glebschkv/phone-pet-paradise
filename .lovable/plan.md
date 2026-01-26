

## Update Multiple Biome Ground Levels

### Changes Summary

Update floor heights for 5 biomes in `src/data/AnimalDatabase.ts`:

| Biome  | Current | New Value |
|--------|---------|-----------|
| Sunset | 19%     | **14%**   |
| Night  | 19.4%   | **22.5%** |
| Forest (Jungle) | 17.7% | **10%** |
| Snow   | 16.1%   | **18%**   |
| City   | 23%     | **18.5%** |

---

### What Will Change

**File:** `src/data/AnimalDatabase.ts`

**Line 986 (Sunset):**
```
Before: groundLevel: 19
After:  groundLevel: 14
```

**Line 994 (Night):**
```
Before: groundLevel: 19.4
After:  groundLevel: 22.5
```

**Line 1002 (Forest/Jungle):**
```
Before: groundLevel: 17.7
After:  groundLevel: 10
```

**Line 1010 (Snow):**
```
Before: groundLevel: 16.1
After:  groundLevel: 18
```

**Line 1018 (City):**
```
Before: groundLevel: 23
After:  groundLevel: 18.5
```

---

### Note
The "Jungle" biome in the database is named "Forest" but uses the jungle background image (`junglerealbackground.png`). This plan updates the Forest biome's ground level to 10 as you requested.

---

### Verification
After implementation:
1. The app will rebuild automatically
2. Press **R** key on home screen to show the ruler
3. Switch through each biome to confirm the ground levels match the new values

