import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';
import { Group, Vector3 } from 'three';

interface AnimalProps {
  totalPets: number;
  isActive: boolean;
  animalType: string;
  index: number;
}

const Animal = ({ totalPets, isActive, animalType, index }: AnimalProps) => {
  const animalRef = useRef<Group>(null);
  const [angle, setAngle] = useState((index * Math.PI * 2) / Math.max(totalPets, 1));
  
  const speed = Math.min(0.2 + (totalPets * 0.03), 0.8);
  const radius = 1.2 + (index * 0.3); // Different radius for each animal
  
  useFrame((state, delta) => {
    if (animalRef.current && isActive) {
      // Each animal moves at slightly different speed and direction
      const direction = index % 2 === 0 ? 1 : -1;
      setAngle(prev => prev + delta * speed * direction);
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      animalRef.current.position.set(x, 0.15, z);
      animalRef.current.rotation.y = angle + (Math.PI / 2) * direction;
      
      // Add bouncing animation
      animalRef.current.position.y = 0.15 + Math.sin(state.clock.elapsedTime * (6 + index)) * 0.04;
    }
  });

  const opacity = isActive ? Math.min(0.4 + (totalPets * 0.1), 1.0) : 0.3;
  
  // Render different animals based on type
  switch (animalType) {
    case 'Rabbit':
      return (
        <group ref={animalRef} position={[radius, 0.15, 0]}>
          {/* Rabbit Body */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshLambertMaterial color="#F5F5DC" transparent opacity={opacity} />
          </mesh>
          {/* Rabbit Head */}
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshLambertMaterial color="#F5F5DC" transparent opacity={opacity} />
          </mesh>
          {/* Long Ears */}
          <mesh position={[-0.04, 0.25, 0]}>
            <sphereGeometry args={[0.02, 6, 8]} />
            <meshLambertMaterial color="#F5F5DC" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.04, 0.25, 0]}>
            <sphereGeometry args={[0.02, 6, 8]} />
            <meshLambertMaterial color="#F5F5DC" transparent opacity={opacity} />
          </mesh>
          {/* Fluffy Tail */}
          <mesh position={[0, 0.05, -0.12]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshLambertMaterial color="#FFFFFF" transparent opacity={opacity} />
          </mesh>
        </group>
      );

    case 'Fox':
      return (
        <group ref={animalRef} position={[radius, 0.15, 0]}>
          {/* Fox Body */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshLambertMaterial color="#FF6347" transparent opacity={opacity} />
          </mesh>
          {/* Fox Head */}
          <mesh position={[0, 0.18, 0]}>
            <coneGeometry args={[0.08, 0.15, 8]} />
            <meshLambertMaterial color="#FF6347" transparent opacity={opacity} />
          </mesh>
          {/* Pointed Ears */}
          <mesh position={[-0.05, 0.28, 0]}>
            <coneGeometry args={[0.025, 0.08, 4]} />
            <meshLambertMaterial color="#B8860B" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.05, 0.28, 0]}>
            <coneGeometry args={[0.025, 0.08, 4]} />
            <meshLambertMaterial color="#B8860B" transparent opacity={opacity} />
          </mesh>
          {/* Bushy Tail */}
          <mesh position={[0, 0.08, -0.18]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshLambertMaterial color="#FF6347" transparent opacity={opacity} />
          </mesh>
        </group>
      );

    case 'Bear':
      return (
        <group ref={animalRef} position={[radius, 0.15, 0]}>
          {/* Bear Body - larger */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.18, 8, 6]} />
            <meshLambertMaterial color="#8B4513" transparent opacity={opacity} />
          </mesh>
          {/* Bear Head */}
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.14, 8, 6]} />
            <meshLambertMaterial color="#8B4513" transparent opacity={opacity} />
          </mesh>
          {/* Round Ears */}
          <mesh position={[-0.08, 0.35, 0]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshLambertMaterial color="#654321" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.08, 0.35, 0]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshLambertMaterial color="#654321" transparent opacity={opacity} />
          </mesh>
          {/* Bear Paws */}
          <mesh position={[-0.15, -0.05, 0]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshLambertMaterial color="#8B4513" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.15, -0.05, 0]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshLambertMaterial color="#8B4513" transparent opacity={opacity} />
          </mesh>
        </group>
      );

    case 'Deer':
      return (
        <group ref={animalRef} position={[radius, 0.15, 0]}>
          {/* Deer Body */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.11, 8, 6]} />
            <meshLambertMaterial color="#DEB887" transparent opacity={opacity} />
          </mesh>
          {/* Deer Head */}
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshLambertMaterial color="#DEB887" transparent opacity={opacity} />
          </mesh>
          {/* Antlers */}
          <mesh position={[-0.04, 0.32, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.12]} />
            <meshLambertMaterial color="#8B4513" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.04, 0.32, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.12]} />
            <meshLambertMaterial color="#8B4513" transparent opacity={opacity} />
          </mesh>
          {/* Long Legs */}
          <mesh position={[-0.08, -0.15, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2]} />
            <meshLambertMaterial color="#DEB887" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.08, -0.15, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2]} />
            <meshLambertMaterial color="#DEB887" transparent opacity={opacity} />
          </mesh>
        </group>
      );

    case 'Owl':
      return (
        <group ref={animalRef} position={[radius, 0.25, 0]}>
          {/* Owl Body */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshLambertMaterial color="#8B7355" transparent opacity={opacity} />
          </mesh>
          {/* Owl Head - larger */}
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshLambertMaterial color="#8B7355" transparent opacity={opacity} />
          </mesh>
          {/* Big Eyes */}
          <mesh position={[-0.05, 0.18, 0.08]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshLambertMaterial color="#FFD700" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.05, 0.18, 0.08]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshLambertMaterial color="#FFD700" transparent opacity={opacity} />
          </mesh>
          {/* Wings */}
          <mesh position={[-0.15, 0.05, 0]}>
            <sphereGeometry args={[0.06, 6, 8]} />
            <meshLambertMaterial color="#654321" transparent opacity={opacity} />
          </mesh>
          <mesh position={[0.15, 0.05, 0]}>
            <sphereGeometry args={[0.06, 6, 8]} />
            <meshLambertMaterial color="#654321" transparent opacity={opacity} />
          </mesh>
        </group>
      );

    default:
      // Default animal (similar to original panda)
      return (
        <group ref={animalRef} position={[radius, 0.15, 0]}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshLambertMaterial color="#CCCCCC" transparent opacity={opacity} />
          </mesh>
        </group>
      );
  }
};

const IslandMesh = () => {
  return (
    <group>
      {/* Island Base */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[2, 2.5, 0.8, 8]} />
        <meshLambertMaterial color="#4a7c59" />
      </mesh>
      
      {/* Water around island */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshLambertMaterial color="#3b82c7" transparent opacity={0.7} />
      </mesh>
      
      {/* Trees */}
      <group position={[-0.8, 0.2, 0.5]}>
        <mesh position={[0, 0.3, 0]}>
          <coneGeometry args={[0.3, 0.8, 8]} />
          <meshLambertMaterial color="#2d5a3d" />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.4]} />
          <meshLambertMaterial color="#8b4513" />
        </mesh>
      </group>
      
      <group position={[0.6, 0.2, -0.3]}>
        <mesh position={[0, 0.4, 0]}>
          <coneGeometry args={[0.35, 0.9, 8]} />
          <meshLambertMaterial color="#2d5a3d" />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.5]} />
          <meshLambertMaterial color="#8b4513" />
        </mesh>
      </group>
      
      {/* Rocks */}
      <mesh position={[1.2, 0, 0.8]}>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshLambertMaterial color="#666666" />
      </mesh>
      
      <mesh position={[-1.1, 0, -0.9]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshLambertMaterial color="#555555" />
      </mesh>
      
      {/* Small bushes */}
      <mesh position={[0.3, 0.1, 0.8]}>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshLambertMaterial color="#4a7c59" />
      </mesh>
      
      <mesh position={[-0.4, 0.1, -0.6]}>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshLambertMaterial color="#4a7c59" />
      </mesh>
    </group>
  );
};

const LoadingFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-sky">
    <div className="animate-pulse text-white/80 text-sm">Loading island...</div>
  </div>
);

interface Island3DProps {
  totalPets?: number;
  isAppActive?: boolean;
  currentLevel?: number;
  unlockedAnimals?: string[];
}

export const Island3D = ({ totalPets = 0, isAppActive = true, currentLevel = 1, unlockedAnimals = ['Rabbit'] }: Island3DProps) => {
  return (
    <div className="w-full h-full bg-gradient-sky overflow-hidden">
      <Canvas gl={{ preserveDrawingBuffer: false, antialias: false }}>
        <Suspense fallback={<LoadingFallback />}>
          <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={50} />
          
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={1} 
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.3} color="#ffa500" />
          
          {/* Island */}
          <IslandMesh />
          
          {/* Render all unlocked animals */}
          {unlockedAnimals.map((animalType, index) => (
            <Animal 
              key={`${animalType}-${index}`}
              animalType={animalType}
              totalPets={totalPets}
              isActive={isAppActive}
              index={index}
            />
          ))}
          
          {/* Controls */}
          <OrbitControls 
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};