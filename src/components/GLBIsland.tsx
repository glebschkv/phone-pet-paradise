import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import { Group } from 'three';

interface GLBIslandProps {
  scale?: number;
}

export const GLBIsland = ({ scale = 1 }: GLBIslandProps) => {
  const groupRef = useRef<Group>(null);
  
  // Load the Small Island with Fox GLB model
  const { scene } = useGLTF('/assets/models/Small Island with Fox.glb');

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={scene.clone()} />
    </group>
  );
};

// Preload the island model
useGLTF.preload('/assets/models/Small Island with Fox.glb');