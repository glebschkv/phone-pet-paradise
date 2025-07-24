import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';
import { Group, Vector3 } from 'three';

interface PandaProps {
  totalPets: number;
  isActive: boolean;
}

const Panda = ({ totalPets, isActive }: PandaProps) => {
  const pandaRef = useRef<Group>(null);
  const [angle, setAngle] = useState(0);
  
  // Panda moves faster when user has more pets (less phone usage)
  const speed = Math.min(0.3 + (totalPets * 0.05), 1.0);
  const radius = 1.5; // Keep panda on the island
  
  useFrame((state, delta) => {
    if (pandaRef.current && isActive) {
      // Move panda in a circle around the island
      setAngle(prev => prev + delta * speed);
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      pandaRef.current.position.set(x, 0.2, z);
      pandaRef.current.rotation.y = angle + Math.PI / 2; // Face movement direction
      
      // Add slight bobbing animation while walking
      pandaRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 8) * 0.05;
    }
  });

  // Panda becomes more visible/active with more pets
  const opacity = isActive ? Math.min(0.3 + (totalPets * 0.1), 1.0) : 0.2;
  
  return (
    <group ref={pandaRef} position={[radius, 0.2, 0]}>
      {/* Panda Body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshLambertMaterial color="#f0f0f0" transparent opacity={opacity} />
      </mesh>
      
      {/* Panda Head */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshLambertMaterial color="#f0f0f0" transparent opacity={opacity} />
      </mesh>
      
      {/* Panda Ears */}
      <mesh position={[-0.08, 0.28, 0]}>
        <sphereGeometry args={[0.04, 6, 4]} />
        <meshLambertMaterial color="#222222" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.08, 0.28, 0]}>
        <sphereGeometry args={[0.04, 6, 4]} />
        <meshLambertMaterial color="#222222" transparent opacity={opacity} />
      </mesh>
      
      {/* Panda Eyes */}
      <mesh position={[-0.05, 0.22, 0.08]}>
        <sphereGeometry args={[0.025, 6, 4]} />
        <meshLambertMaterial color="#222222" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.05, 0.22, 0.08]}>
        <sphereGeometry args={[0.025, 6, 4]} />
        <meshLambertMaterial color="#222222" transparent opacity={opacity} />
      </mesh>
      
      {/* Panda Arms */}
      <mesh position={[-0.12, 0.05, 0]}>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshLambertMaterial color="#222222" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.12, 0.05, 0]}>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshLambertMaterial color="#222222" transparent opacity={opacity} />
      </mesh>
      
      {/* Panda Legs */}
      <mesh position={[-0.08, -0.12, 0]}>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshLambertMaterial color="#222222" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.08, -0.12, 0]}>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshLambertMaterial color="#222222" transparent opacity={opacity} />
      </mesh>
    </group>
  );
};

interface CatProps {
  totalPets: number;
  isActive: boolean;
}

const GingerCat = ({ totalPets, isActive }: CatProps) => {
  const catRef = useRef<Group>(null);
  const [angle, setAngle] = useState(Math.PI); // Start at opposite side of panda
  
  const speed = Math.min(0.4 + (totalPets * 0.05), 1.2);
  const radius = 1.2; // Slightly smaller radius than panda
  
  useFrame((state, delta) => {
    if (catRef.current && isActive) {
      // Move cat in opposite direction to panda
      setAngle(prev => prev - delta * speed);
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      catRef.current.position.set(x, 0.15, z);
      catRef.current.rotation.y = angle - Math.PI / 2; // Face movement direction
      
      // Add cat-like walking animation
      catRef.current.position.y = 0.15 + Math.sin(state.clock.elapsedTime * 10) * 0.03;
    }
  });

  const opacity = isActive ? Math.min(0.4 + (totalPets * 0.1), 1.0) : 0.3;
  
  return (
    <group ref={catRef} position={[-radius, 0.15, 0]}>
      {/* Cat Body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshLambertMaterial color="#D2691E" transparent opacity={opacity} />
      </mesh>
      
      {/* Cat Head */}
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshLambertMaterial color="#D2691E" transparent opacity={opacity} />
      </mesh>
      
      {/* Cat Ears - pointed triangular */}
      <mesh position={[-0.06, 0.26, 0]}>
        <coneGeometry args={[0.03, 0.08, 4]} />
        <meshLambertMaterial color="#B8860B" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.06, 0.26, 0]}>
        <coneGeometry args={[0.03, 0.08, 4]} />
        <meshLambertMaterial color="#B8860B" transparent opacity={opacity} />
      </mesh>
      
      {/* Cat Eyes - green */}
      <mesh position={[-0.04, 0.2, 0.07]}>
        <sphereGeometry args={[0.015, 6, 4]} />
        <meshLambertMaterial color="#32CD32" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.04, 0.2, 0.07]}>
        <sphereGeometry args={[0.015, 6, 4]} />
        <meshLambertMaterial color="#32CD32" transparent opacity={opacity} />
      </mesh>
      
      {/* Cat Tail */}
      <mesh position={[0, 0.05, -0.15]}>
        <cylinderGeometry args={[0.02, 0.03, 0.3]} />
        <meshLambertMaterial color="#D2691E" transparent opacity={opacity} />
      </mesh>
      
      {/* Cat Paws */}
      <mesh position={[-0.08, -0.08, 0]}>
        <sphereGeometry args={[0.04, 6, 4]} />
        <meshLambertMaterial color="#D2691E" transparent opacity={opacity} />
      </mesh>
      <mesh position={[0.08, -0.08, 0]}>
        <sphereGeometry args={[0.04, 6, 4]} />
        <meshLambertMaterial color="#D2691E" transparent opacity={opacity} />
      </mesh>
    </group>
  );
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
}

export const Island3D = ({ totalPets = 0, isAppActive = true, currentLevel = 1 }: Island3DProps) => {
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
          
          {/* Panda */}
          <Panda totalPets={totalPets} isActive={isAppActive} />
          
          {/* Ginger Cat - appears at level 2+ */}
          {currentLevel >= 2 && (
            <GingerCat totalPets={totalPets} isActive={isAppActive} />
          )}
          
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