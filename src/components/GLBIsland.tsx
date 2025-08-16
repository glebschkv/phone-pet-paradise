import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getIslandConfig } from './IslandConfig';

interface GLBIslandProps {
  islandType: string;
  scale?: number;
}

export const GLBIsland: React.FC<GLBIslandProps> = ({ islandType, scale = 3 }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Get island config and model path
  const islandConfig = getIslandConfig(islandType);
  const modelPath = islandConfig.modelPath;
  
  console.log('🏝️ GLBIsland: Loading', islandType);
  console.log('🏝️ GLBIsland: Path:', modelPath);
  
  // Use useGLTF unconditionally - error handling via error boundaries
  let gltf;
  try {
    gltf = useGLTF(modelPath);
    console.log('🏝️ GLBIsland: GLB loaded successfully', gltf);
  } catch (error) {
    console.error('🏝️ GLBIsland: Failed to load GLB:', error);
    throw error;
  }
  
  useEffect(() => {
    console.log('🏝️ GLBIsland: Component mounted with scale:', scale);
  }, [scale]);
  
  // GLB loaded successfully - clone and render
  if (!gltf?.scene) {
    console.warn('🏝️ GLBIsland: No scene in GLB, using fallback');
    return null;
  }
  
  const clonedScene = gltf.scene.clone();
  
  return (
    <group ref={meshRef} scale={[scale, scale, scale]} position={[0, -0.5, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
};