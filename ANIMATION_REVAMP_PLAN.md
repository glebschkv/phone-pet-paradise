# Pet Animation Revamp Plan - PixelLab API Integration

## Executive Summary

Transform the current "decent but generic" pet animations into **iOS App Store hit-quality** visuals by leveraging the PixelLab API for consistent, professional-grade pixel art generation. This plan addresses the current limitations and establishes a cohesive, charming art style.

---

## Current State Analysis

### What We Have
- **84+ pets** across multiple categories (animals, fantasy creatures, NPCs)
- **377 sprite PNGs** with varying quality and style consistency
- Frame-based animation system (8-12 FPS)
- Special animations (Walk, Idle, Run, Jump, Attack)
- Ground/Flying animal distinction
- Collision avoidance and smart movement

### Current Problems
1. **Inconsistent Art Style** - Sprites come from different sources, lacking cohesive aesthetic
2. **Limited Animation Variety** - Most pets only have 4-6 frame walk cycles
3. **Generic Behaviors** - All pets essentially do the same thing
4. **Missing Personality** - No unique idle behaviors, reactions, or charm animations
5. **No Emotional Connection** - Pets don't respond to user interaction
6. **Low Frame Counts** - Many animations are jerky (4-6 frames vs ideal 8-12)

---

## PixelLab API Integration Strategy

### Phase 1: Art Style Standardization

#### 1.1 Define Master Art Style
Create a **style reference image** that all generated sprites will follow:

```typescript
// New file: src/config/artStyleConfig.ts
export const MASTER_ART_STYLE = {
  // PixelLab generation parameters
  outline: "black",           // Consistent black outlines
  shading: "soft",            // Soft gradient shading
  detail: "medium",           // Not too simple, not cluttered
  view: "side",               // Side-view for parade format

  // Size tiers for different pet types
  sizes: {
    tiny: { width: 32, height: 32 },    // Small creatures (bugs, birds)
    small: { width: 48, height: 48 },   // Regular animals (cats, dogs)
    medium: { width: 64, height: 64 },  // Larger animals (horses, bears)
    large: { width: 96, height: 96 },   // Boss creatures (dragons, bosses)
  },

  // Color palette for consistency
  palette: {
    primary: ["#FFE4C4", "#D2691E", "#8B4513"],  // Warm creature tones
    accent: ["#FF6B6B", "#4ECDC4", "#45B7D1"],   // Pop colors
    shadow: ["#2C3E50", "#34495E"],              // Shadow tones
  }
};
```

#### 1.2 Regenerate Core Pet Sprites
Use PixelLab's `create-character-with-4-directions` endpoint to regenerate all pets with consistent style:

**API Call Pattern:**
```typescript
POST /v2/create-character-with-4-directions
{
  "description": "cute pixel art hamster, round body, tiny legs, pink nose, chibi style",
  "image_size": { "width": 48, "height": 48 },
  "text_guidance_scale": 8.0,
  "outline": "black",
  "shading": "soft",
  "detail": "medium",
  "seed": 12345  // For reproducibility
}
```

---

### Phase 2: Animation Enrichment

#### 2.1 Animation Template Mapping
Map PixelLab animation templates to pet behaviors:

| Pet Type | Required Animations | PixelLab Templates |
|----------|--------------------|--------------------|
| **All Pets** | Walk, Idle | `walk-cycle`, `breathing-idle` |
| **Cute Creatures** | Walk, Idle, Sleep, Eat, Happy | `breathing-idle`, `eating`, custom |
| **Warriors/Knights** | Walk, Idle, Attack, Block | `fight-stance-idle`, `cross-punch` |
| **Dragons** | Walk, Idle, Fly, Fire Breath | `flying-kick` (modified), `fireball` |
| **Slimes** | Bounce, Idle, Split, Merge | Custom skeleton animations |
| **Birds** | Fly, Glide, Land, Peck | Custom with `animate-with-skeleton` |

#### 2.2 New Animation Categories

```typescript
// New file: src/data/AnimationCategories.ts
export const ANIMATION_CATEGORIES = {
  // MOVEMENT (every pet needs these)
  movement: {
    walk: { frames: 8, loop: true, fps: 10 },
    run: { frames: 8, loop: true, fps: 16 },
    idle: { frames: 6, loop: true, fps: 4 },
  },

  // PERSONALITY (what makes pets charming)
  personality: {
    happy: { frames: 8, loop: false, fps: 12 },      // Tail wag, bounce
    sleepy: { frames: 12, loop: true, fps: 3 },      // Yawn, nod off
    curious: { frames: 6, loop: false, fps: 8 },     // Look around, sniff
    excited: { frames: 10, loop: false, fps: 14 },   // Jump, spin
  },

  // INTERACTION (response to user)
  interaction: {
    pet: { frames: 8, loop: false, fps: 10 },        // Being petted
    feed: { frames: 12, loop: false, fps: 8 },       // Eating
    play: { frames: 16, loop: false, fps: 12 },      // Playing with toy
    love: { frames: 8, loop: false, fps: 10 },       // Hearts, affection
  },

  // SPECIAL (unique per pet type)
  special: {
    attack: { frames: 8, loop: false, fps: 14 },
    skill: { frames: 12, loop: false, fps: 12 },
    transform: { frames: 16, loop: false, fps: 10 },
  }
};
```

#### 2.3 Generate Rich Animation Sets
For each pet, generate using `animate-with-text`:

```typescript
// Example: Generate "happy" animation for House Cat
POST /v2/animate-with-text
{
  "image": "[base64 of cat idle sprite]",
  "image_size": { "width": 48, "height": 48 },
  "action": "happy cat wagging tail and bouncing excitedly",
  "frame_count": 8,
  "text_guidance_scale": 7.0,
  "no_background": true
}
```

---

### Phase 3: Behavioral System Overhaul

#### 3.1 Pet Mood System
Introduce dynamic moods that affect animations:

```typescript
// New file: src/systems/PetMoodSystem.ts
export interface PetMood {
  happiness: number;      // 0-100, affects which idle animations play
  energy: number;         // 0-100, affects movement speed
  affection: number;      // 0-100, affects interaction responses
  lastInteraction: Date;  // When user last interacted
}

export const MOOD_THRESHOLDS = {
  happy: { min: 70, animations: ['happy', 'excited', 'play'] },
  content: { min: 40, animations: ['idle', 'curious', 'walk'] },
  sad: { min: 0, animations: ['sleepy', 'slow_walk', 'lonely'] },
};
```

#### 3.2 Smart Animation Scheduler

```typescript
// Enhanced SpecialAnimations.ts
export const SMART_ANIMATION_RULES = {
  // Time-based behaviors
  timeOfDay: {
    morning: { weight: 1.5, animations: ['stretch', 'yawn', 'energetic'] },
    afternoon: { weight: 1.0, animations: ['play', 'curious', 'walk'] },
    evening: { weight: 0.8, animations: ['sleepy', 'yawn', 'slow_walk'] },
    night: { weight: 0.5, animations: ['sleep', 'dream', 'nightwatch'] },
  },

  // Proximity triggers
  nearOtherPet: {
    friend: ['play_together', 'greet', 'follow'],
    stranger: ['sniff', 'curious', 'cautious'],
    rival: ['growl', 'posture', 'avoid'],
  },

  // Random personality quirks
  quirks: {
    chase_tail: { chance: 0.05, duration: 2000 },
    scratch: { chance: 0.08, duration: 1500 },
    sneeze: { chance: 0.02, duration: 800 },
    stretch: { chance: 0.1, duration: 1200 },
  }
};
```

#### 3.3 Pet Interaction System

```typescript
// New file: src/systems/PetInteractionSystem.ts
export const INTERACTION_TYPES = {
  tap: {
    response: 'pet',
    moodBoost: 5,
    cooldown: 1000,
    particleEffect: 'hearts',
  },
  doubleTap: {
    response: 'excited',
    moodBoost: 10,
    cooldown: 2000,
    particleEffect: 'stars',
  },
  longPress: {
    response: 'love',
    moodBoost: 15,
    cooldown: 3000,
    particleEffect: 'hearts_burst',
  },
  drag: {
    response: 'carry',
    moodBoost: 3,
    allowReposition: true,
  }
};
```

---

### Phase 4: Visual Enhancement Pipeline

#### 4.1 PixelLab Generation Pipeline

Create a backend service to batch-generate sprites:

```typescript
// New file: src/services/PixelLabService.ts
export class PixelLabService {
  private apiKey: string;
  private baseUrl = 'https://api.pixellab.ai/v2';

  // Generate character with all 4 directions
  async generatePetBase(petDescription: string, size: SizeConfig): Promise<CharacterResult> {
    return this.post('/create-character-with-4-directions', {
      description: `cute pixel art ${petDescription}, chibi proportions, expressive eyes, ${MASTER_STYLE}`,
      image_size: size,
      text_guidance_scale: 8.0,
      outline: 'black',
      shading: 'soft',
      seed: null, // Random for variety
    });
  }

  // Generate animation sequence from base character
  async generateAnimation(
    characterId: string,
    template: AnimationTemplate
  ): Promise<AnimationResult> {
    return this.post('/animate-character', {
      character_id: characterId,
      template_animation_id: template.id,
      action: template.action,
      directions: ['east', 'west'], // For side-scrolling parade
    });
  }

  // Text-to-animation for custom behaviors
  async generateCustomAnimation(
    baseImage: string,
    action: string,
    frameCount: number
  ): Promise<AnimationFrames> {
    return this.post('/animate-with-text', {
      image: baseImage,
      action: action,
      frame_count: frameCount,
      no_background: true,
      text_guidance_scale: 7.5,
    });
  }
}
```

#### 4.2 Sprite Sheet Compiler

Combine generated frames into optimized sprite sheets:

```typescript
// New file: src/tools/SpriteSheetCompiler.ts
export async function compileAnimationSheet(
  petId: string,
  animations: GeneratedAnimation[]
): Promise<SpriteSheetData> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Calculate optimal sheet layout
  const layout = calculateOptimalLayout(animations);
  canvas.width = layout.width;
  canvas.height = layout.height;

  // Draw all frames
  for (const anim of animations) {
    for (let i = 0; i < anim.frames.length; i++) {
      const pos = layout.getFramePosition(anim.id, i);
      ctx.drawImage(anim.frames[i], pos.x, pos.y);
    }
  }

  return {
    image: canvas.toDataURL('image/png'),
    config: generateSpriteConfig(layout, animations),
  };
}
```

---

### Phase 5: New Animation Components

#### 5.1 Enhanced SpriteAnimal Component

```typescript
// Refactored: src/components/retro/EnhancedSpriteAnimal.tsx
export const EnhancedSpriteAnimal: React.FC<EnhancedSpriteProps> = memo(({
  animal,
  mood,
  position,
  onInteraction,
}) => {
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>('walk');
  const [isInteracting, setIsInteracting] = useState(false);

  // Smart animation selection based on mood + time + context
  const selectAnimation = useCallback(() => {
    const timeOfDay = getTimeOfDay();
    const moodState = getMoodCategory(mood);
    const nearbyPets = useNearbyPets(position);

    return ANIMATION_SELECTOR.choose({
      mood: moodState,
      time: timeOfDay,
      nearby: nearbyPets,
      quirks: animal.quirks,
    });
  }, [mood, position, animal]);

  // Handle user interactions
  const handleTap = useCallback((e: TouchEvent) => {
    const interactionType = detectInteractionType(e);
    const response = INTERACTION_TYPES[interactionType];

    setCurrentAnimation(response.response);
    onInteraction?.(animal.id, response);

    // Spawn particle effect
    spawnParticles(response.particleEffect, position);

    // Return to regular animation after
    setTimeout(() => {
      setCurrentAnimation(selectAnimation());
    }, response.duration);
  }, [animal, position, onInteraction, selectAnimation]);

  // ... rest of component
});
```

#### 5.2 Particle Effects System

Add juice with particle effects:

```typescript
// New file: src/systems/ParticleEffects.ts
export const PARTICLE_PRESETS = {
  hearts: {
    emoji: '❤️',
    count: 5,
    spread: 30,
    duration: 1000,
    animation: 'float-up-fade',
  },
  stars: {
    emoji: '⭐',
    count: 8,
    spread: 50,
    duration: 800,
    animation: 'burst-sparkle',
  },
  zzz: {
    emoji: '💤',
    count: 3,
    spread: 20,
    duration: 2000,
    animation: 'float-up-slow',
  },
  music: {
    emoji: '🎵',
    count: 4,
    spread: 40,
    duration: 1200,
    animation: 'wave-float',
  },
};
```

---

### Phase 6: Pet Personality System

#### 6.1 Unique Pet Personalities

```typescript
// New file: src/data/PetPersonalities.ts
export type PersonalityTrait =
  | 'playful' | 'lazy' | 'curious' | 'shy' | 'brave'
  | 'grumpy' | 'friendly' | 'mischievous' | 'noble' | 'goofy';

export const PERSONALITY_MODIFIERS: Record<PersonalityTrait, PersonalityConfig> = {
  playful: {
    baseSpeed: 1.2,
    idleChance: 0.3,      // Less likely to idle
    specialChance: 1.5,    // More likely to do special anims
    preferredAnims: ['play', 'bounce', 'chase'],
    avoidedAnims: ['sleep', 'slow_walk'],
  },
  lazy: {
    baseSpeed: 0.7,
    idleChance: 0.7,
    specialChance: 0.5,
    preferredAnims: ['sleep', 'yawn', 'stretch'],
    avoidedAnims: ['run', 'excited'],
  },
  curious: {
    baseSpeed: 0.9,
    idleChance: 0.4,
    specialChance: 1.2,
    preferredAnims: ['sniff', 'look_around', 'investigate'],
    avoidedAnims: ['sleep'],
    nearbyPetBehavior: 'approach',
  },
  // ... more personalities
};
```

#### 6.2 Pet Memory System

Pets remember interactions:

```typescript
// New file: src/systems/PetMemorySystem.ts
export interface PetMemory {
  petId: string;
  interactions: InteractionHistory[];
  relationships: PetRelationship[];
  favoriteSpot: Position | null;
  lastFed: Date | null;
  totalPets: number;
  mood: PetMood;
}

// Persist to local storage / Supabase
export const petMemoryStorage = {
  save: (memory: PetMemory) => { /* ... */ },
  load: (petId: string) => { /* ... */ },
};
```

---

### Phase 7: Implementation Roadmap

#### Sprint 1: Foundation (Week 1-2)
1. Set up PixelLab API integration service
2. Define master art style configuration
3. Create animation category system
4. Build sprite sheet compiler utility

#### Sprint 2: Asset Generation (Week 2-3)
1. Generate 10 pilot pets with new style
2. Create animation templates for each category
3. Test animation quality and consistency
4. Iterate on art style parameters

#### Sprint 3: Enhanced Components (Week 3-4)
1. Refactor SpriteAnimal component
2. Implement mood system
3. Add interaction handlers
4. Create particle effects system

#### Sprint 4: Personality & Polish (Week 4-5)
1. Implement personality traits
2. Add smart animation scheduling
3. Create pet memory system
4. Fine-tune animation timing

#### Sprint 5: Full Asset Generation (Week 5-6)
1. Generate all 84+ pets with new system
2. Create all animation variants
3. Optimize sprite sheets
4. Performance testing

#### Sprint 6: Final Polish (Week 6-7)
1. Add ambient animations
2. Implement time-of-day behaviors
3. Create pet relationship system
4. Bug fixes and optimization

---

## Technical Specifications

### File Structure Changes

```
src/
├── config/
│   └── artStyleConfig.ts          # NEW: Master art style settings
├── services/
│   └── PixelLabService.ts         # NEW: API integration
├── systems/
│   ├── PetMoodSystem.ts           # NEW: Mood management
│   ├── PetInteractionSystem.ts    # NEW: User interactions
│   ├── PetMemorySystem.ts         # NEW: Persistence
│   └── ParticleEffects.ts         # NEW: Visual juice
├── data/
│   ├── AnimalDatabase.ts          # MODIFIED: Add personality traits
│   ├── AnimationCategories.ts     # NEW: Animation definitions
│   ├── PetPersonalities.ts        # NEW: Personality configs
│   └── SpecialAnimations.ts       # MODIFIED: Enhanced rules
├── components/retro/
│   ├── EnhancedSpriteAnimal.tsx   # NEW: Replaces SpriteAnimal
│   ├── InteractionLayer.tsx       # NEW: Touch handling
│   └── ParticleEmitter.tsx        # NEW: Particle rendering
└── tools/
    └── SpriteSheetCompiler.ts     # NEW: Asset pipeline
```

### API Usage Estimates

| Endpoint | Per Pet | Total (84 pets) | Credits Est. |
|----------|---------|-----------------|--------------|
| create-character-4-directions | 1 | 84 | ~168 |
| animate-character (5 templates) | 5 | 420 | ~840 |
| animate-with-text (custom) | 3 | 252 | ~504 |
| **Total** | **9** | **756** | **~1,512** |

### Performance Targets

- Maintain 60fps animation rendering
- < 2MB total sprite sheet size (compressed)
- < 100ms response to user interaction
- Smooth transitions between animations

---

## Success Metrics

### Quality Indicators
- [ ] Consistent art style across all 84+ pets
- [ ] Each pet has minimum 6 animation types
- [ ] Smooth 8+ frame animations
- [ ] Unique personality behaviors visible

### User Experience Goals
- [ ] Users tap pets to see reactions
- [ ] Pets show different behaviors at different times
- [ ] Emotional connection through personality
- [ ] "Delightful" factor - users share screenshots

### Technical Goals
- [ ] No jank or stuttering
- [ ] All assets load in < 3 seconds
- [ ] Works on iPhone 8 and newer
- [ ] Battery efficient (no excessive redraws)

---

## Priority Pet Regeneration Order

### Tier 1: Most Visible (Generate First)
1. House Cat
2. Loyal Doggo
3. Baby Dragon
4. Golden Fox
5. Fluffy Pupper

### Tier 2: Popular Categories
6-15. All "Cute Creatures"
16-25. All Dragons

### Tier 3: Fill In
26-50. Common/Rare animals
51-70. Fantasy creatures
71-84. NPCs and special characters

---

## Conclusion

This plan transforms basic sprite animations into a **living, breathing pet ecosystem** that:
- Has iOS App Store hit-level visual polish
- Creates emotional connections through personality
- Responds to user interaction meaningfully
- Maintains consistent, charming art style
- Runs smoothly on all target devices

The PixelLab API enables consistent, high-quality sprite generation at scale while the behavioral systems add the depth and charm that makes apps go viral.
