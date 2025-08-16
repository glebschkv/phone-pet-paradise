// Configuration for island GLB models
export interface IslandModelConfig {
  name: string;
  modelPath: string;
  scale?: number;
  description?: string;
}

// Available island models
export const ISLAND_MODELS: Record<string, IslandModelConfig> = {
  'default-island': {
    name: 'Small Island with Fox',
    modelPath: '/assets/models/Small Island with Fox.glb',
    scale: 1,
    description: 'Small island with fox model'
  },
  'grass-lake-island': {
    name: 'Grass Island with Lake', 
    modelPath: '/assets/models/Fox.glb',
    scale: 2,
    description: 'Using Fox model as island'
  },
  'panda-island': {
    name: 'Panda Island',
    modelPath: '/assets/models/Panda.glb', 
    scale: 3,
    description: 'Using Panda model as island'
  }
};

// Helper function to get island config
export const getIslandConfig = (islandKey: string): IslandModelConfig => {
  return ISLAND_MODELS[islandKey] || ISLAND_MODELS['default-island'];
};