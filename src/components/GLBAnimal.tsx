import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';

interface GLBAnimalProps {
  modelPath: string;
  animalType: string;
  totalPets: number;
  isActive: boolean;
  index: number;
  scale?: number;
  animationName?: string;
}

export const GLBAnimal = ({ 
  modelPath, 
  animalType, 
  totalPets, 
  isActive, 
  index, 
  scale = 0.3,
  animationName 
}: GLBAnimalProps) => {
  const groupRef = useRef<Group>(null);
  const [angle, setAngle] = useState((index / totalPets) * Math.PI * 2);
  
  // Load GLB model
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, groupRef);

  // Play animation if available
  useEffect(() => {
    if (animationName && actions[animationName]) {
      actions[animationName]?.play();
    } else if (animations.length > 0 && actions[animations[0].name]) {
      // Play first available animation
      actions[animations[0].name]?.play();
    }
  }, [actions, animationName, animations]);

  // Animate position in circle
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const radius = Math.max(1.5, totalPets * 0.3);
    const speed = isActive ? 0.5 : 0.1;
    
    setAngle(prev => prev + delta * speed);
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = Math.sin(state.clock.elapsedTime + index) * 0.1;
    
    groupRef.current.position.set(x, y, z);
    groupRef.current.lookAt(0, groupRef.current.position.y, 0);
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={scene.clone()} />
    </group>
  );
};

// Preload GLB models only when they exist
// Uncomment these when you add the actual GLB files:
// useGLTF.preload('/assets/models/rabbit.glb');
useGLTF.preload('/assets/models/Fox.glb');
// useGLTF.preload('/assets/models/bear.glb');
// useGLTF.preload('/assets/models/deer.glb');
// useGLTF.preload('/assets/models/owl.glb');