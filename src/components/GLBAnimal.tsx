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
  scale = 0.5,
  animationName 
}: GLBAnimalProps) => {
  const groupRef = useRef<Group>(null);
  const [position, setPosition] = useState(() => {
    // Start at random position on the island
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 1.2; // Stay within island bounds
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      targetAngle: angle
    };
  });
  const [movementState, setMovementState] = useState({
    isWalking: false,
    pauseTimer: 0,
    nextDirectionChange: Math.random() * 3 + 2 // 2-5 seconds until first direction change
  });
  
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

  // Handle animations based on movement state
  useEffect(() => {
    if (!mixer || animations.length === 0) {
      console.log(`${animalType}: No animations available, model will be static`);
      return;
    }

    // Play appropriate animation based on movement state
    const playWalkingAnimation = () => {
      // Look for walking/running animations first
      const walkingAnim = animations.find(anim => 
        anim.name.toLowerCase().includes('walk') || 
        anim.name.toLowerCase().includes('run') ||
        anim.name.toLowerCase().includes('move')
      );
      
      if (walkingAnim && actions[walkingAnim.name]) {
        Object.values(actions).forEach(action => action?.stop());
        const action = actions[walkingAnim.name];
        action.reset();
        action.fadeIn(0.3);
        action.play();
        console.log(`${animalType}: Playing walking animation "${walkingAnim.name}"`);
      } else if (animations.length > 0) {
        // Fallback to first animation
        const action = actions[animations[0].name];
        action?.reset();
        action?.fadeIn(0.3);
        action?.play();
      }
    };

    const playIdleAnimation = () => {
      // Look for idle animations
      const idleAnim = animations.find(anim => 
        anim.name.toLowerCase().includes('idle') || 
        anim.name.toLowerCase().includes('stand')
      );
      
      if (idleAnim && actions[idleAnim.name]) {
        Object.values(actions).forEach(action => action?.stop());
        const action = actions[idleAnim.name];
        action.reset();
        action.fadeIn(0.3);
        action.play();
        console.log(`${animalType}: Playing idle animation "${idleAnim.name}"`);
      }
    };

    // Play animation based on movement state
    if (movementState.isWalking) {
      playWalkingAnimation();
    } else {
      playIdleAnimation();
    }

  }, [actions, animations, animalType, mixer, movementState.isWalking]);

  // Natural walking behavior on the island surface
  useFrame((state, delta) => {
    if (!groupRef.current) {
      return;
    }

    // IMPORTANT: Update the animation mixer
    if (mixer) {
      mixer.update(delta);
    }

    // Update movement state timers
    setMovementState(prev => ({
      ...prev,
      pauseTimer: Math.max(0, prev.pauseTimer - delta),
      nextDirectionChange: prev.nextDirectionChange - delta
    }));

    // Determine if should be walking or pausing
    const shouldWalk = movementState.pauseTimer <= 0;
    
    if (shouldWalk !== movementState.isWalking) {
      setMovementState(prev => ({
        ...prev,
        isWalking: shouldWalk,
        pauseTimer: shouldWalk ? 0 : Math.random() * 2 + 1, // Pause for 1-3 seconds
        nextDirectionChange: shouldWalk ? Math.random() * 3 + 2 : prev.nextDirectionChange
      }));
    }

    // Walking movement
    if (movementState.isWalking) {
      const walkSpeed = 0.3; // Slower, more natural speed
      const maxRadius = 1.3; // Stay within island bounds
      
      // Change direction periodically
      if (movementState.nextDirectionChange <= 0) {
        setPosition(prev => ({
          ...prev,
          targetAngle: Math.random() * Math.PI * 2
        }));
        setMovementState(prev => ({
          ...prev,
          nextDirectionChange: Math.random() * 4 + 2 // Change direction every 2-6 seconds
        }));
      }
      
      // Move towards target angle
      const dx = Math.cos(position.targetAngle) * walkSpeed * delta;
      const dz = Math.sin(position.targetAngle) * walkSpeed * delta;
      
      let newX = position.x + dx;
      let newZ = position.z + dz;
      
      // Keep animal on the island (boundary checking)
      const distanceFromCenter = Math.sqrt(newX * newX + newZ * newZ);
      if (distanceFromCenter > maxRadius) {
        // Turn around when hitting boundary
        const angleToCenter = Math.atan2(-newZ, -newX);
        setPosition(prev => ({
          ...prev,
          targetAngle: angleToCenter + (Math.random() - 0.5) * Math.PI * 0.5
        }));
        // Don't move beyond boundary
        const scale = maxRadius / distanceFromCenter;
        newX *= scale;
        newZ *= scale;
      }
      
      setPosition(prev => ({
        ...prev,
        x: newX,
        z: newZ
      }));
    }

    // Set position on island surface
    const surfaceHeight = 40 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05; // High above the island
    groupRef.current.position.set(position.x, surfaceHeight, position.z);
    
    // Face movement direction when walking
    if (movementState.isWalking) {
      groupRef.current.lookAt(
        position.x + Math.cos(position.targetAngle),
        surfaceHeight,
        position.z + Math.sin(position.targetAngle)
      );
    } else {
      // Occasional head turns when idle
      const lookAngle = position.targetAngle + Math.sin(state.clock.elapsedTime * 0.3 + index) * 0.3;
      groupRef.current.lookAt(
        position.x + Math.cos(lookAngle),
        surfaceHeight,
        position.z + Math.sin(lookAngle)
      );
    }
    
    // Debug logging (reduced frequency)
    if (Math.floor(state.clock.elapsedTime) % 10 === 0 && Math.floor(state.clock.elapsedTime * 10) % 100 === 0) {
      console.log(`${animalType}: ${movementState.isWalking ? 'Walking' : 'Paused'} at x: ${position.x.toFixed(2)}, z: ${position.z.toFixed(2)}`);
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