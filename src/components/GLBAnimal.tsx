import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Mesh, MathUtils } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { use3DCleanup } from '@/hooks/use3DCleanup';
import { ANIMAL_DATABASE } from '@/data/AnimalDatabase';
import { ImprovedWaypointGenerator, SmartWaypoint, AnimalBehavior } from './waypoints/ImprovedWaypointGenerator';
import { ImprovedTerrainNavigator } from './waypoints/ImprovedTerrainNavigator';
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

interface SmoothMovementState {
  currentPosition: Vector3;
  targetPosition: Vector3;
  currentRotation: number;
  targetRotation: number;
  velocity: Vector3;
  isMoving: boolean;
  movementSpeed: number;
  rotationSpeed: number;
  groundCheckTimer: number;
  stuckTimer: number; // Timer to detect if animal is stuck
  lastPosition: Vector3;
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

  console.log(`🐼 GLBAnimal: Starting initialization for ${animalType} with model ${modelPath}`);

  const groupRef = useRef<Group>(null);
  const tempVector = useMemo(() => new Vector3(), []);
  const tempVector2 = useMemo(() => new Vector3(), []);

  // Cache for island meshes
  const [islandMeshes, setIslandMeshes] = useState<Mesh[]>([]);

  // Improved terrain navigator
  const terrainNavigator = useMemo(() => new ImprovedTerrainNavigator(), []);
  const waypointGenerator = useMemo(() => new ImprovedWaypointGenerator(), []);
  
  // Get animal data from database
  const animalData = useMemo(() => 
    ANIMAL_DATABASE.find(animal => animal.name.toLowerCase() === animalType.toLowerCase()) ||
    ANIMAL_DATABASE[0], // Fallback to first animal
    [animalType]
  );
  
  // Smart waypoints
  const [smartWaypoints, setSmartWaypoints] = useState<SmartWaypoint[]>([]);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);

  // Animation controller
  const [animationController, setAnimationController] = useState<AnimationController | null>(null);
  
  // Get animal size for navigation
  const animalSize = useMemo(() => {
    console.log(`🐼 GLBAnimal: Initializing ${animalType} with animal data:`, animalData.name);
    const name = animalData.name.toLowerCase();
    if (['rabbit', 'squirrel', 'rat', 'fish', 'crab'].some(s => name.includes(s))) return 'small';
    if (['elephant', 'whale', 'bear', 'lion', 'tiger', 'giraffe'].some(l => name.includes(l))) return 'large';
    return 'medium';
  }, [animalData.name, animalType]);

  // Smooth movement state
  const [movementState, setMovementState] = useState<SmoothMovementState>(() => ({
    currentPosition: new Vector3(0, 0, 0),
    targetPosition: new Vector3(0, 0, 0),
    currentRotation: 0,
    targetRotation: 0,
    velocity: new Vector3(0, 0, 0),
    isMoving: false,
    movementSpeed: 0.3 + Math.random() * 0.2, // Varied speed per animal
    rotationSpeed: 2.0,
    groundCheckTimer: 0,
    stuckTimer: 0,
    lastPosition: new Vector3(0, 0, 0)
  }));

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

    console.log(`🏝️ ${animalType}: Found ${meshes.length} island meshes for collision`);
  }, [islandRef, animalType]);

  // Generate waypoints
  useEffect(() => {
    if (islandMeshes.length === 0) return;

    const waypoints = waypointGenerator.generateWaypoints(animalData, index, islandMeshes);
    setSmartWaypoints(waypoints);

    if (waypoints.length > 0) {
      setMovementState(prev => ({
        ...prev,
        currentPosition: waypoints[0].position.clone(),
        targetPosition: waypoints[0].position.clone(),
        lastPosition: waypoints[0].position.clone()
      }));
    }

    console.log(`🎯 ${animalData.name}: Generated ${waypoints.length} waypoints`);
  }, [islandMeshes, animalData, index, waypointGenerator]);


  // Load GLB model
  console.log(`🎭 GLBAnimal: Loading GLB model from ${modelPath}`);
  const { scene, animations } = useGLTF(modelPath);
  
  // Clone scene with proper setup and validation
  const sceneClone = useMemo(() => {
    console.log(`🔄 GLBAnimal: Original scene for ${animalType}:`, scene);
    console.log(`📊 GLBAnimal: Original scene children count: ${scene.children.length}`);
    
    // Check if GLB scene is valid (has actual 3D content)
    if (scene.children.length === 0) {
      console.error(`❌ GLBAnimal: GLB model ${modelPath} loaded but has no children! Triggering fallback to primitive.`);
      throw new Error(`GLB model ${modelPath} is empty - no 3D content found`);
    }
    
    // Validate that there are actual meshes in the scene
    let hasMeshes = false;
    scene.traverse((child) => {
      if ((child as any).isMesh) {
        hasMeshes = true;
      }
    });
    
    if (!hasMeshes) {
      console.error(`❌ GLBAnimal: GLB model ${modelPath} has no meshes! Triggering fallback to primitive.`);
      throw new Error(`GLB model ${modelPath} contains no meshes - invalid 3D model`);
    }
    
    try {
      const cloned = SkeletonUtils.clone(scene);
      console.log(`📊 GLBAnimal: Cloned scene children count: ${cloned.children.length}`);
      
      cloned.traverse((child) => {
        if ((child as any).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      console.log(`✅ GLBAnimal: Scene cloned successfully for ${animalType}`);
      return cloned;
    } catch (error) {
      console.error(`❌ GLBAnimal: Failed to clone scene for ${animalType}:`, error);
      throw new Error(`Failed to clone GLB model ${modelPath}: ${error}`);
    }
  }, [scene, animalType, modelPath]);
  
  const { mixer } = useAnimations(animations, groupRef);

  // Initialize animation controller
  useEffect(() => {
    if (!mixer || animations.length === 0) return;
    
    const animationMap = {
      walk: ['walk', 'walking', 'run', 'running', 'move'],
      idle: ['idle', 'stand', 'rest', 'breathing', 'default'],
      special: ['eating', 'drinking', 'sitting', 'lying', 'stretching']
    };
    
    const controller = new AnimationController(mixer, animations, animationMap);
    setAnimationController(controller);
    
    console.log(`🎬 ${animalType}: Animation controller initialized with ${animations.length} animations`);
    
    return () => controller.dispose();
  }, [mixer, animations, animalType]);


  // Main update loop with improved movement
  useFrame((state, delta) => {
    if (!groupRef.current || !isActive || smartWaypoints.length === 0) {
      // Fallback simple movement while waypoints are loading
      if (groupRef.current && isActive) {
        const radius = 1.5;
        const angle = (index * Math.PI * 2) / Math.max(totalPets, 1) + state.clock.elapsedTime * 0.1;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        // Use terrain navigation even for fallback positioning
        if (islandMeshes.length > 0) {
          const fallbackPos = new Vector3(x, 2, z); // Start high
          const groundResult = terrainNavigator.calculateMovement(
            fallbackPos,
            fallbackPos,
            islandMeshes,
            animalSize
          );

          if (groundResult.isOnGround) {
            groupRef.current.position.copy(groundResult.position);
            groupRef.current.rotation.y = angle + Math.PI / 2;
          }
        } else {
          groupRef.current.position.set(x, 0.3, z);
          groupRef.current.rotation.y = angle + Math.PI / 2;
        }
      }
      return;
    }

    setMovementState(prevState => {
      const newState = { ...prevState };

      // Update ground check timer
      newState.groundCheckTimer += delta;

      // Check if animal is stuck
      const distanceMoved = newState.currentPosition.distanceTo(newState.lastPosition);
      if (distanceMoved < 0.01 && newState.isMoving) {
        newState.stuckTimer += delta;

        // If stuck for too long, find new waypoint
        if (newState.stuckTimer > 2.0) {
          console.log(`🐾 ${animalType}: Animal stuck, finding new path`);
          setCurrentWaypointIndex((prev) => (prev + 1) % smartWaypoints.length);
          newState.stuckTimer = 0;
        }
      } else {
        newState.stuckTimer = 0;
        newState.lastPosition.copy(newState.currentPosition);
      }

      const currentWaypoint = smartWaypoints[currentWaypointIndex];
      if (!currentWaypoint) return newState;

      // Check if reached current waypoint
      const distanceToWaypoint = newState.currentPosition.distanceTo(currentWaypoint.position);

      if (distanceToWaypoint < 0.3) {
        // Reached waypoint, move to next one
        if (!newState.isMoving) {
          // Start moving to next waypoint
          const nextIndex = (currentWaypointIndex + 1) % smartWaypoints.length;
          const nextWaypoint = smartWaypoints[nextIndex];

          if (nextWaypoint) {
            newState.targetPosition.copy(nextWaypoint.position);
            newState.isMoving = true;

            // Calculate target rotation
            const direction = tempVector2.subVectors(nextWaypoint.position, newState.currentPosition);
            if (direction.length() > 0) {
              newState.targetRotation = Math.atan2(direction.x, direction.z);
            }

            console.log(`🎯 ${animalType}: Moving to waypoint ${nextIndex}`);
          }
        }
      } else if (!newState.isMoving) {
        // Not moving and not at waypoint, start moving towards current waypoint
        newState.targetPosition.copy(currentWaypoint.position);
        newState.isMoving = true;

        const direction = tempVector2.subVectors(currentWaypoint.position, newState.currentPosition);
        if (direction.length() > 0) {
          newState.targetRotation = Math.atan2(direction.x, direction.z);
        }
      }

      // Smooth movement towards target
      if (newState.isMoving) {
        // Calculate movement direction
        const moveDirection = tempVector.subVectors(newState.targetPosition, newState.currentPosition);

        if (moveDirection.length() < 0.1) {
          // Very close to target, stop moving
          newState.isMoving = false;
          setCurrentWaypointIndex((prev) => (prev + 1) % smartWaypoints.length);
        } else {
          moveDirection.normalize();

          // Use terrain navigator for movement
          const targetPos = tempVector2
            .copy(newState.currentPosition)
            .add(moveDirection.multiplyScalar(newState.movementSpeed * delta));

          const navResult = terrainNavigator.calculateMovement(
            newState.currentPosition,
            targetPos,
            islandMeshes,
            animalSize
          );

          if (navResult.canMove && navResult.isOnGround) {
            newState.currentPosition.copy(navResult.position);

            // Smooth rotation
            newState.currentRotation = MathUtils.lerp(
              newState.currentRotation,
              newState.targetRotation,
              newState.rotationSpeed * delta
            );
          } else {
            // Can't move, try different direction or stop
            newState.isMoving = false;
            newState.stuckTimer += delta;
          }
        }
      } else {
        // Not moving, perform ground check periodically
        if (newState.groundCheckTimer > 0.5) {
          newState.groundCheckTimer = 0;

          const navResult = terrainNavigator.calculateMovement(
            newState.currentPosition,
            newState.currentPosition,
            islandMeshes,
            animalSize
          );

          if (navResult.isOnGround) {
            // Smoothly adjust to ground
            newState.currentPosition.lerp(navResult.position, 0.1);
          }
        }
      }

      return newState;
    });

    // Apply movement to actual mesh
    if (groupRef.current) {
      // Smooth position interpolation
      groupRef.current.position.lerp(movementState.currentPosition, 0.1);

      // Smooth rotation
      groupRef.current.rotation.y = MathUtils.lerp(
        groupRef.current.rotation.y,
        movementState.currentRotation,
        5 * delta
      );

      // Subtle floating animation
      const floatOffset = Math.sin(state.clock.elapsedTime * 2 + index) * 0.005;
      groupRef.current.position.y += floatOffset;
    }

    // Update animations
    if (animationController) {
      const speed = movementState.isMoving ? movementState.movementSpeed : 0;
      const context = movementState.isMoving ? 'moving' : 'idle';
      animationController.updateAnimation(speed, context, delta);
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
      terrainNavigator.dispose();
    };
  }, [disposeObject3D, mixer, animationController, terrainNavigator]);

  console.log(`🎨 GLBAnimal: Rendering ${animalType} with scene:`, sceneClone);

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={sceneClone} />
      {/* Debug helper in development */}
      {process.env.NODE_ENV === 'development' && (
        <mesh visible={false}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      )}
    </group>
  );
};

// Preload the component
GLBAnimal.displayName = 'ImprovedGLBAnimal';
