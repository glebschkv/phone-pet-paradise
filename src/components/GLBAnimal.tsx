import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';

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
  scale = 0.5, // Increased default scale for better visibility
  animationName 
}: GLBAnimalProps) => {
  const groupRef = useRef<Group>(null);
  const [angle, setAngle] = useState((index / totalPets) * Math.PI * 2);
  
  // Load GLB model
  const { scene, animations } = useGLTF(modelPath);
  
  // IMPORTANT: Use SkeletonUtils for proper animation cloning
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
  
  // Use animations with the group ref (not the cloned scene)
  const { actions, mixer } = useAnimations(animations, groupRef);

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
    if (!mixer || animations.length === 0) {
      console.log(`${animalType}: No animations available, model will be static`);
      return;
    }

    console.log(`${animalType}: Setting up animations...`);
    let currentAnimationIndex = 0;
    
    const playAnimation = (index: number) => {
      // Stop all animations first
      Object.values(actions).forEach(action => {
        if (action) {
          action.stop();
          action.reset();
        }
      });
      
      // Play current animation
      const animationName = animations[index].name;
      const action = actions[animationName];
      if (action) {
        action.reset();
        action.fadeIn(0.5);
        action.play();
        console.log(`${animalType}: Playing animation "${animationName}"`);
      } else {
        console.warn(`${animalType}: Action "${animationName}" not found in actions`);
      }
    };

    // Play initial animation
    if (animationName && actions[animationName]) {
      console.log(`${animalType}: Starting with specified animation "${animationName}"`);
      const action = actions[animationName];
      action.reset();
      action.fadeIn(0.5);
      action.play();
    } else if (animations.length > 0) {
      console.log(`${animalType}: Starting with first available animation`);
      playAnimation(0);
    }

    // Set up interval to cycle animations every 10 seconds (only if multiple animations)
    let interval: NodeJS.Timeout | null = null;
    if (animations.length > 1) {
      interval = setInterval(() => {
        currentAnimationIndex = (currentAnimationIndex + 1) % animations.length;
        console.log(`${animalType}: Cycling to animation ${currentAnimationIndex}`);
        playAnimation(currentAnimationIndex);
      }, 10000);
    }

    return () => {
      console.log(`${animalType}: Cleaning up animations`);
      if (interval) clearInterval(interval);
      Object.values(actions).forEach(action => {
        if (action) {
          action.stop();
        }
      });
    };
  }, [actions, animationName, animations, animalType, mixer]);

  // Animate position in circle around the island AND update mixer
  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    // IMPORTANT: Update the animation mixer
    if (mixer) {
      mixer.update(delta);
    }

    // Calculate circular movement
    const radius = Math.max(2.5, totalPets * 0.5); // Increased radius for better visibility
    const speed = isActive ? 1.0 : 0.4; // Increased speed
    
    // Update angle
    const newAngle = angle + delta * speed;
    setAngle(newAngle);
    
    // Calculate position
    const x = Math.cos(newAngle) * radius;
    const z = Math.sin(newAngle) * radius;
    const y = 0.3 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.2; // More visible bobbing
    
    // Set position
    groupRef.current.position.set(x, y, z);
    
    // Make the model face the center (0, 0, 0)
    groupRef.current.lookAt(0, groupRef.current.position.y, 0);
    
    // Add a small rotation offset so the model faces forward correctly
    groupRef.current.rotation.y += Math.PI;
    
    // Optional: Add some idle rotation for more life
    groupRef.current.rotation.y += Math.sin(state.clock.elapsedTime + index) * 0.01;
    
    // Debug logging (reduced frequency)
    if (Math.floor(state.clock.elapsedTime) % 5 === 0 && Math.floor(state.clock.elapsedTime * 10) % 50 === 0) {
      console.log(`${animalType}: Position - x: ${x.toFixed(2)}, y: ${y.toFixed(2)}, z: ${z.toFixed(2)}, angle: ${newAngle.toFixed(2)}`);
    }
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={sceneClone} />
    </group>
  );
};

// Preload models that exist
// Only uncomment these lines when you have the actual GLB files:
// useGLTF.preload('/assets/models/Elephant.glb');
// useGLTF.preload('/assets/models/rabbit.glb');
// useGLTF.preload('/assets/models/Fox.glb');
// useGLTF.preload('/assets/models/bear.glb');
// useGLTF.preload('/assets/models/deer.glb');
// useGLTF.preload('/assets/models/owl.glb');
// useGLTF.preload('/assets/models/Panda.glb');