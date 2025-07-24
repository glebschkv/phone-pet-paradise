// Configuration for animal models - supports both GLB and primitive rendering
// This will be migrated to the unified animal database
import { ANIMAL_DATABASE } from '@/data/AnimalDatabase';

export interface AnimalModelConfig {
  type: 'glb' | 'primitive';
  modelPath?: string; // For GLB models
  scale?: number;
  animationName?: string;
  fallbackToPrimitive?: boolean; // Fallback to primitive if GLB fails
}

// Generate model config from animal database
export const ANIMAL_MODEL_CONFIG: Record<string, AnimalModelConfig> = {};

ANIMAL_DATABASE.forEach(animal => {
  ANIMAL_MODEL_CONFIG[animal.name] = animal.modelConfig || {
    type: 'primitive',
    fallbackToPrimitive: true
  };
});