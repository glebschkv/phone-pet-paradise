// Configuration for animal models - supports both GLB and primitive rendering
export interface AnimalModelConfig {
  type: 'glb' | 'primitive';
  modelPath?: string; // For GLB models
  scale?: number;
  animationName?: string;
  fallbackToPrimitive?: boolean; // Fallback to primitive if GLB fails
}

export const ANIMAL_MODEL_CONFIG: Record<string, AnimalModelConfig> = {
  Rabbit: {
    type: 'primitive', // Changed to primitive until GLB files are added
    fallbackToPrimitive: true
  },
  Fox: {
    type: 'glb',
    modelPath: '/assets/models/Fox.glb',
    scale: 0.2,
    fallbackToPrimitive: true
  },
  Bear: {
    type: 'primitive', // Changed to primitive until GLB files are added
    fallbackToPrimitive: true
  },
  Deer: {
    type: 'primitive', // Changed to primitive until GLB files are added
    fallbackToPrimitive: true
  },
  Owl: {
    type: 'primitive', // Changed to primitive until GLB files are added
    fallbackToPrimitive: true
  }
};