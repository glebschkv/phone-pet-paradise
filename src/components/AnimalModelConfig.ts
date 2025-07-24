// Configuration for animal models - supports both GLB and primitive rendering
export interface AnimalModelConfig {
  type: 'glb' | 'primitive';
  modelPath?: string; // For GLB models
  scale?: number;
  animationName?: string;
  fallbackToPrimitive?: boolean; // Fallback to primitive if GLB fails
}

export const ANIMAL_MODEL_CONFIG: Record<string, AnimalModelConfig> = {
  Elephant: {
    type: 'primitive', // Temporarily disabled GLB
    // modelPath: '/assets/models/Elephant.glb',
    // scale: 0.15,
    fallbackToPrimitive: true
  },
  Rabbit: {
    type: 'primitive',
    fallbackToPrimitive: true
  },
  Fox: {
    type: 'primitive', // Temporarily disabled GLB
    // modelPath: '/assets/models/Fox.glb',
    // scale: 0.1,
    fallbackToPrimitive: true
  },
  Bear: {
    type: 'primitive',
    fallbackToPrimitive: true
  },
  Deer: {
    type: 'primitive',
    fallbackToPrimitive: true
  },
  Owl: {
    type: 'primitive',
    fallbackToPrimitive: true
  }
};