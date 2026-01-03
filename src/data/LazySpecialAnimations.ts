/**
 * LazySpecialAnimations - Lazy-loaded wrapper for SpecialAnimations data
 *
 * The full SpecialAnimations.ts file is 1366 lines of animation data.
 * This wrapper defers loading until the data is actually needed,
 * reducing initial bundle size for users who may never use special animations.
 */

import type { SpecialAnimationConfig } from './SpecialAnimations';

// Cache the loaded module
let specialAnimationsModule: typeof import('./SpecialAnimations') | null = null;
let loadPromise: Promise<typeof import('./SpecialAnimations')> | null = null;

/**
 * Lazily load the SpecialAnimations module.
 * Uses dynamic import to defer loading until needed.
 */
async function loadModule(): Promise<typeof import('./SpecialAnimations')> {
  if (specialAnimationsModule) {
    return specialAnimationsModule;
  }

  if (!loadPromise) {
    loadPromise = import('./SpecialAnimations').then(module => {
      specialAnimationsModule = module;
      return module;
    });
  }

  return loadPromise;
}

/**
 * Preload special animations in the background.
 * Call this during idle time to warm the cache.
 */
export function preloadSpecialAnimations(): void {
  // Only preload if not already loaded
  if (!specialAnimationsModule && !loadPromise) {
    // Use requestIdleCallback to load during idle time
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        loadModule();
      }, { timeout: 5000 });
    } else {
      // Fallback: load after a short delay
      setTimeout(() => {
        loadModule();
      }, 2000);
    }
  }
}

/**
 * Check if an animal has special animations (sync version using cached data).
 * Returns false if data isn't loaded yet.
 */
export function hasSpecialAnimationsSync(baseSpritePath: string): boolean {
  if (!specialAnimationsModule) {
    return false;
  }
  return specialAnimationsModule.hasSpecialAnimations(baseSpritePath);
}

/**
 * Check if an animal has special animations (async version).
 */
export async function hasSpecialAnimations(baseSpritePath: string): Promise<boolean> {
  const module = await loadModule();
  return module.hasSpecialAnimations(baseSpritePath);
}

/**
 * Get a random special animation for an animal (sync version using cached data).
 * Returns null if data isn't loaded yet.
 */
export function getRandomSpecialAnimationSync(baseSpritePath: string): SpecialAnimationConfig | null {
  if (!specialAnimationsModule) {
    return null;
  }
  return specialAnimationsModule.getRandomSpecialAnimation(baseSpritePath);
}

/**
 * Get a random special animation for an animal (async version).
 */
export async function getRandomSpecialAnimation(baseSpritePath: string): Promise<SpecialAnimationConfig | null> {
  const module = await loadModule();
  return module.getRandomSpecialAnimation(baseSpritePath);
}

// Re-export the type for convenience
export type { SpecialAnimationConfig };
