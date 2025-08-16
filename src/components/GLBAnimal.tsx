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
  islandRef?: React.RefObject<Group>;
}

interface Waypoint {
  position: Vector3;
  animation: string;
  duration: number; // How long to stay at this point
  lookAt?: Vector3; // Optional look direction
}

interface PathState {
  currentWaypointIndex: number;
  progress: number; // 0 to 1 between waypoints
  waitTimer: number; // Time remaining at current waypoint
  isMoving: boolean;
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
  const tempVector = useMemo(() => new Vector3(), []);
  const startPosition = useMemo(() => new Vector3(), []);
  const endPosition = useMemo(() => new Vector3(), []);
  
  // Define the panda's path with waypoints and animations
  const waypoints = useMemo<Waypoint[]>(() => {
    const baseOffset = index * 0.3; // Offset each animal slightly
    return [
      // Start near center
      {
        position: new Vector3(0.2 + baseOffset, 0.3, 0.1 + baseOffset),
        animation: 'idle',
        duration: 2.0,
        lookAt: new Vector3(1, 0.3, 0)
      },
      // Move to right side
      {
        position: new Vector3(0.8 + baseOffset, 0.4, 0.3 + baseOffset),
        animation: 'walk',
        duration: 1.5,
      },
      // Pause and look around
      {
        position: new Vector3(0.8 + baseOffset, 0.4, 0.3 + baseOffset),
        animation: 'idle',
        duration: 3.0,
        lookAt: new Vector3(-1, 0.4, 1)
      },
      // Move to back of island
      {
        position: new Vector3(0.2 + baseOffset, 0.5, -0.8 + baseOffset),
        animation: 'walk',
        duration: 2.0,
      },
      // Rest at back
      {
        position: new Vector3(0.2 + baseOffset, 0.5, -0.8 + baseOffset),
        animation: 'idle',
        duration: 2.5,
        lookAt: new Vector3(0, 0.5, 1)
      },
      // Move to left side
      {
        position: new Vector3(-0.6 + baseOffset, 0.35, 0.2 + baseOffset),
        animation: 'walk',
        duration: 1.8,
      },
      // Pause on left
      {
        position: new Vector3(-0.6 + baseOffset, 0.35, 0.2 + baseOffset),
        animation: 'idle',
        duration: 2.0,
        lookAt: new Vector3(1, 0.35, -1)
      },
      // Move to front
      {
        position: new Vector3(0.1 + baseOffset, 0.3, 0.9 + baseOffset),
        animation: 'walk',
        duration: 1.5,
      },
      // Final pause before loop
      {
        position: new Vector3(0.1 + baseOffset, 0.3, 0.9 + baseOffset),
        animation: 'idle',
        duration: 1.8,
        lookAt: new Vector3(0, 0.3, -1)
      }
    ];
  }, [index]);

  // Path state
  const [pathState, setPathState] = useState<PathState>({
    currentWaypointIndex: 0,
    progress: 0,
    waitTimer: waypoints[0]?.duration || 2.0,
    isMoving: false
  });

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

  // Handle animation changes
  useEffect(() => {
    if (!mixer || animations.length === 0) return;

    const findAndPlayAnimation = (targetAnim: string) => {
      // Try to find exact match first
      let anim = animations.find(a => a.name.toLowerCase() === targetAnim.toLowerCase());
      
      // Try partial matches
      if (!anim) {
        if (targetAnim === 'walk') {
          anim = animations.find(a => 
            a.name.toLowerCase().includes('walk') || 
            a.name.toLowerCase().includes('run') ||
            a.name.toLowerCase().includes('move')
          );
        } else if (targetAnim === 'idle') {
          anim = animations.find(a => 
            a.name.toLowerCase().includes('idle') || 
            a.name.toLowerCase().includes('stand') ||
            a.name.toLowerCase().includes('rest')
          );
        }
      }
      
      // Fallback to first animation
      if (!anim && animations.length > 0) {
        anim = animations[0];
      }
      
      if (anim && actions[anim.name]) {
        // Stop all current animations
        Object.values(actions).forEach(action => {
          if (action && action.isRunning()) {
            action.fadeOut(0.3);
          }
        });
        
        // Start new animation
        const action = actions[anim.name];
        action.reset();
        action.fadeIn(0.3);
        action.play();
        
        console.log(`🐼 ${animalType}: Playing "${anim.name}" for "${targetAnim}"`);
      }
    };

    findAndPlayAnimation(currentAnimation);
  }, [currentAnimation, actions, animations, animalType, mixer]);

  // Get current and next waypoints
  const getCurrentWaypoint = () => waypoints[pathState.currentWaypointIndex];
  const getNextWaypoint = () => waypoints[(pathState.currentWaypointIndex + 1) % waypoints.length];

  // Main update loop
  useFrame((state, delta) => {
    if (!groupRef.current || !isActive) return;

    // Update animation mixer
    if (mixer) {
      mixer.update(delta);
    }

    const currentWaypoint = getCurrentWaypoint();
    if (!currentWaypoint) return;

    setPathState(prevState => {
      const newState = { ...prevState };

      if (!newState.isMoving) {
        // Currently waiting at waypoint
        newState.waitTimer -= delta;
        
        if (newState.waitTimer <= 0) {
          // Start moving to next waypoint
          newState.isMoving = true;
          newState.progress = 0;
          console.log(`🐼 ${animalType}: Starting move to waypoint ${(newState.currentWaypointIndex + 1) % waypoints.length}`);
        }
      } else {
        // Currently moving between waypoints
        const nextWaypoint = getNextWaypoint();
        if (!nextWaypoint) return newState;

        // Update progress (speed can be adjusted here)
        const moveSpeed = 0.4; // Adjust this to make panda move faster/slower
        newState.progress += delta * moveSpeed;

        if (newState.progress >= 1.0) {
          // Reached next waypoint
          newState.currentWaypointIndex = (newState.currentWaypointIndex + 1) % waypoints.length;
          newState.progress = 0;
          newState.isMoving = false;
          newState.waitTimer = nextWaypoint.duration;
          
          console.log(`🐼 ${animalType}: Reached waypoint ${newState.currentWaypointIndex}`);
        }
      }

      return newState;
    });

    // Update position and animation
    if (pathState.isMoving) {
      // Moving between waypoints
      const nextWaypoint = getNextWaypoint();
      if (nextWaypoint) {
        // Interpolate position
        startPosition.copy(currentWaypoint.position);
        endPosition.copy(nextWaypoint.position);
        
        const smoothProgress = pathState.progress; // Could add easing here
        tempVector.lerpVectors(startPosition, endPosition, smoothProgress);
        groupRef.current.position.copy(tempVector);
        
        // Look in movement direction
        const direction = tempVector.copy(endPosition).sub(startPosition).normalize();
        if (direction.length() > 0) {
          const lookTarget = tempVector.copy(groupRef.current.position).add(direction);
          groupRef.current.lookAt(lookTarget);
        }
        
        // Set walking animation
        if (currentAnimation !== 'walk') {
          setCurrentAnimation('walk');
        }
      }
    } else {
      // Waiting at waypoint
      groupRef.current.position.copy(currentWaypoint.position);
      
      // Look at specified direction or do idle looking
      if (currentWaypoint.lookAt) {
        groupRef.current.lookAt(currentWaypoint.lookAt);
      } else {
        // Gentle idle head movement
        const idleLook = Math.sin(state.clock.elapsedTime * 0.3 + index) * 0.3;
        const lookTarget = tempVector.copy(currentWaypoint.position);
        lookTarget.x += Math.cos(idleLook);
        lookTarget.z += Math.sin(idleLook);
        groupRef.current.lookAt(lookTarget);
      }
      
      // Set idle animation
      if (currentAnimation !== currentWaypoint.animation) {
        setCurrentAnimation(currentWaypoint.animation);
      }
    }

    // Add subtle floating animation
    const floatOffset = Math.sin(state.clock.elapsedTime * 2 + index * 0.5) * 0.02;
    groupRef.current.position.y += floatOffset;

    // Debug logging (reduced frequency)
    if (Math.floor(state.clock.elapsedTime * 2) % 20 === 0 && Math.floor(state.clock.elapsedTime * 20) % 100 === 0) {
      console.log(`🐼 ${animalType}: Waypoint ${pathState.currentWaypointIndex} | ${pathState.isMoving ? 'Moving' : 'Waiting'} | Progress: ${pathState.progress.toFixed(2)} | Anim: ${currentAnimation}`);
    }
  });

  // Set initial position
  useEffect(() => {
    if (groupRef.current && waypoints.length > 0) {
      groupRef.current.position.copy(waypoints[0].position);
    }
  }, [waypoints]);

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <primitive object={sceneClone} />
    </group>
  );
};
