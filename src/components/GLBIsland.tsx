import { useGLTF } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import { Group } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { getIslandConfig } from './IslandConfig';

interface GLBIslandProps {
  islandType?: string;
  scale?: number;
}

export const GLBIsland = ({ 
  islandType = 'grass-lake-island', 
  scale 
}: GLBIslandProps) => {
  const groupRef = useRef<Group>(null);
  
  // Get island configuration
  const config = getIslandConfig(islandType);
  const finalScale = scale || config.scale || 1;
  
  console.log(`🏝️ GLBIsland: Loading ${config.name}`);
  console.log(`🏝️ GLBIsland: Path: ${config.modelPath}`);
  
  // Load the GLB model
  const { scene } = useGLTF(config.modelPath);
  
  // Clone the scene for instancing
  const sceneClone = useMemo(() => {
    if (!scene) {
      console.log(`🏝️ GLBIsland: No scene available`);
      return null;
    }
    
    console.log(`🏝️ GLBIsland: Cloning scene with ${scene.children.length} children`);
    const cloned = SkeletonUtils.clone(scene);
    
    // Set up shadows
    cloned.traverse((child) => {
      if ((child as any).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    console.log(`🏝️ GLBIsland: Scene cloned successfully`);
    return cloned;
  }, [scene]);

  if (!sceneClone) {
    console.log(`🏝️ GLBIsland: Rendering fallback - no scene clone`);
    return (
      <group ref={groupRef} position={[0, -0.5, 0]}>
        <mesh>
          <cylinderGeometry args={[2, 2.5, 0.8, 8]} />
          <meshLambertMaterial color="#4a7c59" />
        </mesh>
      </group>
    );
  }

  console.log(`🏝️ GLBIsland: Rendering GLB island at scale ${finalScale}`);
  return (
    <group 
      ref={groupRef} 
      scale={[finalScale, finalScale, finalScale]}
      position={[0, -0.5, 0]}
    >
      <primitive object={sceneClone} />
    </group>
  );
};

// Preload the grass-lake-island model
useGLTF.preload('/assets/models/Island_10 (Grass with a small lake).glb');