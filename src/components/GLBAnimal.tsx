import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState, useMemo } from 'react';
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
  
  // Load GLB model - use useMemo to prevent re-loading
  const { scene, animations } = useGLTF(modelPath);
  const sceneClone = useMemo(() => scene.clone(), [scene]);
  const { actions } = useAnimations(animations, groupRef);

  // Log detailed information about the loaded model
  useEffect(() => {
    console.log(`${animalType} GLB loaded successfully:`, {
      modelPath,
      sceneChildren: scene.children.length,
      animationsCount: animations.length,
      animationNames: animations.map(anim => anim.name),
      actionsAvailable: Object.keys(actions),
      hasAnimations: animations.length > 0
    });
    
    if (animations.length === 0) {
      console.warn(`No animations found in ${animalType} GLB model at ${modelPath}`);
    } else {
      console.log(`${animalType} has ${animations.length} animations:`, animations.map(a => a.name));
    }
  }, [scene, animations, actions, animalType, modelPath]);

  // Handle animations
  useEffect(() => {
    if (animations.length === 0) {
      console.log(`${animalType}: No animations available, model will be static`);
      return;
    }

    console.log(`${animalType}: Setting up animations...`);
    let currentAnimationIndex = 0;
    
    const playAnimation = (index: number) => {
      // Stop all animations first
      Object.values(actions).forEach(action => action?.stop());
      
      // Play current animation
      const animationName = animations[index].name;
      const action = actions[animationName];
      if (action) {
        action.reset().play();
        console.log(`${animalType}: Playing animation "${animationName}"`);
      } else {
        console.warn(`${animalType}: Action "${animationName}" not found in actions`);
      }
    };

    // Play initial animation
    if (animationName && actions[animationName]) {
      console.log(`${animalType}: Starting with specified animation "${animationName}"`);
      actions[animationName]?.reset().play();
    } else if (animations.length > 0) {
      console.log(`${animalType}: Starting with first available animation`);
      playAnimation(0);
    }

    // Set up interval to cycle animations every 10 seconds
    const interval = setInterval(() => {
      if (animations.length > 1) {
        currentAnimationIndex = (currentAnimationIndex + 1) % animations.length;
        console.log(`${animalType}: Cycling to animation ${currentAnimationIndex}`);
        playAnimation(currentAnimationIndex);
      }
    }, 10000);

    return () => {
      console.log(`${animalType}: Cleaning up animations`);
      clearInterval(interval);
      Object.values(actions).forEach(action => action?.stop());
    };
  }, [actions, animationName, animations, animalType]);

  // Animate position in circle around the island
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const radius = Math.max(2.0, totalPets * 0.4); // Larger radius for better visibility
    const speed = isActive ? 0.8 : 0.3; // Faster movement
    
    setAngle(prev => prev + delta * speed);
    
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.2 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.15; // More bobbing
    
    groupRef.current.position.set(x, y, z);
    groupRef.current.lookAt(0, groupRef.current.position.y, 0);
    
    // Add slight rotation for more life
    groupRef.current.rotation.y = -angle + Math.PI / 2;
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={sceneClone} />
    </group>
  );
};

// GLB preloading temporarily disabled
/*
// Preload GLB models only when they exist
// Uncomment these when you add the actual GLB files:
useGLTF.preload('/assets/models/Elephant.glb');
// useGLTF.preload('/assets/models/rabbit.glb');
useGLTF.preload('/assets/models/Fox.glb');
// useGLTF.preload('/assets/models/bear.glb');
// useGLTF.preload('/assets/models/deer.glb');
// useGLTF.preload('/assets/models/owl.glb');
*/

// Active preloads for available models
useGLTF.preload('/assets/models/Panda.glb');