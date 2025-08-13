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
  
  let gltf;
  let hasError = false;
  
  try {
    gltf = useGLTF(modelPath);
    console.log('🏝️ GLBIsland: GLB loaded successfully');
  } catch (error) {
    console.error('🏝️ GLBIsland: Error loading GLB:', error);
    hasError = true;
  }
  
  useEffect(() => {
    console.log('🏝️ GLBIsland: Component mounted with scale:', scale);
  }, [scale]);
  
  // If loading failed, show fallback
  if (hasError || !gltf) {
    console.warn('🏝️ GLBIsland: Using fallback geometry');
    return (
      <group ref={meshRef} scale={[scale, scale, scale]} position={[0, -0.5, 0]}>
        <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2, 2.5, 0.8, 16]} />
          <meshLambertMaterial color="#4a7c59" />
        </mesh>
        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshLambertMaterial color="#3b82c7" transparent opacity={0.7} />
        </mesh>
        <group position={[-0.8, 0.2, 0.5]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <coneGeometry args={[0.3, 0.8, 8]} />
            <meshLambertMaterial color="#2d5a3d" />
          </mesh>
          <mesh position={[0, -0.1, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.4]} />
            <meshLambertMaterial color="#8b4513" />
          </mesh>
        </group>
      </group>
    );
  }
  
  // GLB loaded successfully
  const clonedScene = gltf.scene.clone();
  
  return (
    <group ref={meshRef} scale={[scale, scale, scale]} position={[0, -0.5, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
};