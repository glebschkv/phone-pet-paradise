import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Mesh } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { use3DCleanup } from '@/hooks/use3DCleanup';
import { ANIMAL_DATABASE } from '@/data/AnimalDatabase';
import { WaypointGenerator, SmartWaypoint, AnimalBehavior } from './waypoints/WaypointGenerator';
import { TerrainNavigator } from './waypoints/TerrainNavigator';
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

interface PathState {
  currentWaypointIndex: number;
  progress: number; // 0 to 1 between waypoints
  waitTimer: number; // Time remaining at current waypoint
  isMoving: boolean;
  movementSpeed: number;
  currentPath: Vector3[]; // Current path segments
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
  
  // Cache for island meshes to improve performance
  const [islandMeshes, setIslandMeshes] = useState<Mesh[]>([]);
  
  // Smart waypoint system
  const waypointGenerator = useMemo(() => new WaypointGenerator(), []);
  const terrainNavigator = useMemo(() => new TerrainNavigator(), []);
  
  // Get animal data from database
  const animalData = useMemo(() => 
    ANIMAL_DATABASE.find(animal => animal.name.toLowerCase() === animalType.toLowerCase()) ||
    ANIMAL_DATABASE[0], // Fallback to first animal
    [animalType]
  );
  
  // Generate smart waypoints
  const [smartWaypoints, setSmartWaypoints] = useState<SmartWaypoint[]>([]);
  
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

  // Generate smart waypoints when island meshes are available
  useEffect(() => {
    if (islandMeshes.length === 0) return;
    
    const waypoints = waypointGenerator.generateWaypoints(animalData, index, islandMeshes);
    setSmartWaypoints(waypoints);
    
    console.log(`🎯 ${animalData.name}: Generated ${waypoints.length} smart waypoints`);
  }, [islandMeshes, animalData, index, waypointGenerator]);

  // Path state
  const [pathState, setPathState] = useState<PathState>({
    currentWaypointIndex: 0,
    progress: 0,
    waitTimer: 2.0,
    isMoving: false,
    movementSpeed: 0.4,
    currentPath: []
  });

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

  // Initialize path when waypoints are ready
  useEffect(() => {
    if (smartWaypoints.length === 0) return;
    
    setPathState(prev => ({
      ...prev,
      waitTimer: smartWaypoints[0]?.duration || 2.0,
      currentPath: []
    }));
  }, [smartWaypoints]);

  // Get current and next waypoints
  const getCurrentWaypoint = () => smartWaypoints[pathState.currentWaypointIndex];
  const getNextWaypoint = () => smartWaypoints[(pathState.currentWaypointIndex + 1) % smartWaypoints.length];

  // Main update loop
  useFrame((state, delta) => {
    if (!groupRef.current || !isActive) return;
    
    // If no waypoints yet, use simple positioning
    if (smartWaypoints.length === 0) {
      const radius = 1.5;
      const angle = (index * Math.PI * 2) / Math.max(totalPets, 1) + state.clock.elapsedTime * 0.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      groupRef.current.position.set(x, 0.3, z);
      groupRef.current.rotation.y = angle + Math.PI / 2;
      return;
    }
    
    if (!animationController) return;

    const currentWaypoint = getCurrentWaypoint();
    if (!currentWaypoint) return;

    // Calculate movement speed based on current state
    let currentSpeed = 0;
    let animationContext: 'moving' | 'idle' | 'special' = 'idle';

    setPathState(prevState => {
      const newState = { ...prevState };

      if (!newState.isMoving) {
        // Currently waiting at waypoint
        newState.waitTimer -= delta;
        
        if (newState.waitTimer <= 0) {
          // Start moving to next waypoint
          const nextWaypoint = getNextWaypoint();
          if (nextWaypoint) {
            newState.isMoving = true;
            newState.progress = 0;
            
            // Generate path using terrain navigator
            const path = terrainNavigator.findPath(
              currentWaypoint.position,
              nextWaypoint.position,
              islandMeshes,
              animalSize
            );
            newState.currentPath = path;
            
            console.log(`🎯 ${animalType}: Moving to waypoint ${(newState.currentWaypointIndex + 1) % smartWaypoints.length}`);
          }
        }
      } else {
        // Currently moving between waypoints
        const nextWaypoint = getNextWaypoint();
        if (!nextWaypoint || newState.currentPath.length === 0) return newState;

        // Update progress based on animal's movement speed
        newState.progress += delta * newState.movementSpeed;

        if (newState.progress >= 1.0) {
          // Reached next waypoint
          newState.currentWaypointIndex = (newState.currentWaypointIndex + 1) % smartWaypoints.length;
          newState.progress = 0;
          newState.isMoving = false;
          newState.waitTimer = nextWaypoint.duration;
          newState.currentPath = [];
          
          console.log(`🎯 ${animalType}: Reached waypoint ${newState.currentWaypointIndex}`);
        }
      }

      return newState;
    });

    // Update position using advanced terrain navigation
    if (pathState.isMoving && pathState.currentPath.length > 1) {
      animationContext = 'moving';
      currentSpeed = pathState.movementSpeed;
      
      // Interpolate along current path
      const pathIndex = Math.floor(pathState.progress * (pathState.currentPath.length - 1));
      const pathProgress = (pathState.progress * (pathState.currentPath.length - 1)) % 1;
      
      const startPos = pathState.currentPath[pathIndex];
      const endPos = pathState.currentPath[Math.min(pathIndex + 1, pathState.currentPath.length - 1)];
      
      if (startPos && endPos) {
        // Use terrain navigator for accurate positioning
        const navResult = terrainNavigator.calculateMovement(startPos, endPos, islandMeshes, animalSize);
        
        if (navResult.canMove) {
          // Smooth interpolation with terrain awareness
          tempVector.lerpVectors(startPos, navResult.position, pathProgress);
          groupRef.current.position.copy(tempVector);
          
          // Natural rotation based on movement direction and slope
          const moveDirection = new Vector3().subVectors(endPos, startPos).normalize();
          if (moveDirection.length() > 0) {
            // Adjust rotation for slope
            const rotation = Math.atan2(moveDirection.x, moveDirection.z);
            groupRef.current.rotation.y = rotation;
            
            // Tilt animal based on surface normal
            const tiltAmount = 0.1;
            groupRef.current.rotation.x = navResult.surfaceNormal.x * tiltAmount;
            groupRef.current.rotation.z = navResult.surfaceNormal.z * tiltAmount;
          }
        }
      }
    } else {
      // Stationary at waypoint
      animationContext = currentWaypoint.type === 'lookout' ? 'special' : 'idle';
      currentSpeed = 0;
      
      const waypointPos = currentWaypoint.position.clone();
      groupRef.current.position.copy(waypointPos);
      
      // Look behavior at waypoints
      if (currentWaypoint.lookAt) {
        groupRef.current.lookAt(currentWaypoint.lookAt);
      } else {
        // Natural idle looking around
        const idleLook = Math.sin(state.clock.elapsedTime * 0.2 + index) * 0.5;
        const lookDirection = new Vector3(
          Math.cos(idleLook + groupRef.current.rotation.y),
          0,
          Math.sin(idleLook + groupRef.current.rotation.y)
        );
        const lookTarget = waypointPos.clone().add(lookDirection);
        groupRef.current.lookAt(lookTarget);
      }
    }

    // Update animations using smart controller (only if available)
    if (animationController) {
      animationController.updateAnimation(currentSpeed, animationContext, delta);
    }

    // Subtle floating effect (reduced for realism)
    const floatOffset = Math.sin(state.clock.elapsedTime * 1.5 + index * 0.7) * 0.01;
    groupRef.current.position.y += floatOffset;
  });

  // Set initial position - fallback to simple position if no waypoints
  useEffect(() => {
    if (groupRef.current) {
      if (smartWaypoints.length > 0) {
        groupRef.current.position.copy(smartWaypoints[0].position);
      } else {
        // Fallback positioning while waypoints are loading
        const radius = 1.5;
        const angle = (index * Math.PI * 2) / Math.max(totalPets, 1);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        groupRef.current.position.set(x, 0.3, z);
      }
    }
  }, [smartWaypoints, index, totalPets]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (groupRef.current) {
        disposeObject3D(groupRef.current);
      }
      if (animationController) {
        animationController.dispose();
      }
      if (mixer) {
        mixer.stopAllAction();
        mixer.uncacheRoot(groupRef.current!);
      }
    };
  }, [disposeObject3D, mixer, animationController]);

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={sceneClone} />
    </group>
  );
};
