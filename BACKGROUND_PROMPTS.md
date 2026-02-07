# Background Generation Prompts for Phone Pet Paradise

## Technical Specifications
- **Resolution:** 1440 x 803 pixels (16:9 landscape)
- **Platform zone:** Bottom ~15% = flat, level walkway, full width
- **Style:** Detailed 16-bit pixel art (SNES/GBA era)
- **Rendering:** `backgroundSize: cover`, `backgroundPosition: center bottom`, `imageRendering: pixelated`
- **Phone cropping:** Only center ~30% of width visible on portrait phones. Center all important elements.
- **Target groundLevel:** 15 (all biomes unified)

---

## Prompt 1: Spring Meadow (replaces Meadow biome)

```
Pixel art 2D side-scrolling game background, 1440x803 pixels, 16-bit SNES era style with rich detail and clean pixel work.

COMPOSITION LAYOUT - CRITICAL:
- Bottom 15% of the image: a perfectly flat, horizontal cobblestone walking path that spans the entire width edge to edge. The path surface must be completely level with zero slope, zero perspective, and zero height variation. Stone texture with subtle grass growing between the cracks. Small wildflowers dot the very edge of the path but do not obstruct it.
- Above the path: a lush spring meadow scene viewed from a pure side-on 2D perspective.

BACKGROUND SCENE (above the path):
- Far background: Soft rolling green hills with distant snow-capped mountains, a pale blue sky with fluffy white cumulus clouds, a warm golden sun.
- Mid-ground (centered): A gentle stream with a small arched stone bridge, a few cherry blossom trees in full pink bloom with petals drifting in the air. A cozy cottage with a thatched roof nestled among the trees.
- Foreground edges only: Tall grass and flowers framing the left and right edges, but NOT on the walking path itself.

COLOR PALETTE: Bright spring greens, soft pinks from cherry blossoms, sky blues, warm yellows, cream whites. Cheerful and inviting.

STYLE: Detailed pixel art with visible pixel texture, limited but rich color palette, subtle dithering for gradients, no anti-aliasing. Inspired by classic SNES/GBA RPG overworld backgrounds. NO 3D perspective anywhere. Pure flat 2D side-scrolling composition.
```

---

## Prompt 2: Enchanted Forest (replaces Forest/Jungle biome)

```
Pixel art 2D side-scrolling game background, 1440x803 pixels, 16-bit SNES era style with rich detail and clean pixel work.

COMPOSITION LAYOUT - CRITICAL:
- Bottom 15% of the image: a perfectly flat, horizontal wooden plank boardwalk that spans the entire width edge to edge. The boardwalk surface must be completely level with zero slope, zero perspective, and zero height variation. Weathered dark wood planks with small glowing mushrooms growing along the very edge as decoration, but the walking surface itself is clear and unobstructed.
- Above the boardwalk: a magical enchanted forest scene viewed from a pure side-on 2D perspective.

BACKGROUND SCENE (above the boardwalk):
- Far background: Dense dark forest canopy with rays of soft green-gold light filtering through the leaves, creating god rays. Distant giant ancient trees with thick trunks disappearing into mist.
- Mid-ground (centered): Massive ancient tree trunks with bioluminescent blue and teal mushrooms growing on them, hanging vines with tiny glowing fireflies, a small fairy circle of mushrooms. Soft magical particles floating in the air.
- Foreground edges only: Large fern leaves and mossy roots framing the left and right sides, but NOT blocking the boardwalk.

COLOR PALETTE: Deep forest greens, rich emeralds, bioluminescent teals and blues, warm amber god rays, dark brown bark, touches of purple in the shadows. Mysterious and magical atmosphere.

STYLE: Detailed pixel art with visible pixel texture, limited but rich color palette, subtle dithering for gradients and light effects, no anti-aliasing. Inspired by classic SNES/GBA RPG forest areas. NO 3D perspective anywhere. Pure flat 2D side-scrolling composition.
```

---

## Prompt 3: Golden Autumn Village (replaces Sunset/Autumn biome)

```
Pixel art 2D side-scrolling game background, 1440x803 pixels, 16-bit SNES era style with rich detail and clean pixel work.

COMPOSITION LAYOUT - CRITICAL:
- Bottom 15% of the image: a perfectly flat, horizontal brick walking path that spans the entire width edge to edge. The path surface must be completely level with zero slope, zero perspective, and zero height variation. Warm reddish-brown bricks in a herringbone pattern with a few scattered fallen autumn leaves resting on the surface as subtle decoration only.
- Above the path: a cozy autumn village scene during golden hour, viewed from a pure side-on 2D perspective.

BACKGROUND SCENE (above the path):
- Far background: A golden sunset sky with warm orange, pink, and purple gradients. Distant rolling hills covered in autumn foliage in reds, oranges, and golds. Birds flying in a V formation silhouetted against the sunset.
- Mid-ground (centered): Quaint village buildings with warm lit windows and smoking chimneys, a clock tower, autumn maple trees with brilliant red and orange leaves gently falling. A stone well or fountain in the village square. Warm lantern light glowing from street lamps.
- Foreground edges only: A wooden fence with pumpkins and hay bales on the far left and right edges framing the scene, but NOT on the walking path.

COLOR PALETTE: Rich burnt oranges, deep crimsons, warm golds, amber yellows, cozy warm browns, sunset pinks and purples. Warm, nostalgic, and cozy atmosphere.

STYLE: Detailed pixel art with visible pixel texture, limited but rich color palette, subtle dithering for gradients and warm lighting effects, no anti-aliasing. Inspired by classic SNES/GBA RPG autumn town areas. NO 3D perspective anywhere. Pure flat 2D side-scrolling composition.
```

---

## Prompt 4: Moonlit Night (replaces Night/Lavender biome)

```
Pixel art 2D side-scrolling game background, 1440x803 pixels, 16-bit SNES era style with rich detail and clean pixel work.

COMPOSITION LAYOUT - CRITICAL:
- Bottom 15% of the image: a perfectly flat, horizontal dark stone slab walkway that spans the entire width edge to edge. The walkway surface must be completely level with zero slope, zero perspective, and zero height variation. Smooth dark grey-blue stone slabs with a subtle blue-purple sheen from the moonlight. Tiny glowing crystal fragments embedded in the stone edges as decoration only.
- Above the walkway: a serene moonlit night scene viewed from a pure side-on 2D perspective.

BACKGROUND SCENE (above the walkway):
- Far background: A deep dark navy sky filled with stars and constellations, the Milky Way stretching across the sky as a band of soft purple-blue light. Northern lights (aurora borealis) with soft green and purple ribbons.
- Mid-ground (centered): A large luminous full moon reflecting off a calm lake or pond. Silhouetted dark rolling hills and distant mountain ridges. Soft moonlight casting silver-blue light across everything. A few dark pine tree silhouettes and a small stone tower or lighthouse on a hill.
- Foreground edges only: Tall ornamental grasses and lavender bushes with fireflies glowing softly on the far left and right, but NOT on the walking path.

COLOR PALETTE: Deep navy blues, midnight purples, silver moonlight whites, soft teal and green aurora tones, warm yellow-orange firefly dots. Peaceful, ethereal, and dreamy atmosphere.

STYLE: Detailed pixel art with visible pixel texture, limited but rich color palette, subtle dithering for gradients and moonlight glow effects, no anti-aliasing. Inspired by classic SNES/GBA RPG nighttime areas. NO 3D perspective anywhere. Pure flat 2D side-scrolling composition.
```

---

## After Generating: Code Changes Needed

Normalize all `groundLevel` values in `src/data/AnimalDatabase.ts` to `15` (or whatever value best matches where the platform sits in the new images):

```typescript
// All biomes should use the same groundLevel:
groundLevel: 15
```

Current inconsistent values: Meadow=10, Snow=18, Night=22.5, Forest=10, Sunset=14, City=19
