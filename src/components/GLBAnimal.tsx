import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Raycaster, Mesh } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { use3DCleanup } from '@/hooks/use3DCleanup';

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

interface MovementState {
  position: Vector3;
  velocity: Vector3;
  targetDirection: Vector3;
  speed: number;
  currentAnimation: string;
  isOnGround: boolean;
  surfaceNormal: Vector3;
  groundClearance: number;
}

interface TerrainSample {
  height: number;
  normal: Vector3;
  isValid: boolean;
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
  // Initialize 3D cleanup system
  const { disposeObject3D } = use3DCleanup({
    autoCleanup: true,
    cleanupInterval: 60000, // Clean every minute
    enableLogging: false,
  });
  
  const groupRef = useRef<Group>(null);
  const tempVector = useMemo(() => new Vector3(), []);
  const forwardVector = useMemo(() => new Vector3(), []);
  const sideVector = useMemo(() => new Vector3(), []);
  const upVector = useMemo(() => new Vector3(0, 1, 0), []);
  const raycaster = useMemo(() => new Raycaster(), []);
  const rayDirection = useMemo(() => new Vector3(0, -1, 0), []);
  
  // Animal-specific configuration
  const animalConfig = useMemo(() => {
    const configs = {
      panda: { groundClearance: 0.15, moveSpeed: 0.3, turnSpeed: 2.0 },
      fox: { groundClearance: 0.08, moveSpeed: 0.5, turnSpeed: 3.0 },
      rabbit: { groundClearance: 0.05, moveSpeed: 0.4, turnSpeed: 4.0 },
      default: { groundClearance: 0.1, moveSpeed: 0.35, turnSpeed: 2.5 }
    };
    return configs[animalType as keyof typeof configs] || configs.default;
  }, [animalType]);
  
  // Cache for island meshes to improve performance
  const [islandMeshes, setIslandMeshes] = useState<Mesh[]>([]);
  
  // Enhanced terrain sampling with slope detection
  const sampleTerrain = (x: number, z: number): TerrainSample => {
    if (islandMeshes.length === 0) {
      return {
        height: animalConfig.groundClearance,
        normal: new Vector3(0, 1, 0),
        isValid: false
      };
    }
    
    const rayOrigin = tempVector.set(x, 10, z);
    raycaster.set(rayOrigin, rayDirection);
    
    const intersects = raycaster.intersectObjects(islandMeshes, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      const height = hit.point.y + animalConfig.groundClearance;
      const normal = hit.face?.normal ? hit.face.normal.clone() : new Vector3(0, 1, 0);
      
      return {
        height: Math.max(height, 0.05),
        normal: normal,
        isValid: true
      };
    }
    
    return {
      height: animalConfig.groundClearance,
      normal: new Vector3(0, 1, 0),
      isValid: false
    };
  };

  // Multi-point terrain sampling for slope awareness
  const sampleTerrainMultiple = (center: Vector3, sampleRadius: number = 0.1) => {
    const centerSample = sampleTerrain(center.x, center.z);
    const forwardSample = sampleTerrain(center.x, center.z - sampleRadius);
    const backSample = sampleTerrain(center.x, center.z + sampleRadius);
    const leftSample = sampleTerrain(center.x - sampleRadius, center.z);
    const rightSample = sampleTerrain(center.x + sampleRadius, center.z);
    
    return { centerSample, forwardSample, backSample, leftSample, rightSample };
  };

  // Movement state
  const [movementState, setMovementState] = useState<MovementState>(() => {
    const baseOffset = index * 0.3;
    const radius = 0.6 + baseOffset;
    const angle = (index / totalPets) * Math.PI * 2;
    
    return {
      position: new Vector3(
        Math.cos(angle) * radius,
        animalConfig.groundClearance,
        Math.sin(angle) * radius
      ),
      velocity: new Vector3(),
      targetDirection: new Vector3(1, 0, 0),
      speed: 0,
      currentAnimation: 'idle',
      isOnGround: true,
      surfaceNormal: new Vector3(0, 1, 0),
      groundClearance: animalConfig.groundClearance
    };
  });

  // Simple circular movement pattern with randomness
  const updateMovementTarget = (state: MovementState, deltaTime: number) => {
    const time = Date.now() * 0.001 + index * 2;
    const baseRadius = 0.7;
    const radiusVariation = Math.sin(time * 0.3) * 0.2;
    const radius = baseRadius + radiusVariation;
    
    // Circular movement with slight randomness
    const circleSpeed = animalConfig.moveSpeed * 0.5;
    const angle = time * circleSpeed + index * 1.5;
    const randomWander = Math.sin(time * 1.2 + index) * 0.1;
    
    const targetX = Math.cos(angle) * radius + randomWander;
    const targetZ = Math.sin(angle) * radius + randomWander * 0.5;
    
    // Calculate direction to target
    const direction = tempVector.set(targetX - state.position.x, 0, targetZ - state.position.z);
    const distance = direction.length();
    
    if (distance > 0.1) {
      direction.normalize();
      state.targetDirection.lerp(direction, deltaTime * animalConfig.turnSpeed);
      state.targetDirection.normalize();
      
      // Calculate speed based on distance and movement pattern
      const targetSpeed = Math.min(distance * 2, animalConfig.moveSpeed);
      state.speed = Math.max(0.05, targetSpeed);
    } else {
      state.speed *= 0.9; // Slow down when near target
    }
  };

  // Update island meshes when island ref changes
  useEffect(() => {
    if (!islandRef?.current) return;
    
    const meshes: Mesh[] = [];
    islandRef.current.traverse((child) => {
      if ((child as any).isMesh) {
        meshes.push(child as Mesh);
      }
    });
    setIslandMeshes(meshes);
  }, [islandRef]);

  // Animation system based on speed
  const getAnimationForSpeed = (speed: number): string => {
    if (speed < 0.1) return 'idle';
    if (speed < 0.25) return 'Animation1'; // Slow walk
    return 'Animation2'; // Fast walk
  };

  // Current animation state
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  
  // Load GLB model
  const { scene, animations } = useGLTF(modelPath);
  
  // Clone scene with proper setup
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
  
  const { actions, mixer } = useAnimations(animations, groupRef);

  // Log available animations
  useEffect(() => {
    console.log(`🐼 ${animalType} animations:`, animations.map(a => a.name));
  }, [animations, animalType]);

  // Handle animation changes with speed-based animation selection
  useEffect(() => {
    if (!mixer || animations.length === 0) return;

    const findAndPlayAnimation = (targetAnim: string) => {
      // Try to find exact match first
      let anim = animations.find(a => a.name.toLowerCase() === targetAnim.toLowerCase());
      
      // Try Animation1 and Animation2 specifically
      if (!anim && targetAnim === 'Animation1') {
        anim = animations.find(a => 
          a.name === 'Animation1' ||
          a.name.toLowerCase().includes('walk') ||
          a.name.toLowerCase().includes('slow')
        );
      } else if (!anim && targetAnim === 'Animation2') {
        anim = animations.find(a => 
          a.name === 'Animation2' ||
          a.name.toLowerCase().includes('run') ||
          a.name.toLowerCase().includes('fast')
        );
      } else if (!anim && targetAnim === 'idle') {
        anim = animations.find(a => 
          a.name.toLowerCase().includes('idle') || 
          a.name.toLowerCase().includes('stand') ||
          a.name.toLowerCase().includes('rest')
        );
      }
      
      // Fallback: use walk animation for Animation1/Animation2, first animation for others
      if (!anim) {
        if (targetAnim === 'Animation1' || targetAnim === 'Animation2') {
          anim = animations.find(a => 
            a.name.toLowerCase().includes('walk') || 
            a.name.toLowerCase().includes('move')
          );
        }
        if (!anim && animations.length > 0) {
          anim = animations[0];
        }
      }
      
      if (anim && actions[anim.name]) {
        // Stop all current animations with fade
        Object.values(actions).forEach(action => {
          if (action && action.isRunning()) {
            action.fadeOut(0.2);
          }
        });
        
        // Start new animation with fade in
        const action = actions[anim.name];
        action.reset();
        action.fadeIn(0.2);
        action.play();
        
        // Adjust playback speed for different animations
        if (targetAnim === 'Animation1') {
          action.setEffectiveTimeScale(0.8); // Slower for Animation1
        } else if (targetAnim === 'Animation2') {
          action.setEffectiveTimeScale(1.2); // Faster for Animation2
        } else {
          action.setEffectiveTimeScale(1.0);
        }
        
        console.log(`🐾 ${animalType}: Playing "${anim.name}" for "${targetAnim}"`);
      }
    };

    findAndPlayAnimation(currentAnimation);
  }, [currentAnimation, actions, animations, animalType, mixer]);

  // Main update loop with natural movement and slope awareness
  useFrame((state, delta) => {
    if (!groupRef.current || !isActive) return;

    // Update animation mixer
    if (mixer) {
      mixer.update(delta);
    }

    setMovementState(prevState => {
      const newState = { ...prevState };
      
      // Update movement target and speed
      updateMovementTarget(newState, delta);
      
      // Apply movement with slope awareness
      if (newState.speed > 0.05) {
        // Calculate movement vector
        const movement = tempVector.copy(newState.targetDirection).multiplyScalar(newState.speed * delta);
        
        // Update position
        newState.position.add(movement);
        
        // Sample terrain at new position with multi-point sampling for slope awareness
        const terrainSamples = sampleTerrainMultiple(newState.position);
        const { centerSample, forwardSample } = terrainSamples;
        
        if (centerSample.isValid) {
          // Update height to match terrain
          newState.position.y = centerSample.height;
          newState.surfaceNormal.copy(centerSample.normal);
          newState.isOnGround = true;
          
          // Forward-looking slope detection
          if (forwardSample.isValid) {
            const slopeAngle = Math.acos(centerSample.normal.dot(upVector));
            const maxSlopeAngle = Math.PI / 6; // 30 degrees max
            
            if (slopeAngle > maxSlopeAngle) {
              // Too steep, slow down or change direction
              newState.speed *= 0.5;
              
              // Slightly adjust direction to go around steep slopes
              const avoidance = sideVector.copy(newState.targetDirection).cross(upVector).normalize().multiplyScalar(0.1);
              newState.targetDirection.add(avoidance).normalize();
            }
          }
        } else {
          // No terrain found, stay at safe height
          newState.position.y = animalConfig.groundClearance;
          newState.surfaceNormal.set(0, 1, 0);
          newState.isOnGround = false;
        }
        
        // Update velocity for smooth movement
        newState.velocity.copy(movement).multiplyScalar(1 / delta);
      } else {
        // Slowing down or stopped
        newState.velocity.multiplyScalar(0.8);
      }
      
      return newState;
    });

    // Apply position to mesh
    groupRef.current.position.copy(movementState.position);
    
    // Slope-aware rotation
    if (movementState.speed > 0.1) {
      // Look in movement direction
      const lookTarget = tempVector.copy(movementState.position).add(movementState.targetDirection);
      
      // Adjust look target for slopes
      if (movementState.isOnGround) {
        const forward = forwardVector.copy(movementState.targetDirection);
        const right = sideVector.crossVectors(forward, movementState.surfaceNormal).normalize();
        forward.crossVectors(movementState.surfaceNormal, right).normalize();
        
        lookTarget.copy(movementState.position).add(forward);
      }
      
      groupRef.current.lookAt(lookTarget);
    } else {
      // Gentle idle rotation
      const idleRotation = Math.sin(state.clock.elapsedTime * 0.4 + index) * 0.2;
      const lookTarget = tempVector.copy(movementState.position);
      lookTarget.x += Math.cos(idleRotation);
      lookTarget.z += Math.sin(idleRotation);
      groupRef.current.lookAt(lookTarget);
    }
    
    // Update animation based on speed
    const targetAnimation = getAnimationForSpeed(movementState.speed);
    if (currentAnimation !== targetAnimation) {
      setCurrentAnimation(targetAnimation);
    }

    // Tilt mesh to match surface normal for realistic slope adaptation
    if (movementState.isOnGround && movementState.surfaceNormal.length() > 0) {
      const tiltAmount = 0.3; // How much to tilt based on slope
      const currentUp = new Vector3(0, 1, 0);
      const targetUp = movementState.surfaceNormal.clone();
      currentUp.lerp(targetUp, tiltAmount * delta);
      
      // Apply subtle tilt without disrupting the look-at rotation
      const currentQuaternion = groupRef.current.quaternion.clone();
      groupRef.current.up.copy(currentUp);
      groupRef.current.quaternion.slerp(currentQuaternion, 0.8);
    }

    // Debug logging (reduced frequency)
    if (Math.floor(state.clock.elapsedTime) % 5 === 0 && Math.floor(state.clock.elapsedTime * 10) % 50 === 0) {
      console.log(`🐾 ${animalType}: Speed: ${movementState.speed.toFixed(2)} | Anim: ${currentAnimation} | OnGround: ${movementState.isOnGround}`);
    }
  });

  // Set initial position
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(movementState.position);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (groupRef.current) {
        disposeObject3D(groupRef.current);
      }
      if (mixer) {
        mixer.stopAllAction();
        mixer.uncacheRoot(groupRef.current!);
      }
    };
  }, [disposeObject3D, mixer]);

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={sceneClone} />
    </group>
  );
};
