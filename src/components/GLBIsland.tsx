 import React, { useRef, useEffect } from ‘react’;
import { useGLTF } from ‘@react-three/drei’;
import * as THREE from ‘three’;

interface GLBIslandProps {
islandType: string;
scale?: number;
}

export const GLBIsland: React.FC<GLBIslandProps> = ({ islandType, scale = 1 }) => {
const meshRef = useRef<THREE.Group>(null);

// Your renamed file path
const modelPath = `/assets/models/Island1.glb`;

let gltf;
let hasError = false;

try {
gltf = useGLTF(modelPath);
console.log(‘GLB loaded successfully from:’, modelPath);
} catch (error) {
console.error(‘Error loading GLB from:’, modelPath, error);
hasError = true;
}

useEffect(() => {
console.log(‘GLBIsland component mounted’);
console.log(‘Trying to load:’, modelPath);
console.log(‘Scale:’, scale);
}, [modelPath, scale]);

// If loading failed, show fallback
if (hasError || !gltf) {
console.warn(‘Using fallback geometry instead of GLB’);
return (
<group ref={meshRef} scale={[scale, scale, scale]} position={[0, 0, 0]}>
<mesh position={[0, -0.5, 0]} castShadow receiveShadow>
<cylinderGeometry args={[2, 2.5, 0.8, 16]} />
<meshLambertMaterial color="#4a7c59" />
</mesh>
<mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
<planeGeometry args={[10, 10]} />
<meshLambertMaterial color="#3b82c7" transparent opacity={0.7} />
</mesh>
{/* Basic tree for fallback */}
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

// GLB loaded successfully - make sure to clone the scene to avoid issues
const clonedScene = gltf.scene.clone();

return (
<group ref={meshRef} scale={[scale, scale, scale]} position={[0, 0, 0]}>
<primitive object={clonedScene} />
</group>
);
};