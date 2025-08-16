import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3, Raycaster, Mesh, Object3D, BufferGeometry, Material } from 'three';
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

interface MovementState {
  isWalking: boolean;
  pauseTimer: number;
  nextDirectionChange: number;
  lastRaycastTime: number;
  currentSpeed: number;
  targetSpeed: number;
  stuckCounter: number;
  lastPosition: Vector3;
}

interface PositionState {
  x: number;
  z: number;
  y: number;
  targetAngle: number;
  actualAngle: number; // Current facing direction
  velocity: Vector3;
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
  const upVector = useMemo(() => new Vector3(0, 1, 0), []);
  const forwardVector = useMemo(() => new Vector3(), []);
  const rightVector = useMemo(() => new Vector3(), []);
  
  // Enhanced position state
  const [position, setPosition] = useState<PositionState>(() => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.8; // Start closer to center
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      y: 0.5, // Will be corrected by raycasting
      targetAngle: angle,
      actualAngle: angle,
      velocity: new Vector3()
    };
  });

  // Enhanced movement state
  const [movementState, setMovementState] = useState<MovementState>({
    isWalking: false,
    pauseTimer: Math.random() * 2,
    nextDirectionChange: Math.random() * 3 + 2,
    lastRaycastTime: 0,
    currentSpeed: 0,
    targetSpeed: 0,
    stuckCounter: 0,
    lastPosition: new Vector3(position.x, position.y, position.z)
  });
  
  // Load GLB model
  const { scene, animations } = useGLTF(modelPath);
  
  // Clone scene with proper shadow setup
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

  // Enhanced surface detection with better mesh finding
  const getSurfaceInformation = (x: number, z: number, raycastForce: boolean = false): { 
    height: number; 
    normal?: Vector3; 
    slope: number;
    isValidSurface: boolean;
    surfaceType: 'island' | 'water' | 'void';
  } => {
    // Cache raycasting for performance, unless forced
    const currentTime = Date.now();
    if (!raycastForce && currentTime - movementState.lastRaycastTime < 50) {
      return { 
        height: position.y, 
        slope: 0, 
        isValidSurface: true, 
        surfaceType: 'island' 
      };
    }

    // Cast ray from high above
    tempVector.set(x, 50, z);
    raycaster.set(tempVector, new Vector3(0, -1, 0));
    
    let allMeshes: Mesh[] = [];
    let islandMeshes: Mesh[] = [];
    
    // Collect island meshes with better detection
    if (islandRef?.current) {
      console.log(`🎯 ${animalType}: Checking island reference for meshes`);
      islandRef.current.traverse((child: Object3D) => {
        if (child instanceof Mesh && child.visible && child.geometry) {
          // Ensure the mesh has proper geometry
          const geometry = child.geometry as BufferGeometry;
          if (geometry.attributes.position && geometry.attributes.position.count > 0) {
            islandMeshes.push(child);
            console.log(`🎯 ${animalType}: Found island mesh:`, child.name || 'unnamed', 'vertices:', geometry.attributes.position.count);
          }
        }
      });
    }
    
    // Collect all scene meshes as fallback
    threeScene.traverse((child: Object3D) => {
      if (child instanceof Mesh && child.visible && child.geometry) {
        const geometry = child.geometry as BufferGeometry;
        if (geometry.attributes.position && geometry.attributes.position.count > 0) {
          allMeshes.push(child);
        }
      }
    });

    console.log(`🎯 ${animalType}: Found ${islandMeshes.length} island meshes, ${allMeshes.length} total meshes`);

    // Test intersection with island meshes first
    if (islandMeshes.length > 0) {
      const intersects = raycaster.intersectObjects(islandMeshes, false);
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const normal = intersection.face?.normal?.clone();
        
        if (normal) {
          // Transform normal to world space
          normal.transformDirection(intersection.object.matrixWorld);
          normal.normalize();
          
          // Calculate slope (angle from vertical)
          const slope = Math.acos(Math.abs(normal.dot(upVector)));
          const surfaceHeight = intersection.point.y + 0.05; // Small offset
          
          console.log(`🎯 ${animalType}: Hit island at height ${surfaceHeight.toFixed(2)}, slope ${(slope * 180 / Math.PI).toFixed(1)}°`);
          
          setMovementState(prev => ({ ...prev, lastRaycastTime: currentTime }));
          
          return {
            height: surfaceHeight,
            normal,
            slope,
            isValidSurface: slope < Math.PI / 3, // Max 60° slope
            surfaceType: 'island'
          };
        }
      }
    }
    
    // Fallback to all meshes
    if (allMeshes.length > 0) {
      const intersects = raycaster.intersectObjects(allMeshes, false);
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const normal = intersection.face?.normal?.clone();
        
        if (normal) {
          normal.transformDirection(intersection.object.matrixWorld);
          normal.normalize();
          const slope = Math.acos(Math.abs(normal.dot(upVector)));
          const surfaceHeight = intersection.point.y + 0.05;
          
          console.log(`🎯 ${animalType}: Hit surface at height ${surfaceHeight.toFixed(2)} (fallback)`);
          
          setMovementState(prev => ({ ...prev, lastRaycastTime: currentTime }));
          
          return {
            height: surfaceHeight,
            normal,
            slope,
            isValidSurface: slope < Math.PI / 3,
            surfaceType: surfaceHeight < 0 ? 'water' : 'island'
          };
        }
      }
    }
    
    // No intersection found
    console.warn(`🎯 ${animalType}: No surface found at (${x.toFixed(2)}, ${z.toFixed(2)}), using fallback`);
    return { 
      height: 0.2, // Default above water level
      slope: 0, 
      isValidSurface: false, 
      surfaceType: 'void' 
    };
  };

  // Enhanced movement with collision avoidance
  const updateMovement = (delta: number) => {
    const maxRadius = 1.5; // Island boundary
    const baseSpeed = 0.4;
    const turnSpeed = 2.0;
    
    // Update timers
    setMovementState(prev => ({
      ...prev,
      pauseTimer: Math.max(0, prev.pauseTimer - delta),
      nextDirectionChange: prev.nextDirectionChange - delta
    }));

    // Decide if should walk
    const shouldWalk = movementState.pauseTimer <= 0 && isActive;
    
    if (shouldWalk !== movementState.isWalking) {
      setMovementState(prev => ({
        ...prev,
        isWalking: shouldWalk,
        pauseTimer: shouldWalk ? 0 : Math.random() * 3 + 1,
        nextDirectionChange: shouldWalk ? Math.random() * 4 + 2 : prev.nextDirectionChange,
        targetSpeed: shouldWalk ? baseSpeed : 0
      }));
    }

    // Change direction periodically or when stuck
    if (movementState.nextDirectionChange <= 0 || movementState.stuckCounter > 20) {
      const newAngle = Math.random() * Math.PI * 2;
      setPosition(prev => ({ ...prev, targetAngle: newAngle }));
      setMovementState(prev => ({
        ...prev,
        nextDirectionChange: Math.random() * 5 + 3,
        stuckCounter: 0
      }));
      console.log(`🎯 ${animalType}: Changing direction to ${(newAngle * 180 / Math.PI).toFixed(0)}°`);
    }

    if (movementState.isWalking) {
      // Smooth angle interpolation
      let angleDiff = position.targetAngle - position.actualAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      const newActualAngle = position.actualAngle + angleDiff * turnSpeed * delta;
      
      // Get surface info for current position
      const surfaceInfo = getSurfaceInformation(position.x, position.z);
      
      // Adjust speed based on slope
      let speedMultiplier = 1.0;
      if (surfaceInfo.slope > 0) {
        speedMultiplier = Math.max(0.3, 1.0 - surfaceInfo.slope * 0.5); // Slower on slopes
      }
      
      // Smooth speed transition
      const targetSpeed = movementState.targetSpeed * speedMultiplier;
      const newSpeed = movementState.currentSpeed + (targetSpeed - movementState.currentSpeed) * 3 * delta;
      
      // Calculate movement
      const moveDistance = newSpeed * delta;
      forwardVector.set(Math.cos(newActualAngle), 0, Math.sin(newActualAngle));
      
      let newX = position.x + forwardVector.x * moveDistance;
      let newZ = position.z + forwardVector.z * moveDistance;
      
      // Boundary checking with surface validation
      const distanceFromCenter = Math.sqrt(newX * newX + newZ * newZ);
      const futureSurfaceInfo = getSurfaceInformation(newX, newZ, true);
      
      // Avoid water and invalid surfaces
      if (distanceFromCenter > maxRadius || 
          futureSurfaceInfo.surfaceType === 'water' || 
          !futureSurfaceInfo.isValidSurface ||
          futureSurfaceInfo.slope > Math.PI / 4) { // 45° max slope
        
        // Turn away from boundary/obstacle
        const avoidanceAngle = Math.atan2(-newZ, -newX) + (Math.random() - 0.5) * Math.PI;
        setPosition(prev => ({ ...prev, targetAngle: avoidanceAngle }));
        
        console.log(`🎯 ${animalType}: Avoiding boundary/obstacle, turning to ${(avoidanceAngle * 180 / Math.PI).toFixed(0)}°`);
        
        // Don't move, just turn
        setMovementState(prev => ({ ...prev, stuckCounter: prev.stuckCounter + 1 }));
      } else {
        // Valid movement
        setPosition(prev => ({
          ...prev,
          x: newX,
          z: newZ,
          actualAngle: newActualAngle
        }));
        
        // Check if actually moved (unstuck detection)
        const positionDelta = Math.abs(newX - movementState.lastPosition.x) + Math.abs(newZ - movementState.lastPosition.z);
        if (positionDelta > 0.01) {
          setMovementState(prev => ({ 
            ...prev, 
            stuckCounter: 0,
            lastPosition: new Vector3(newX, position.y, newZ)
          }));
        } else {
          setMovementState(prev => ({ ...prev, stuckCounter: prev.stuckCounter + 1 }));
        }
      }
      
      setMovementState(prev => ({ ...prev, currentSpeed: newSpeed }));
    }
  };

  // Handle animations
  useEffect(() => {
    if (!mixer || animations.length === 0) return;

    const playAnimation = (namePattern: string[], fallback: boolean = false) => {
      const anim = animations.find(anim => 
        namePattern.some(pattern => anim.name.toLowerCase().includes(pattern.toLowerCase()))
      );
      
      if (anim && actions[anim.name]) {
        Object.values(actions).forEach(action => action?.stop());
        const action = actions[anim.name];
        action.reset().fadeIn(0.2).play();
        console.log(`🎭 ${animalType}: Playing animation "${anim.name}"`);
        return true;
      } else if (fallback && animations.length > 0) {
        const action = actions[animations[0].name];
        action?.reset().fadeIn(0.2).play();
        return true;
      }
      return false;
    };

    if (movementState.isWalking) {
      playAnimation(['walk', 'run', 'move'], true);
    } else {
      playAnimation(['idle', 'stand'], true);
    }

  }, [actions, animations, animalType, mixer, movementState.isWalking]);

  // Main update loop
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update animation mixer
    if (mixer) {
      mixer.update(delta);
    }

    // Update movement
    updateMovement(delta);

    // Get current surface information
    const surfaceInfo = getSurfaceInformation(position.x, position.z);
    
    // Update Y position smoothly
    const targetY = surfaceInfo.height;
    const currentY = position.y;
    const newY = currentY + (targetY - currentY) * 8 * delta; // Smooth Y interpolation
    
    setPosition(prev => ({ ...prev, y: newY }));

    // Set position
    groupRef.current.position.set(position.x, newY, position.z);
    
    // Surface normal alignment
    if (surfaceInfo.normal) {
      // Calculate rotation to align with surface normal
      const normal = surfaceInfo.normal;
      const tiltStrength = 0.4; // How much to tilt with surface
      
      // Convert surface normal to rotation
      const rightTilt = -Math.atan2(normal.x, normal.y) * tiltStrength;
      const forwardTilt = Math.atan2(normal.z, normal.y) * tiltStrength;
      
      // Apply rotations smoothly
      groupRef.current.rotation.x += (forwardTilt - groupRef.current.rotation.x) * 3 * delta;
      groupRef.current.rotation.z += (rightTilt - groupRef.current.rotation.z) * 3 * delta;
    }
    
    // Face movement direction
    if (movementState.isWalking && movementState.currentSpeed > 0.1) {
      const lookTarget = tempVector.set(
        position.x + Math.cos(position.actualAngle),
        newY,
        position.z + Math.sin(position.actualAngle)
      );
      groupRef.current.lookAt(lookTarget);
    } else {
      // Idle looking around
      const idleLookAngle = position.actualAngle + Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.2;
      const lookTarget = tempVector.set(
        position.x + Math.cos(idleLookAngle),
        newY,
        position.z + Math.sin(idleLookAngle)
      );
      groupRef.current.lookAt(lookTarget);
    }

    // Debug logging (reduced frequency)
    if (Math.floor(state.clock.elapsedTime * 2) % 20 === 0 && Math.floor(state.clock.elapsedTime * 20) % 100 === 0) {
      console.log(`🐼 ${animalType}: ${movementState.isWalking ? 'Walking' : 'Idle'} | Pos: (${position.x.toFixed(1)}, ${newY.toFixed(1)}, ${position.z.toFixed(1)}) | Surface: ${surfaceInfo.surfaceType} | Slope: ${(surfaceInfo.slope * 180 / Math.PI).toFixed(1)}°`);
    }
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={sceneClone} />
    </group>
  );
};
