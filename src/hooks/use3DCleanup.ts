import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { threeLogger } from '@/lib/logger';

interface CleanupConfig {
  autoCleanup: boolean;
  cleanupInterval: number; // in milliseconds
  maxMemoryMB: number;
  enableLogging: boolean;
}

const defaultConfig: CleanupConfig = {
  autoCleanup: true,
  cleanupInterval: 30000, // 30 seconds
  maxMemoryMB: 256,
  enableLogging: false,
};

export const use3DCleanup = (config: Partial<CleanupConfig> = {}) => {
  const cleanupConfig = { ...defaultConfig, ...config };
  const cleanupInterval = useRef<NodeJS.Timeout>();
  const disposedObjects = useRef(new Set<string>());

  // Dispose geometry
  const disposeGeometry = useCallback((geometry: THREE.BufferGeometry) => {
    if (geometry && typeof geometry.dispose === 'function') {
      geometry.dispose();
      if (cleanupConfig.enableLogging) {
        threeLogger.debug('Disposed geometry:', geometry.type);
      }
    }
  }, [cleanupConfig.enableLogging]);

  // Dispose material
  const disposeMaterial = useCallback((material: THREE.Material | THREE.Material[]) => {
    const materials = Array.isArray(material) ? material : [material];
    
    materials.forEach(mat => {
      if (mat && typeof mat.dispose === 'function') {
        // Dispose textures
        Object.values(mat).forEach(value => {
          if (value && value instanceof THREE.Texture) {
            value.dispose();
          }
        });
        
        mat.dispose();
        if (cleanupConfig.enableLogging) {
          threeLogger.debug('Disposed material:', mat.type);
        }
      }
    });
  }, [cleanupConfig.enableLogging]);

  // Dispose texture
  const disposeTexture = useCallback((texture: THREE.Texture) => {
    if (texture && typeof texture.dispose === 'function') {
      texture.dispose();
      if (cleanupConfig.enableLogging) {
        threeLogger.debug('Disposed texture');
      }
    }
  }, [cleanupConfig.enableLogging]);

  // Clean up object3D and all children
  const disposeObject3D = useCallback((object: THREE.Object3D) => {
    if (!object) return;
    
    const objectId = object.uuid;
    if (disposedObjects.current.has(objectId)) {
      return; // Already disposed
    }
    
    // Recursively dispose children
    const children = [...object.children];
    children.forEach(child => disposeObject3D(child));
    
    // Dispose object properties
    if ((object as any).geometry) {
      disposeGeometry((object as any).geometry);
    }
    
    if ((object as any).material) {
      disposeMaterial((object as any).material);
    }
    
    // Remove from parent
    if (object.parent) {
      object.parent.remove(object);
    }
    
    // Clear references
    object.clear();
    
    disposedObjects.current.add(objectId);

    if (cleanupConfig.enableLogging) {
      threeLogger.debug('Disposed Object3D:', object.type, objectId);
    }
  }, [disposeGeometry, disposeMaterial, cleanupConfig.enableLogging]);

  // Clean up scene
  const cleanupScene = useCallback((scene: THREE.Scene) => {
    if (!scene) return;
    
    const children = [...scene.children];
    children.forEach(child => {
      disposeObject3D(child);
    });
    
    scene.clear();

    if (cleanupConfig.enableLogging) {
      threeLogger.debug('Cleaned up scene');
    }
  }, [disposeObject3D, cleanupConfig.enableLogging]);

  // Clean up renderer
  const cleanupRenderer = useCallback((renderer: THREE.WebGLRenderer) => {
    if (!renderer) return;
    
    // Dispose render targets
    renderer.renderLists.dispose();
    renderer.dispose();
    
    // Clear context
    const canvas = renderer.domElement;
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
    if (gl) {
      const loseContextExt = gl.getExtension('WEBGL_lose_context');
      if (loseContextExt) {
        loseContextExt.loseContext();
      }
    }
    
    if (cleanupConfig.enableLogging) {
      threeLogger.debug('Cleaned up renderer');
    }
  }, [cleanupConfig.enableLogging]);

  // Force garbage collection
  const forceGarbageCollection = useCallback(() => {
    // Clear disposed objects set periodically
    if (disposedObjects.current.size > 1000) {
      disposedObjects.current.clear();
    }
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      if (cleanupConfig.enableLogging) {
        threeLogger.debug('Forced garbage collection');
      }
    }
  }, [cleanupConfig.enableLogging]);

  // Check memory usage
  const checkMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryMB = memory.usedJSHeapSize / (1024 * 1024);
      
      if (memoryMB > cleanupConfig.maxMemoryMB) {
        forceGarbageCollection();
        if (cleanupConfig.enableLogging) {
          threeLogger.warn('High memory usage detected:', memoryMB.toFixed(2), 'MB');
        }
      }
    }
  }, [cleanupConfig.maxMemoryMB, cleanupConfig.enableLogging, forceGarbageCollection]);

  // Comprehensive cleanup
  const performCleanup = useCallback(() => {
    checkMemoryUsage();
    forceGarbageCollection();

    if (cleanupConfig.enableLogging) {
      threeLogger.debug('Performed comprehensive cleanup');
    }
  }, [checkMemoryUsage, forceGarbageCollection, cleanupConfig.enableLogging]);

  // Set up auto cleanup
  useEffect(() => {
    if (cleanupConfig.autoCleanup) {
      cleanupInterval.current = setInterval(
        performCleanup,
        cleanupConfig.cleanupInterval
      );
      
      return () => {
        if (cleanupInterval.current) {
          clearInterval(cleanupInterval.current);
        }
      };
    }
  }, [cleanupConfig.autoCleanup, cleanupConfig.cleanupInterval, performCleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      performCleanup();
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
    };
  }, [performCleanup]);

  return {
    disposeObject3D,
    disposeGeometry,
    disposeMaterial,
    disposeTexture,
    cleanupScene,
    cleanupRenderer,
    performCleanup,
    forceGarbageCollection,
    checkMemoryUsage,
  };
};