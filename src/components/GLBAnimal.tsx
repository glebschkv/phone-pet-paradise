import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3, Raycaster, Mesh } from 'three';
import { SkeletonUtils } from 'three-stdlib';

interface GLBAnimalProps {
  modelPath: string;
  animalType: string;
  totalPets: number;
  isActive: boolean;
  index: number;
  scale?: number;
  animationName?: string;
  islandRef?: React.RefObject<Group>;
}

export const GLBAnimal = ({ 
  modelPath, 
  animalType, 
  totalPets, 
  isActive, 
  index, 
  scale = 0.5,
  animationName,
  islandRef 
}: GLBAnimalProps) => {
  const groupRef = useRef<Group>(null);
  const { scene: threeScene } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);
  const tempVector = useMemo(() => new Vector3(), []);
  
  const [position, setPosition] = useState(() => {
    // Start at random position on the island
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 1.2; // Stay within island bounds
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      y: 0,
      targetAngle: angle
    };
  });
  const [movementState, setMovementState] = useState({
    isWalking: false,
    pauseTimer: 0,
    nextDirectionChange: Math.random() * 3 + 2, // 2-5 seconds until first direction change
    lastRaycastTime: 0
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

  // Helper function to get surface height using raycasting
  const getSurfaceHeight = (x: number, z: number): { height: number; normal?: Vector3 } => {
    // Only raycast every few frames for performance
    const currentTime = Date.now();
    if (currentTime - movementState.lastRaycastTime < 100) { // Cache for 100ms
      return { height: position.y };
    }

    // Set ray origin high above the position
    tempVector.set(x, 10, z);
    raycaster.set(tempVector, new Vector3(0, -1, 0));
    
    // If we have an island reference, ONLY use that
    if (islandRef?.current) {
      const islandMeshes: Mesh[] = [];
      islandRef.current.traverse((child) => {
        if (child instanceof Mesh && child.visible) {
          islandMeshes.push(child);
        }
      });
      if (islandMeshes.length > 0) {
        const intersects = raycaster.intersectObjects(islandMeshes);
        if (intersects.length > 0) {
          setMovementState(prev => ({ ...prev, lastRaycastTime: currentTime }));
          const surfaceY = intersects[0].point.y + 0.1;
          console.log(`${animalType}: Found ISLAND surface at Y: ${surfaceY.toFixed(2)}`);
          return { 
            height: surfaceY,
            normal: intersects[0].face?.normal 
          };
        } else {
          console.log(`${animalType}: Island has ${islandMeshes.length} meshes but no intersection found`);
        }
      } else {
        console.log(`${animalType}: Island ref exists but no meshes found`);
      }
    } else {
      console.log(`${animalType}: No island reference available`);
    }
    
    // For now, just use a safe fixed height since raycasting is problematic
    console.log(`${animalType}: Using fallback height 0.2`);
    return { height: 0.2 }; // Safe height above the island
  };

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

    // Get surface height using raycasting for natural terrain following
    const surfaceData = getSurfaceHeight(position.x, position.z);
    let surfaceHeight = surfaceData.height;
    
    // Safety check: if surface height is unreasonable, use safe fallback
    if (surfaceHeight > 10 || surfaceHeight < -5) {
      console.warn(`${animalType}: Unreasonable surface height ${surfaceHeight}, using fallback`);
      surfaceHeight = 0.2;
    }
    
    // Update position with surface-following
    setPosition(prev => ({
      ...prev,
      y: surfaceHeight
    }));
    
    groupRef.current.position.set(position.x, surfaceHeight, position.z);
    
    // Apply surface normal alignment for natural standing on slopes
    if (surfaceData.normal && groupRef.current.parent) {
      const worldNormal = surfaceData.normal.clone();
      worldNormal.transformDirection(groupRef.current.parent.matrixWorld);
      
      // Slightly tilt the animal to match surface normal (not too extreme)
      const tiltAmount = 0.3; // Reduce tilt for more subtle effect
      const currentRotation = groupRef.current.rotation.clone();
      const targetRotation = new Vector3();
      
      // Calculate tilt based on surface normal
      targetRotation.x = Math.atan2(worldNormal.z, worldNormal.y) * tiltAmount;
      targetRotation.z = -Math.atan2(worldNormal.x, worldNormal.y) * tiltAmount;
      
      // Smoothly interpolate rotation
      groupRef.current.rotation.x += (targetRotation.x - currentRotation.x) * delta * 2;
      groupRef.current.rotation.z += (targetRotation.z - currentRotation.z) * delta * 2;
    }
    
    // Face movement direction when walking
    if (movementState.isWalking) {
      const lookTarget = tempVector.set(
        position.x + Math.cos(position.targetAngle),
        surfaceHeight,
        position.z + Math.sin(position.targetAngle)
      );
      groupRef.current.lookAt(lookTarget);
    } else {
      // Occasional head turns when idle
      const lookAngle = position.targetAngle + Math.sin(state.clock.elapsedTime * 0.3 + index) * 0.3;
      const lookTarget = tempVector.set(
        position.x + Math.cos(lookAngle),
        surfaceHeight,
        position.z + Math.sin(lookAngle)
      );
      groupRef.current.lookAt(lookTarget);
    }
    
    // Debug logging (reduced frequency)
    if (Math.floor(state.clock.elapsedTime) % 10 === 0 && Math.floor(state.clock.elapsedTime * 10) % 100 === 0) {
      console.log(`${animalType}: ${movementState.isWalking ? 'Walking' : 'Paused'} at x: ${position.x.toFixed(2)}, y: ${surfaceHeight.toFixed(2)}, z: ${position.z.toFixed(2)}`);
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