# Creature Animation Redesign Plan

## Current State Analysis

### What Exists
- **83 creatures** across 5 biomes (Meadow, Sunset, Night, Snow, Forest)
- **381 sprite files** with varying quality and styles
- Sprites range from 28x28px (small) to 512x256px (dragons)
- Mix of different art styles - not cohesive

### Problems Identified
1. **Inconsistent Art Styles**: Sprites come from different sources with varying aesthetics
2. **Quality Variance**: Some sprites are detailed (Cat, Dragons), others are basic
3. **Theme Mismatch**: The forest_fairy, frost_prince, shadow_ninja examples show humanoid characters that don't fit a "pet paradise" vibe
4. **Scale Inconsistency**: Frame sizes vary wildly (28px to 256px)

---

## Redesign Strategy

### Core Theme: "Chibi Fantasy Companions"
A cohesive style featuring:
- **Cute, chibi-style bipedal characters**
- **Consistent 64x64px frame size** for all creatures
- **Warm, friendly color palettes** per biome
- **Simple but expressive animations**
- **2-legged characters** (tested to work best with PixelLab)

### Art Direction
- **Style**: Chibi pixel art with big heads, small bodies
- **Outline**: 1px black outline for all characters
- **Colors**: Limited palette (8-12 colors per sprite)
- **Animation**: 4-8 frame walk cycles
- **Mood**: Cute, friendly, approachable

### Biome Color Themes
| Biome | Primary Colors | Vibe |
|-------|---------------|------|
| Meadow | Greens, yellows, soft browns | Fresh, cheerful |
| Sunset | Oranges, golds, warm reds | Cozy, magical |
| Night | Purples, blues, silver | Mysterious, calm |
| Snow | Ice blues, whites, soft pinks | Serene, sparkly |
| Forest | Deep greens, browns, earth tones | Natural, grounded |

---

## Creature Categories (2-Legged Focus)

### Tier 1: Common Companions (Levels 0-10)
Simple, cute creatures that are easy to generate consistently:
1. **Slime Buddy** - Bouncy blob with eyes and tiny legs
2. **Mushroom Friend** - Walking mushroom with face
3. **Leaf Sprite** - Small nature spirit
4. **Star Wisp** - Floating star creature
5. **Cloud Puff** - Fluffy cloud with legs

### Tier 2: Rare Companions (Levels 11-20)
More detailed characters:
1. **Fire Imp** - Small flame creature
2. **Frost Sprite** - Ice elemental
3. **Shadow Pixie** - Dark but cute spirit
4. **Garden Gnome** - Tiny helper
5. **Crystal Golem** - Gem creature

### Tier 3: Epic Companions (Levels 21-30)
Impressive characters with more detail:
1. **Phoenix Chick** - Baby fire bird
2. **Dragon Hatchling** - Cute baby dragon
3. **Moon Rabbit** - Mystical bunny
4. **Thunder Kit** - Electric fox spirit
5. **Rose Guardian** - Flower knight

### Tier 4: Legendary Companions (Levels 31+)
Premium, highly detailed characters:
1. **Celestial Spirit** - Angelic creature
2. **Shadow Dragon** - Dark but cute dragon
3. **Aurora Fox** - Rainbow-tailed spirit
4. **King Slime** - Crown-wearing slime
5. **Ancient Tree Spirit** - Forest deity

---

## PixelLab Generation Strategy

### Optimal Prompt Structure
```
[Style] [Character Type] [Key Features] [Action] [Mood]
```

### Example Prompts (Tested Format)
```
"chibi pixel art, cute slime creature with tiny legs, green body, big friendly eyes, walking animation, happy expression, 64x64 sprite sheet, 6 frames, side view, transparent background"
```

### Generation Parameters
- **Frame Size**: 64x64 pixels
- **Frame Count**: 6-8 frames for walk cycle
- **Direction**: Side view (facing right)
- **Background**: Transparent
- **Style Keywords**: "chibi", "cute", "pixel art", "simple"

### Quality Control Checklist
- [ ] Consistent outline thickness
- [ ] Clear silhouette
- [ ] Smooth animation transitions
- [ ] Transparent background
- [ ] Appropriate detail level for size
- [ ] Matches biome color theme

---

## Implementation Phases

### Phase 1: Test Generation (Today)
- Create 1 test creature using refined prompts
- Validate PixelLab output quality
- Adjust prompt strategy based on results

### Phase 2: Core Set (5 Creatures)
- 1 creature per biome
- Establish visual baseline
- Refine generation workflow

### Phase 3: Full Common Tier (15 Creatures)
- 3 common creatures per biome
- Build consistent library

### Phase 4: Rare & Epic Tiers (30 Creatures)
- More complex characters
- Special animations

### Phase 5: Legendary Tier & Polish (15+ Creatures)
- Premium creatures
- Special effects
- Animation refinements

---

## Technical Integration

### File Structure
```
/public/assets/sprites/companions/
  /meadow/
    slime_buddy_walk.png
    slime_buddy_idle.png
  /sunset/
    fire_imp_walk.png
    fire_imp_idle.png
  ...
```

### AnimalDatabase Entry Format
```typescript
{
  id: 'slime-buddy',
  name: 'Slime Buddy',
  emoji: '🟢',
  rarity: 'common',
  unlockLevel: 0,
  description: 'A bouncy little slime that hops alongside you during focus sessions.',
  abilities: ['Bounce', 'Stretch', 'Jiggle'],
  biome: 'Meadow',
  spriteConfig: {
    spritePath: '/assets/sprites/companions/meadow/slime_buddy_walk.png',
    frameCount: 6,
    frameWidth: 64,
    frameHeight: 64,
    animationSpeed: 10
  }
}
```

---

## Next Step: Test Creature

Creating a **Slime Buddy** as the first test:
- Simple shape (easy for AI to generate consistently)
- 2-legged (works best with PixelLab)
- Green color (meadow biome)
- 6-frame walk cycle
