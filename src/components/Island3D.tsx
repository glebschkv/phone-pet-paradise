import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import { Animal } from './Animal';

const IslandMesh = ({ baseColor = '#4a7c59', waterColor = '#3b82c7' }: { baseColor?: string; waterColor?: string; }) => {
  return (
    <group>
      {/* Island Base */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[2, 2.5, 0.8, 8]} />
        <meshLambertMaterial color={baseColor} />
      </mesh>
      
      {/* Water around island */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshLambertMaterial color={waterColor} transparent opacity={0.7} />
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
        <meshLambertMaterial color={baseColor} />
      </mesh>
      
      <mesh position={[-0.4, 0.1, -0.6]}>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshLambertMaterial color={baseColor} />
      </mesh>
    </group>
  );
};

interface Island3DProps {
  totalPets?: number;
  isAppActive?: boolean;
  currentLevel?: number;
  unlockedAnimals?: string[];
  currentBiome?: string;
}

export const Island3D = ({ totalPets = 0, isAppActive = true, currentLevel = 1, unlockedAnimals = ['Rabbit'], currentBiome = 'Meadow' }: Island3DProps) => {
  const themes: Record<string, { baseColor: string; waterColor: string; ambient: number; sunIntensity: number; warmLight: string; }> = {
    Meadow: { baseColor: '#4a7c59', waterColor: '#3b82c7', ambient: 0.4, sunIntensity: 1.0, warmLight: '#ffa500' },
    Forest: { baseColor: '#2f6e4c', waterColor: '#2c7da0', ambient: 0.35, sunIntensity: 0.9, warmLight: '#ffb347' },
    Ocean: { baseColor: '#2e8b57', waterColor: '#1e90ff', ambient: 0.5, sunIntensity: 0.8, warmLight: '#87cefa' },
    Tundra: { baseColor: '#7aa2b7', waterColor: '#7ec8e3', ambient: 0.6, sunIntensity: 0.7, warmLight: '#bfefff' },
    Mountains: { baseColor: '#6b7280', waterColor: '#60a5fa', ambient: 0.45, sunIntensity: 1.1, warmLight: '#ffd1a1' },
    'Desert Dunes': { baseColor: '#c2a97a', waterColor: '#6ec5ff', ambient: 0.55, sunIntensity: 1.2, warmLight: '#ffcc66' },
    'Coral Reef': { baseColor: '#3aa69b', waterColor: '#00bcd4', ambient: 0.55, sunIntensity: 0.9, warmLight: '#a0e9ff' },
    'Mystic Forest': { baseColor: '#3b6e57', waterColor: '#6aa0ff', ambient: 0.5, sunIntensity: 0.85, warmLight: '#b3a0ff' },
    'Alpine Peaks': { baseColor: '#9ca3af', waterColor: '#93c5fd', ambient: 0.6, sunIntensity: 0.95, warmLight: '#e5e7eb' },
    'Crystal Caves': { baseColor: '#6d28d9', waterColor: '#60a5fa', ambient: 0.45, sunIntensity: 0.8, warmLight: '#a78bfa' },
    'Celestial Isles': { baseColor: '#64748b', waterColor: '#7dd3fc', ambient: 0.65, sunIntensity: 1.0, warmLight: '#c7d2fe' },
  };

  const theme = themes[currentBiome] || themes['Meadow'];

  return (
    <div className="w-full h-full bg-gradient-sky overflow-hidden">
      <Canvas gl={{ preserveDrawingBuffer: false, antialias: false }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={50} />

          {/* Lighting */}
          <ambientLight intensity={theme.ambient} />
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={theme.sunIntensity} 
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.3} color={theme.warmLight} />

          {/* Island */}
          <IslandMesh baseColor={theme.baseColor} waterColor={theme.waterColor} />

          {/* Animals */}
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
