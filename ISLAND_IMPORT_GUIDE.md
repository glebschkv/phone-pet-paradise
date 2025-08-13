# GLB Island Import Guide

## How to Add Your Custom GLB Island

### Step 1: Add Your GLB File
1. Place your GLB island file in the `public/assets/models/` directory
2. Name it descriptively (e.g., `TropicalIsland.glb`, `VolcanicIsland.glb`)

### Step 2: Register Your Island
Open `src/components/IslandConfig.ts` and add your island to the `ISLAND_MODELS` object:

```typescript
export const ISLAND_MODELS: Record<string, IslandModelConfig> = {
  'small-island-fox': {
    name: 'Small Island with Fox',
    modelPath: '/assets/models/Small Island with Fox.glb',
    scale: 1,
    description: 'Default small island with fox'
  },
  // Add your new island here:
  'your-island-key': {
    name: 'Your Island Name',
    modelPath: '/assets/models/YourIslandFile.glb',
    scale: 1.2, // Adjust scale as needed
    description: 'Description of your island'
  }
};
```

### Step 3: Use Your Island
In any component, you can now use your island:

```tsx
// Use default island
<GLBIsland />

// Use your custom island
<GLBIsland islandType="your-island-key" />

// Use with custom scale
<GLBIsland islandType="your-island-key" scale={1.5} />
```

### File Structure
```
public/
└── assets/
    └── models/
        ├── Small Island with Fox.glb (existing)
        ├── YourCustomIsland.glb (your file)
        └── AnotherIsland.glb (another file)

src/
└── components/
    ├── IslandConfig.ts (configuration)
    └── GLBIsland.tsx (component)
```

### GLB Model Requirements
- Format: GLB (binary GLTF)
- Recommended scale: Design for unit scale 1 (adjust with scale prop)
- Shadows: Will be automatically enabled
- Textures: Should be embedded in GLB file

### Example Island Types
After adding multiple islands, you can easily switch between them:
- `'small-island-fox'` - Default island
- `'tropical-paradise'` - Your tropical island
- `'volcanic-crater'` - Your volcanic island
- `'floating-city'` - Your floating city island

The system automatically preloads all registered islands for better performance.