import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import { Animal } from './Animal';


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