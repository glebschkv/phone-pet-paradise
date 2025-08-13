import { useGLTF } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import { Group } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { getIslandConfig, ISLAND_MODELS } from './IslandConfig';

interface GLBIslandProps {
  islandType?: string; // Key from ISLAND_MODELS
  scale?: number;
}

export const GLBIsland = ({ 
  islandType = 'small-island-fox', 
  scale 
}: GLBIslandProps) => {
  const groupRef = useRef<Group>(null);
  
  // Get island configuration
  const config = getIslandConfig(islandType);
  const finalScale = scale || config.scale || 1;
  
  // Load the GLB model
  const { scene } = useGLTF(config.modelPath);
  
  // Clone the scene properly for instancing
  const sceneClone = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    cloned.traverse((child) => {
      if ((child as any).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene]);

  console.log(`Loading island: ${config.name} from ${config.modelPath}`);

  return (
    <group ref={groupRef} scale={[finalScale, finalScale, finalScale]}>
      <primitive object={sceneClone} />
    </group>
  );
};

// Preload all available island models
Object.values(ISLAND_MODELS).forEach(island => {
  useGLTF.preload(island.modelPath);
});