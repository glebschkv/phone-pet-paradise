import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Mesh, MathUtils, Raycaster, Box3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { use3DCleanup } from '@/hooks/use3DCleanup';
import { ANIMAL_DATABASE } from '@/data/AnimalDatabase';
import { AnimationController } from './waypoints/AnimationController';

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
  rotation: number;
  targetRotation: number;
  isMoving: boolean;
  currentSpeed: number;
  targetPoint: Vector3;
  pathPoints: Vector3[];
  currentPathIndex: number;
  idleTimer: number;
  moveTimer: number;
  lastValidPosition: Vector3;
  stuckCounter: number;
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
  const { disposeObject3D } = use3DCleanup({
    autoCleanup: true,
    cleanupInterval: 60000,
    enableLogging: false,
  });

  const groupRef = useRef<Group>(null);
  const [islandMeshes, setIslandMeshes] = useState<Mesh[]>([]);
  const [modelError, setModelError] = useState(false);
  const [animationController, setAnimationController] = useState<AnimationController | null>(null);
  
  // Raycaster for ground detection
  const raycaster = useMemo(() => new Raycaster(), []);
  const downVector = useMemo(() => new Vector3(0, -1, 0), []);
  const upVector = useMemo(() => new Vector3(0, 1, 0), []);
  
  // Get animal data
  const animalData = useMemo(() => 
    ANIMAL_DATABASE.find(animal => animal.name.toLowerCase() === animalType.toLowerCase()) ||
    ANIMAL_DATABASE[0],
    [animalType]
  );
  
  // Animal size configuration
  const animalConfig = useMemo(() => {
    const name = animalData.name.toLowerCase();
    let size = 'medium';
    let speed = 0.5;
    let turnSpeed = 2.0;
    
    if (['rabbit', 'squirrel', 'rat', 'mouse', 'hamster'].some(s => name.includes(s))) {
      size = 'small';
      speed = 0.8;
      turnSpeed = 3.0;
    } else if (['elephant', 'bear', 'lion', 'tiger', 'giraffe', 'rhino'].some(l => name.includes(l))) {
      size = 'large';
      speed = 0.3;
      turnSpeed = 1.5;
    }
    
    return {
      size,
      speed: speed + (Math.random() - 0.5) * 0.2, // Add variation
      turnSpeed,
      groundOffset: size === 'small' ? 0.1 : size === 'large' ? 0.3 : 0.2,
      raycastDistance: size === 'small' ? 2 : size === 'large' ? 5 : 3,
    };
  }, [animalData]);

  // Movement state
  const [movement] = useState<MovementState>(() => {
    // Start at a random position around the island
    const angle = (index / Math.max(totalPets, 1)) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 2 + Math.random() * 3;
    return {
      position: new Vector3(
        Math.cos(angle) * radius,
        2, // Start high and drop to ground
        Math.sin(angle) * radius
      ),
      velocity: new Vector3(0, 0, 0),
      rotation: angle,
      targetRotation: angle,
      isMoving: false,
      currentSpeed: 0,
      targetPoint: new Vector3(),
      pathPoints: [],
      currentPathIndex: 0,
      idleTimer: Math.random() * 3,
      moveTimer: 0,
      lastValidPosition: new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius),
      stuckCounter: 0
    };
  });

  // Load and setup model
  let scene, animations, mixer;
  try {
    const gltf = useGLTF(modelPath);
    scene = gltf.scene;
    animations = gltf.animations;
    
    // Clone scene safely
    const sceneClone = useMemo(() => {
      if (!scene) {
        console.error(`❌ No scene loaded for ${animalType}`);
        return null;
      }
      
      try {
        // Check if scene has content
        let hasMeshes = false;
        scene.traverse((child) => {
          if ((child as any).isMesh) hasMeshes = true;
        });
        
        if (!hasMeshes) {
          console.error(`❌ No meshes found in ${modelPath}`);
          setModelError(true);
          return null;
        }
        
        const cloned = SkeletonUtils.clone(scene);
        cloned.traverse((child) => {
          if ((child as any).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        return cloned;
      } catch (error) {
        console.error(`❌ Failed to clone scene for ${animalType}:`, error);
        setModelError(true);
        return null;
      }
    }, [scene]);
    
    const animationResult = useAnimations(animations || [], groupRef);
    mixer = animationResult.mixer;
  } catch (error) {
    console.error(`❌ Failed to load model ${modelPath}:`, error);
    setModelError(true);
  }

  // Update island meshes
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

  // Initialize animation controller
  useEffect(() => {
    if (!mixer || !animations || animations.length === 0) return;
    
    const animationMap = {
      walk: ['walk', 'walking', 'run', 'running', 'move', 'locomotion'],
      idle: ['idle', 'stand', 'rest', 'breathing', 'default', 'survey'],
      special: ['eating', 'drinking', 'sitting', 'lying', 'stretching']
    };
    
    const controller = new AnimationController(mixer, animations, animationMap);
    setAnimationController(controller);
    
    return () => controller.dispose();
  }, [mixer, animations]);

  // Helper function to get ground height at position
  const getGroundHeight = (position: Vector3): number | null => {
    if (islandMeshes.length === 0) return null;
    
    // Cast ray from above position downward
    const rayOrigin = new Vector3(position.x, position.y + animalConfig.raycastDistance, position.z);
    raycaster.set(rayOrigin, downVector);
    
    const intersects = raycaster.intersectObjects(islandMeshes, true);
    
    if (intersects.length > 0) {
      // Return the highest point (first intersection from above)
      return intersects[0].point.y + animalConfig.groundOffset;
    }
    
    // Try casting from below as backup
    rayOrigin.y = position.y - animalConfig.raycastDistance;
    raycaster.set(rayOrigin, upVector);
    const intersectsUp = raycaster.intersectObjects(islandMeshes, true);
    
    if (intersectsUp.length > 0) {
      return intersectsUp[0].point.y + animalConfig.groundOffset;
    }
    
    return null;
  };

  // Helper function to check if position is valid (not inside geometry)
  const isValidPosition = (position: Vector3): boolean => {
    if (islandMeshes.length === 0) return true;
    
    // Check if we can find ground at this position
    const groundHeight = getGroundHeight(position);
    if (groundHeight === null) return false;
    
    // Check if the height difference is reasonable (not inside a cliff)
    const heightDiff = Math.abs(position.y - groundHeight);
    return heightDiff < 2.0; // Allow some vertical tolerance
  };

  // Generate a new random target point
  const generateNewTarget = (): Vector3 => {
    const angleOffset = (Math.random() - 0.5) * Math.PI;
    const distance = 2 + Math.random() * 3;
    
    const newAngle = movement.rotation + angleOffset;
    const target = new Vector3(
      movement.position.x + Math.cos(newAngle) * distance,
      movement.position.y,
      movement.position.z + Math.sin(newAngle) * distance
    );
    
    // Clamp to reasonable bounds
    const maxDist = 8;
    if (target.length() > maxDist) {
      target.normalize().multiplyScalar(maxDist);
    }
    
    return target;
  };

  // Main update loop
  useFrame((state, delta) => {
    if (!groupRef.current || !isActive || modelError) return;
    
    // Clamp delta to prevent huge jumps
    delta = Math.min(delta, 0.1);
    
    // Update timers
    if (movement.isMoving) {
      movement.moveTimer += delta;
    } else {
      movement.idleTimer -= delta;
    }
    
    // Decide on behavior
    if (!movement.isMoving && movement.idleTimer <= 0) {
      // Start moving to a new target
      movement.targetPoint = generateNewTarget();
      movement.isMoving = true;
      movement.moveTimer = 0;
      movement.currentSpeed = 0;
      
      // Calculate target rotation
      const direction = movement.targetPoint.clone().sub(movement.position);
      if (direction.length() > 0.1) {
        movement.targetRotation = Math.atan2(direction.x, direction.z);
      }
    }
    
    if (movement.isMoving) {
      // Check if we've been moving too long or reached target
      const distToTarget = movement.position.distanceTo(movement.targetPoint);
      
      if (distToTarget < 0.5 || movement.moveTimer > 5 + Math.random() * 5) {
        // Stop and idle
        movement.isMoving = false;
        movement.idleTimer = 2 + Math.random() * 3;
        movement.currentSpeed = 0;
      } else {
        // Move towards target
        const direction = new Vector3().subVectors(movement.targetPoint, movement.position);
        direction.y = 0; // Keep movement horizontal
        direction.normalize();
        
        // Accelerate/decelerate smoothly
        const targetSpeed = animalConfig.speed;
        movement.currentSpeed = MathUtils.lerp(movement.currentSpeed, targetSpeed, delta * 2);
        
        // Calculate next position
        const nextPos = movement.position.clone().add(
          direction.multiplyScalar(movement.currentSpeed * delta)
        );
        
        // Get ground height at next position
        const groundHeight = getGroundHeight(nextPos);
        
        if (groundHeight !== null) {
          // Smoothly adjust to ground height
          nextPos.y = MathUtils.lerp(movement.position.y, groundHeight, delta * 5);
          
          // Check if position is valid
          if (isValidPosition(nextPos)) {
            movement.position.copy(nextPos);
            movement.lastValidPosition.copy(nextPos);
            movement.stuckCounter = 0;
          } else {
            // Position invalid, try to recover
            movement.stuckCounter++;
            if (movement.stuckCounter > 10) {
              // We're stuck, generate new target
              movement.targetPoint = generateNewTarget();
              movement.stuckCounter = 0;
            }
          }
        } else {
          // No ground found, stay at last valid position
          movement.position.copy(movement.lastValidPosition);
          // Generate new target
          movement.targetPoint = generateNewTarget();
        }
      }
    } else {
      // Idle - just maintain ground contact
      const groundHeight = getGroundHeight(movement.position);
      if (groundHeight !== null) {
        movement.position.y = MathUtils.lerp(movement.position.y, groundHeight, delta * 3);
      }
    }
    
    // Smooth rotation
    movement.rotation = MathUtils.lerp(
      movement.rotation,
      movement.targetRotation,
      delta * animalConfig.turnSpeed
    );
    
    // Apply to group
    groupRef.current.position.copy(movement.position);
    groupRef.current.rotation.y = movement.rotation;
    
    // Add subtle idle animation
    if (!movement.isMoving) {
      const breathe = Math.sin(state.clock.elapsedTime * 2 + index) * 0.01;
      groupRef.current.position.y += breathe;
    }
    
    // Update animations
    if (animationController) {
      const context = movement.isMoving ? 'moving' : 'idle';
      animationController.updateAnimation(movement.currentSpeed, context, delta);
    }
  });

  // Cleanup
  useEffect(() => {
    return () => {
      if (groupRef.current) {
        disposeObject3D(groupRef.current);
      }
      if (animationController) {
        animationController.dispose();
      }
      if (mixer && groupRef.current) {
        mixer.stopAllAction();
        mixer.uncacheRoot(groupRef.current);
      }
    };
  }, [disposeObject3D, mixer, animationController]);

  // Handle model error
  if (modelError) {
    console.error(`Failed to load ${animalType} model`);
    return null;
  }

  // Don't render if no scene
  if (!scene) {
    return null;
  }

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {scene && <primitive object={scene} />}
    </group>
  );
};

GLBAnimal.displayName = 'GLBAnimal';