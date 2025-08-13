// Configuration for island GLB models
export interface IslandModelConfig {
  name: string;
  modelPath: string;
  scale?: number;
  description?: string;
}

// Available island models - add your new GLB files here
export const ISLAND_MODELS: Record<string, IslandModelConfig> = {
  'grass-lake-island': {
    name: 'Grass Island with Lake',
    modelPath: '/assets/models/Island_10 (Grass with a small lake).glb',
    scale: 1,
    description: 'Beautiful grass island with a small lake'
  },
  'small-island-fox': {
    name: 'Small Island with Fox',
    modelPath: '/assets/models/Small Island with Fox.glb',
    scale: 1,
    description: 'Default small island with fox'
  },
  // Add your new island models here:
  // 'custom-island': {
  //   name: 'Custom Island',
  //   modelPath: '/assets/models/YourCustomIsland.glb',
  //   scale: 1,
  //   description: 'Your custom island description'
  // }
};

// Helper function to get island config
export const getIslandConfig = (islandKey: string): IslandModelConfig => {
  return ISLAND_MODELS[islandKey] || ISLAND_MODELS['grass-lake-island'];
};