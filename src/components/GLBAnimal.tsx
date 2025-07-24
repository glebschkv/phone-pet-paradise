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

  // Log animations for debugging (especially for elephant)
  useEffect(() => {
    if (animalType === 'Elephant' && animations.length > 0) {
      console.log(`${animalType} animations available:`, animations.map(anim => ({
        name: anim.name,
        duration: anim.duration,
        tracks: anim.tracks.length
      })));
    }
  }, [animations, animalType]);

  // Auto-cycle through animations every 10 seconds
  useEffect(() => {
    if (animations.length === 0) return;

    let currentAnimationIndex = 0;
    
    const playAnimation = (index: number) => {
      // Stop all animations first
      Object.values(actions).forEach(action => action?.stop());
      
      // Play current animation
      const animationName = animations[index].name;
      if (actions[animationName]) {
        actions[animationName]?.reset().play();
        console.log(`Playing ${animalType} animation: ${animationName}`);
      }
    };

    // Play initial animation
    if (animationName && actions[animationName]) {
      actions[animationName]?.play();
    } else {
      playAnimation(0);
    }

    // Set up interval to cycle animations every 10 seconds
    const interval = setInterval(() => {
      currentAnimationIndex = (currentAnimationIndex + 1) % animations.length;
      playAnimation(currentAnimationIndex);
    }, 10000);

    return () => clearInterval(interval);
  }, [actions, animationName, animations, animalType]);

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
useGLTF.preload('/assets/models/Elephant.glb');
// useGLTF.preload('/assets/models/rabbit.glb');
useGLTF.preload('/assets/models/Fox.glb');
// useGLTF.preload('/assets/models/bear.glb');
// useGLTF.preload('/assets/models/deer.glb');
// useGLTF.preload('/assets/models/owl.glb');