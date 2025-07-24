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
    type: 'glb',
    modelPath: '/assets/models/rabbit.glb',
    scale: 0.3,
    animationName: 'Idle',
    fallbackToPrimitive: true
  },
  Fox: {
    type: 'glb', 
    modelPath: '/assets/models/fox.glb',
    scale: 0.25,
    animationName: 'Walk',
    fallbackToPrimitive: true
  },
  Bear: {
    type: 'glb',
    modelPath: '/assets/models/bear.glb', 
    scale: 0.4,
    animationName: 'Idle',
    fallbackToPrimitive: true
  },
  Deer: {
    type: 'glb',
    modelPath: '/assets/models/deer.glb',
    scale: 0.35, 
    animationName: 'Walk',
    fallbackToPrimitive: true
  },
  Owl: {
    type: 'glb',
    modelPath: '/assets/models/owl.glb',
    scale: 0.2,
    animationName: 'Flying',
    fallbackToPrimitive: true
  }
};