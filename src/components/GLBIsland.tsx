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
  
  console.log('🏝️ GLBIsland: Loading', islandType, 'at scale', scale);
  console.log('🏝️ GLBIsland: Path:', modelPath);
  console.log('🏝️ GLBIsland: Config:', islandConfig);
  
  // Use useGLTF with better error handling
  let gltf;
  try {
    gltf = useGLTF(modelPath);
    console.log('🏝️ GLBIsland: GLB loaded successfully', gltf);
    console.log('🏝️ GLBIsland: Scene object:', gltf.scene);
    console.log('🏝️ GLBIsland: Scene children count:', gltf.scene?.children?.length);
  } catch (error) {
    console.error('🏝️ GLBIsland: Failed to load GLB:', error);
    console.error('🏝️ GLBIsland: Error details:', error);
    throw error;
  }
  
  useEffect(() => {
    console.log('🏝️ GLBIsland: Component mounted with scale:', scale);
  }, [scale]);
  
  // GLB loaded successfully - clone and render
  if (!gltf?.scene) {
    console.warn('🏝️ GLBIsland: No scene in GLB, rendering fallback');
    // Render a simple fallback island
    return (
      <group ref={meshRef} scale={[scale, scale, scale]} position={[0, -0.5, 0]}>
        <mesh>
          <cylinderGeometry args={[2, 2, 0.5, 16]} />
          <meshStandardMaterial color="#4ade80" />
        </mesh>
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[1.8, 1.8, 0.1, 16]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      </group>
    );
  }
  
  const clonedScene = gltf.scene.clone();
  console.log('🏝️ GLBIsland: Rendering cloned scene at position [0, -0.5, 0] with scale', scale);
  
  return (
    <group ref={meshRef} scale={[scale, scale, scale]} position={[0, -0.5, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
};