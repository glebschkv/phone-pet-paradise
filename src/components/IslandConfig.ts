// Configuration for island GLB models
export interface IslandModelConfig {
  name: string;
  modelPath: string;
  scale?: number;
  description?: string;
}

// Available island models - add your new GLB files here
export const ISLAND_MODELS: Record<string, IslandModelConfig> = {
  'default-island': {
    name: 'Default Island',
    modelPath: '/assets/models/Island1.glb',
    scale: 1,
    description: 'Default island model'
  },
  'grass-lake-island': {
    name: 'Grass Island with Lake', 
    modelPath: '/assets/models/Island1.glb',
    scale: 1,
    description: 'Beautiful grass island with a small lake'
  },
  'small-island-fox': {
    name: 'Small Island with Fox',
    modelPath: '/assets/models/Island1.glb', 
    scale: 1,
    description: 'Default small island with fox'
  }
};

// Helper function to get island config
export const getIslandConfig = (islandKey: string): IslandModelConfig => {
  return ISLAND_MODELS[islandKey] || ISLAND_MODELS['default-island'];
};