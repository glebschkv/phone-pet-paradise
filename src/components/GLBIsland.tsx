import { useGLTF } from '@react-three/drei';
import { useRef, useMemo, useEffect, useState } from 'react';
import { Group, Mesh } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { getIslandConfig, ISLAND_MODELS } from './IslandConfig';

interface GLBIslandProps {
  islandType?: string; // Key from ISLAND_MODELS
  scale?: number;
}

export const GLBIsland = ({ 
  islandType = 'grass-lake-island', 
  scale 
}: GLBIslandProps) => {
  const groupRef = useRef<Group>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Get island configuration
  const config = getIslandConfig(islandType);
  const finalScale = scale || config.scale || 3; // Increased default scale
  
  console.log(`🏝️ GLBIsland: Starting to load ${config.name}`);
  console.log(`🏝️ GLBIsland: Model path: ${config.modelPath}`);
  console.log(`🏝️ GLBIsland: Final scale: ${finalScale}`);

  // Load the GLB model with error handling
  let scene, error;
  try {
    const gltfData = useGLTF(config.modelPath);
    scene = gltfData.scene;
    console.log(`🏝️ GLBIsland: Scene loaded successfully:`, !!scene);
    if (scene) {
      console.log(`🏝️ GLBIsland: Scene children count:`, scene.children.length);
      console.log(`🏝️ GLBIsland: Scene boundingBox:`, scene.userData);
    }
  } catch (err) {
    error = err;
    console.error(`🏝️ GLBIsland: Failed to load GLB:`, err);
    setLoadError(err instanceof Error ? err.message : 'Unknown error');
  }
  
  // Clone the scene properly for instancing
  const sceneClone = useMemo(() => {
    if (!scene) {
      console.log(`🏝️ GLBIsland: No scene to clone`);
      return null;
    }
    
    try {
      const cloned = SkeletonUtils.clone(scene);
      console.log(`🏝️ GLBIsland: Scene cloned successfully`);
      
      // Traverse and setup shadows
      let meshCount = 0;
      cloned.traverse((child) => {
        if ((child as any).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          meshCount++;
          const mesh = child as Mesh;
          console.log(`🏝️ GLBIsland: Mesh found:`, child.name || 'unnamed', mesh.geometry?.type);
        }
      });
      
      console.log(`🏝️ GLBIsland: Total meshes found: ${meshCount}`);
      setIsLoaded(true);
      return cloned;
    } catch (err) {
      console.error(`🏝️ GLBIsland: Error cloning scene:`, err);
      setLoadError(err instanceof Error ? err.message : 'Clone error');
      return null;
    }
  }, [scene]);

  useEffect(() => {
    if (sceneClone && groupRef.current) {
      console.log(`🏝️ GLBIsland: Scene mounted to group`);
      console.log(`🏝️ GLBIsland: Group position:`, groupRef.current.position);
      console.log(`🏝️ GLBIsland: Group scale:`, groupRef.current.scale);
    }
  }, [sceneClone]);

  // Render error state
  if (loadError) {
    console.error(`🏝️ GLBIsland: Rendering error fallback`);
    return (
      <group ref={groupRef} position={[0, -0.5, 0]}>
        <mesh>
          <cylinderGeometry args={[2, 2.5, 0.8, 8]} />
          <meshLambertMaterial color="#ff4444" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshLambertMaterial color="#8B4513" />
        </mesh>
      </group>
    );
  }

  // Render loading state
  if (!sceneClone) {
    console.log(`🏝️ GLBIsland: Rendering loading fallback`);
    return (
      <group ref={groupRef} position={[0, -0.5, 0]}>
        <mesh>
          <cylinderGeometry args={[2, 2.5, 0.8, 8]} />
          <meshLambertMaterial color="#666666" />
        </mesh>
      </group>
    );
  }

  console.log(`🏝️ GLBIsland: Rendering GLB scene`);
  return (
    <group 
      ref={groupRef} 
      scale={[finalScale, finalScale, finalScale]}
      position={[0, -0.5, 0]} // Match original island positioning
    >
      <primitive object={sceneClone} />
    </group>
  );
};

// Preload all available island models
Object.values(ISLAND_MODELS).forEach(island => {
  useGLTF.preload(island.modelPath);
});