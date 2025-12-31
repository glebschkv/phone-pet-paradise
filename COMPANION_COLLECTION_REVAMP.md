# Companion Collection Visual Revamp Plan

## Vision Statement

Transform "Phone Pet Paradise" into **"Pixel Companions"** - a polished, consistent creature collector with charming humanoid characters generated entirely via PixelLab API.

---

## Part 1: Character Roster Ideas (10 Starter Companions)

### Tier 1: Common Starters
| # | Name | Description | Personality | Visual Hook |
|---|------|-------------|-------------|-------------|
| 1 | **Ember Sprite** | Tiny fire spirit with flickering flame hair | Energetic, eager | Glowing orange body, flame wisps around head |
| 2 | **Dewdrop Slime** | Round blue slime with big sparkly eyes | Shy, gentle | Translucent blue body, water droplet antenna |
| 3 | **Mossy** | Small forest creature covered in leaves | Calm, nurturing | Green fur, mushroom cap hat, leaf accessories |

### Tier 2: Uncommon
| # | Name | Description | Personality | Visual Hook |
|---|------|-------------|-------------|-------------|
| 4 | **Volt Bunny** | Electric rabbit with lightning bolt ears | Hyperactive, zippy | Yellow fur, static electricity sparks, zigzag ears |
| 5 | **Starling** | Night sky creature with constellation patterns | Dreamy, wise | Dark purple body, glowing star freckles, crescent moon horn |
| 6 | **Coral Kid** | Ocean spirit with shell accessories | Playful, bubbly | Pink/teal gradient, seashell crown, bubble trail |

### Tier 3: Rare
| # | Name | Description | Personality | Visual Hook |
|---|------|-------------|-------------|-------------|
| 7 | **Crystal Guardian** | Gem-encrusted protector | Stoic, loyal | Amethyst/quartz body parts, geometric shapes, inner glow |
| 8 | **Shadow Wisp** | Mysterious dark spirit with glowing eyes | Mischievous, sneaky | Black smoky body, bright cyan eyes, purple accents |

### Tier 4: Epic/Legendary
| # | Name | Description | Personality | Visual Hook |
|---|------|-------------|-------------|-------------|
| 9 | **Phoenix Hatchling** | Baby fire bird in humanoid form | Proud, dramatic | Red/gold feathers, small wings, flame crown, ember trail |
| 10 | **Frost Prince** | Ice royalty with crystalline features | Elegant, cool | Pale blue skin, ice crystal crown, snowflake cape, frost breath |

---

## Part 2: Art Style Bible

### Master Style Parameters (PixelLab Settings)
```javascript
const MASTER_STYLE = {
  // Generation settings
  outline: "black",           // Consistent black outlines
  shading: "soft",            // Soft gradient shading (not flat)
  detail: "medium",           // Balance detail vs clarity

  // Size tiers
  sizes: {
    small: { width: 32, height: 32 },   // Common companions
    medium: { width: 48, height: 48 },  // Uncommon/Rare
    large: { width: 64, height: 64 },   // Epic/Legendary
  },

  // Consistent prompt suffixes
  promptSuffix: "chibi proportions, cute expressive face, pixel art game character, side view, transparent background"
};
```

### Color Palette by Element
```
🔥 Fire:    #FF6B35, #F7931E, #FFD23F (orange/yellow warm tones)
💧 Water:   #4ECDC4, #45B7D1, #96E6FF (teal/cyan cool tones)
🌿 Nature:  #7CB342, #8BC34A, #C5E1A5 (greens)
⚡ Electric: #FFE135, #FFF176, #FFEB3B (yellows)
🌙 Dark:    #4A148C, #7B1FA2, #CE93D8 (purples)
❄️ Ice:     #B3E5FC, #81D4FA, #E1F5FE (pale blues)
✨ Light:   #FFF8E1, #FFECB3, #FFE082 (warm whites)
🔮 Crystal: #E040FB, #EA80FC, #F8BBD9 (magentas/pinks)
```

### Character Design Rules

1. **Proportions**:
   - Head = 40% of body height (chibi style)
   - Big expressive eyes (20-25% of face)
   - Small cute mouth
   - Stubby limbs

2. **Silhouette Test**:
   - Each character must be recognizable as a silhouette
   - Unique head shape OR accessory OR body shape

3. **Visual Hierarchy**:
   - Common: Simple shapes, 3-4 colors
   - Uncommon: Add one accessory, 4-5 colors
   - Rare: Glowing elements, 5-6 colors
   - Legendary: Particle effects (flames, sparkles), 6+ colors

4. **Consistency Checklist**:
   - [ ] Same outline thickness (1px black)
   - [ ] Same eye style across all characters
   - [ ] Same shading direction (light from top-left)
   - [ ] Same level of detail at same size

---

## Part 3: Animation Strategy

### Animation Types per Character

| Animation | Frames | Use Case | Priority |
|-----------|--------|----------|----------|
| **Idle** | 4-6 | Default state, breathing | Required |
| **Walk** | 8-16 | Moving in parade | Required |
| **Happy** | 6-8 | User interaction, level up | High |
| **Sleep** | 4-6 | Night mode, low energy | Medium |
| **Special** | 8-12 | Unique per character | Low (legendary only) |

### PixelLab Animation Workflow

```
1. Generate base sprite (generate-image-v2)
   ↓
2. Generate walk animation (animate-with-text-v2)
   Action: "walking forward with bouncy steps"
   → 16 frames
   ↓
3. Generate idle animation (animate-with-text-v2)
   Action: "standing still, breathing gently, blinking"
   → 8 frames
   ↓
4. [Optional] Generate happy animation
   Action: "jumping excitedly, celebrating"
   → 8 frames
```

### Frame Reduction Strategy
- Generate 16 frames, use every 2nd frame → 8-frame sheet
- Keeps smooth animation, reduces file size
- All sprite sheets: horizontal strip format

---

## Part 4: Complete Character Categories

### Proposed Full Roster (50 Characters)

#### 🔥 Fire Element (6)
1. Ember Sprite (Common)
2. Lava Pup (Common)
3. Flame Fox (Uncommon)
4. Magma Golem (Rare)
5. Phoenix Hatchling (Epic)
6. Inferno Dragon (Legendary)

#### 💧 Water Element (6)
1. Dewdrop Slime (Common)
2. Bubble Fish (Common)
3. Coral Kid (Uncommon)
4. Tide Turtle (Rare)
5. Ocean Spirit (Epic)
6. Leviathan Prince (Legendary)

#### 🌿 Nature Element (6)
1. Mossy (Common)
2. Sprout Buddy (Common)
3. Flower Fairy (Uncommon)
4. Forest Guardian (Rare)
5. Ancient Treant (Epic)
6. World Tree Spirit (Legendary)

#### ⚡ Electric Element (6)
1. Spark Mite (Common)
2. Volt Bunny (Uncommon)
3. Thunder Cat (Rare)
4. Storm Hawk (Epic)
5. Lightning Lord (Legendary)

#### 🌙 Dark/Shadow Element (6)
1. Shadow Wisp (Common)
2. Bat Buddy (Common)
3. Void Cat (Uncommon)
4. Phantom Knight (Rare)
5. Eclipse Spirit (Epic)
6. Nightmare King (Legendary)

#### ❄️ Ice Element (6)
1. Snowflake (Common)
2. Frost Bunny (Common)
3. Ice Sprite (Uncommon)
4. Glacier Bear (Rare)
5. Frost Prince (Epic)
6. Blizzard Dragon (Legendary)

#### ✨ Light/Celestial Element (6)
1. Starling (Common)
2. Sun Sprite (Common)
3. Moon Rabbit (Uncommon)
4. Angel Kitten (Rare)
5. Aurora Spirit (Epic)
6. Cosmic Guardian (Legendary)

#### 🔮 Crystal/Magic Element (6)
1. Gem Slime (Common)
2. Crystal Guardian (Uncommon)
3. Prism Fairy (Rare)
4. Arcane Scholar (Epic)
5. Infinity Mage (Legendary)

#### 🎭 Special/Unique (4)
1. Lucky Cat (Event exclusive)
2. Robot Buddy (Achievement reward)
3. Ghost Friend (Halloween)
4. Cupid (Valentine's)

---

## Part 5: Prompt Templates

### Base Prompt Structure
```
"[character description], [personality expression], [unique visual elements],
 chibi proportions, cute pixel art game character, expressive eyes,
 [size]x[size] sprite, side view facing right, transparent background"
```

### Example Prompts

**Ember Sprite (Common, 32x32):**
```
"tiny fire spirit with flickering flame hair, energetic happy expression,
 glowing orange body with yellow highlights, small flame wisps floating around head,
 chibi proportions, cute pixel art game character, big sparkly eyes,
 32x32 sprite, side view facing right, transparent background"
```

**Phoenix Hatchling (Epic, 64x64):**
```
"baby phoenix in humanoid form, proud confident pose,
 red and gold feathers covering body, small cute wings on back,
 flame crown on head, ember particles trailing behind,
 chibi proportions, cute pixel art game character, fierce but adorable eyes,
 64x64 sprite, side view facing right, transparent background"
```

**Crystal Guardian (Rare, 48x48):**
```
"gem-encrusted guardian creature, stoic protective stance,
 body made of purple amethyst and clear quartz crystals,
 geometric crystal shapes on shoulders and head, soft inner glow,
 chibi proportions, cute pixel art game character, glowing eyes,
 48x48 sprite, side view facing right, transparent background"
```

---

## Part 6: Implementation Roadmap

### Phase 1: Foundation (Generate Core Set)
**Goal:** 10 polished starter companions with walk animations

1. Generate all 10 starter base sprites
2. Generate walk animations (16 frames each)
3. Create sprite sheets
4. Test in app
5. Iterate on art style if needed

**API Calls Estimate:** ~30 calls (10 sprites + 10 walk anims + retries)

### Phase 2: Expand Roster
**Goal:** Complete 50-character roster

1. Generate remaining 40 characters by element
2. Prioritize: Base sprite + Walk for all
3. Add Idle animations for Rare+ tiers
4. Add Special animations for Legendary tier

**API Calls Estimate:** ~150 calls

### Phase 3: Polish & Consistency Pass
**Goal:** Ensure visual consistency across all characters

1. Review all sprites side-by-side
2. Identify outliers (wrong style, colors off)
3. Regenerate inconsistent sprites with adjusted prompts
4. Color correction if needed

### Phase 4: UI Asset Generation
**Goal:** Consistent UI elements

1. Generate UI icons using same style
2. Create element badges
3. Create rarity frames/borders
4. Background elements (if needed)

### Phase 5: Animation Expansion
**Goal:** Full animation sets for top-tier characters

1. Happy animations for all Rare+
2. Sleep animations for all
3. Special unique animations for Legendaries
4. Particle effect overlays

---

## Part 7: Technical Integration

### File Structure
```
public/assets/
├── companions/
│   ├── fire/
│   │   ├── ember_sprite/
│   │   │   ├── base.png
│   │   │   ├── walk.png (sprite sheet)
│   │   │   ├── idle.png
│   │   │   └── config.json
│   │   └── phoenix_hatchling/
│   │       └── ...
│   ├── water/
│   ├── nature/
│   └── ...
├── ui/
│   ├── element_icons/
│   ├── rarity_frames/
│   └── buttons/
└── backgrounds/
```

### Companion Config Schema
```typescript
interface CompanionConfig {
  id: string;
  name: string;
  element: 'fire' | 'water' | 'nature' | 'electric' | 'dark' | 'ice' | 'light' | 'crystal';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

  sprites: {
    base: string;
    walk: { path: string; frames: number; fps: number; };
    idle?: { path: string; frames: number; fps: number; };
    happy?: { path: string; frames: number; fps: number; };
    special?: { path: string; frames: number; fps: number; };
  };

  size: { width: number; height: number; };
  unlockLevel: number;
  description: string;
}
```

### Database Migration
1. Create new `CompanionDatabase.ts` with new schema
2. Keep old `AnimalDatabase.ts` as backup
3. Update components to use new database
4. Gradual rollout: show new companions alongside old

---

## Part 8: Quality Checklist

### Per-Character Checklist
- [ ] Base sprite looks good at intended size
- [ ] Silhouette is unique and recognizable
- [ ] Colors match element palette
- [ ] Eyes are expressive and consistent style
- [ ] Walk animation is smooth (no jarring frames)
- [ ] Transparent background (no artifacts)
- [ ] Matches rarity expectations (detail level)

### Overall Consistency Checklist
- [ ] All characters same outline thickness
- [ ] All characters same shading direction
- [ ] Eye style consistent across roster
- [ ] Size tiers are visually distinct
- [ ] Element colors are consistent
- [ ] Rarity progression feels right

---

## Part 9: Estimated Costs & Timeline

### API Usage Estimate
| Phase | Characters | Calls per Char | Total Calls | Est. Credits |
|-------|------------|----------------|-------------|--------------|
| Phase 1 | 10 | 3 | 30 | ~60 |
| Phase 2 | 40 | 3 | 120 | ~240 |
| Phase 3 | ~10 retries | 2 | 20 | ~40 |
| Phase 4 | UI elements | - | 20 | ~40 |
| Phase 5 | Animations | 2 | 50 | ~100 |
| **Total** | | | **~240** | **~480 credits** |

### Timeline (Suggested)
- Phase 1: 1-2 days (test and refine style)
- Phase 2: 3-4 days (batch generation)
- Phase 3: 1 day (review and fixes)
- Phase 4: 1 day (UI assets)
- Phase 5: 2-3 days (extra animations)
- **Total: ~10 days for full visual overhaul**

---

## Summary

This plan transforms the app from a mixed-style pet collector into a **cohesive, polished companion collector** with:

✅ 50 unique humanoid companions
✅ 8 elemental categories
✅ 5 rarity tiers with visual progression
✅ Consistent chibi pixel art style
✅ Smooth 8-16 frame animations
✅ Organized file structure
✅ Scalable system for adding more companions

The PixelLab API workflow (generate-image-v2 → animate-with-text-v2) is proven to work and can produce this entire roster with consistent quality.
