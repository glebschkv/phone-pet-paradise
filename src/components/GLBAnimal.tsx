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
  const [modelLoaded, setModelLoaded] = useState(false);
  const [mixer, setMixer] = useState<any>(null);
  let scene, animations;
  
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
        
        setModelLoaded(true);
        return cloned;
      } catch (error) {
        console.error(`❌ Failed to clone scene for ${animalType}:`, error);
        setModelError(true);
        return null;
      }
    }, [scene]);
    
    const animationResult = useAnimations(animations || [], groupRef);
    const { actions } = animationResult;
    
    // Set mixer when available
    useEffect(() => {
      if (animationResult.mixer) {
        setMixer(animationResult.mixer);
      }
    }, [animationResult.mixer]);

    // Ensure only Walk/Idle clips play and stop unwanted animations
    useEffect(() => {
      if (!actions || Object.keys(actions).length === 0) return;

      const walk = actions['Walk'] || actions['Walking'] || actions['walk'];
      const idle = actions['Idle'] || actions['idle'];

      // Stop all non-Walk/Idle animations
      Object.entries(actions).forEach(([name, action]) => {
        if (!action) return;
        const isWalk = ['Walk', 'Walking', 'walk'].includes(name);
        const isIdle = ['Idle', 'idle'].includes(name);
        const isUnwanted = ['Sleep', 'StandUp', 'sleep', 'standup', 'sitting', 'lying'].includes(name);
        
        if (isUnwanted) {
          action.stop();
          console.log(`🚫 Stopped unwanted animation: ${name} for ${animalType}`);
        }
      });

      // Play appropriate animation
      const play = (targetAnimation: string) => {
        const isWalkAnimation = targetAnimation.toLowerCase().includes('walk');
        const targetAction = isWalkAnimation ? walk : idle;
        
        if (!targetAction) {
          console.warn(`⚠️ Animation ${targetAnimation} not found for ${animalType}, using fallback`);
          return;
        }
        
        if (!targetAction.isRunning()) {
          targetAction.reset().fadeIn(0.25).play();
          console.log(`🎬 Playing ${isWalkAnimation ? 'Walk' : 'Idle'} animation for ${animalType}`);
        }
        
        // Fade out other actions
        Object.values(actions).forEach(action => {
          if (action && action !== targetAction && action.isRunning()) {
            action.fadeOut(0.2);
          }
        });
      };

      play(animationName || 'Walk');
    }, [animationName, actions]);
    
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

  // Wandering movement state for GLB animals
  const [heading] = useState(() => {
    const h = new Vector3(Math.cos(index * 1.7), 0, Math.sin(index * 2.3));
    return h.normalize();
  });
  const [turnTimer, setTurnTimer] = useState(0);
  const [wanderPosition] = useState(() => new Vector3(0, 0, 0));

  const walkSpeed = 0.6;
  const TURN_EVERY = 2.5;
  const TURN_AMOUNT = Math.PI * 0.45;
  const baseY = 0.15;

  // Main update loop - combines wandering + GLB model
  useFrame((state, delta) => {
    if (!groupRef.current || !isActive || modelError || !modelLoaded) return;
    
    // Clamp delta to prevent huge jumps
    delta = Math.min(delta, 0.1);
    
    // Random-walk wandering logic for GLB animals
    const t = turnTimer + delta;
    if (t > TURN_EVERY) {
      const ang = (Math.random() - 0.5) * TURN_AMOUNT;
      heading.applyAxisAngle(new Vector3(0, 1, 0), ang).normalize();
      setTurnTimer(0);
    } else {
      setTurnTimer(t);
    }

    // Move forward
    wanderPosition.addScaledVector(heading, walkSpeed * delta);

    // Keep inside island bounds
    const island = islandRef?.current;
    if (island) {
      const box = new Box3().setFromObject(island);
      const margin = 0.6;
      const min = box.min.clone().addScalar(margin);
      const max = box.max.clone().addScalar(-margin);
      const p = wanderPosition;
      if (p.x < min.x || p.x > max.x || p.z < min.z || p.z > max.z) {
        p.x = MathUtils.clamp(p.x, min.x, max.x);
        p.z = MathUtils.clamp(p.z, min.z, max.z);
        heading.applyAxisAngle(new Vector3(0, 1, 0), Math.PI * 0.6);
      }
    }

    // Get ground height and apply to position
    const groundHeight = getGroundHeight(wanderPosition);
    if (groundHeight !== null) {
      wanderPosition.y = MathUtils.lerp(wanderPosition.y, groundHeight, delta * 5);
    } else {
      wanderPosition.y = baseY;
    }

    // Face travel direction
    const lookTarget = wanderPosition.clone().add(heading);
    groupRef.current.lookAt(lookTarget);

    // Apply wandering position to group
    groupRef.current.position.copy(wanderPosition);

    // Subtle bob
    groupRef.current.position.y += Math.sin(state.clock.elapsedTime * (4 + (index % 3))) * 0.04;
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