import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useEffect, memo } from 'react';
import { Animal } from './Animal';
import { GLBIsland } from './GLBIsland';
import { GLBErrorBoundary } from './GLBErrorBoundary';

const BiomeIsland = memo((
  { biome, baseColor = '#4a7c59', waterColor = '#3b82c7' }:
  { biome: string; baseColor?: string; waterColor?: string; }
) => {
  useEffect(() => {
    console.log('BiomeIsland rendering with biome:', biome);
  }, [biome]);
  switch (biome) {
    case 'Forest':
      return (
        <group>
          {/* Dense forested island */}
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[2.2, 2.6, 0.9, 10]} />
            <meshLambertMaterial color={baseColor} />
          </mesh>
          <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshLambertMaterial color={waterColor} transparent opacity={0.65} />
          </mesh>
          {/* More trees */}
          {[...Array(6)].map((_, i) => (
            <group key={i} position={[Math.cos(i) * 0.9, 0.2, Math.sin(i) * 0.9]}>
              <mesh position={[0, 0.4, 0]}>
                <coneGeometry args={[0.35, 0.9, 8]} />
                <meshLambertMaterial color="#2d5a3d" />
              </mesh>
              <mesh position={[0, -0.05, 0]}>
                <cylinderGeometry args={[0.09, 0.09, 0.45]} />
                <meshLambertMaterial color="#8b4513" />
              </mesh>
            </group>
          ))}
        </group>
      );

    case 'Ocean':
      return (
        <group>
          {/* Tiny sandbank with large water */}
          <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[14, 14]} />
            <meshLambertMaterial color={waterColor} transparent opacity={0.75} />
          </mesh>
          <mesh position={[0, -0.7, 0]}>
            <cylinderGeometry args={[0.8, 1.0, 0.3, 10]} />
            <meshLambertMaterial color={baseColor} />
          </mesh>
          {/* Buoys/rocks */}
          <mesh position={[1.5, -0.8, 1.2]}>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshLambertMaterial color="#778899" />
          </mesh>
          <mesh position={[-1.6, -0.85, -1.0]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshLambertMaterial color="#708090" />
          </mesh>
        </group>
      );

    case 'Tundra':
      return (
        <group>
          <mesh position={[0, -0.55, 0]}>
            <cylinderGeometry args={[2.1, 2.4, 0.7, 8]} />
            <meshLambertMaterial color={baseColor} />
          </mesh>
          <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[10, 10]} />
            <meshLambertMaterial color={waterColor} transparent opacity={0.6} />
          </mesh>
          {/* Snow mounds */}
          {[[-0.6, 0, 0.5], [0.7, 0, -0.3], [0.2, 0, 0.9]].map((p, i) => (
            <mesh key={i} position={[p[0], 0.15, p[2]]}>
              <sphereGeometry args={[0.25, 10, 8]} />
              <meshLambertMaterial color="#e5e7eb" />
            </mesh>
          ))}
        </group>
      );

    case 'Mountains':
      return (
        <group>
          <mesh position={[0, -0.55, 0]}>
            <cylinderGeometry args={[2.2, 2.6, 0.7, 6]} />
            <meshLambertMaterial color={baseColor} />
          </mesh>
          <mesh position={[0.5, 0.2, -0.2]}>
            <coneGeometry args={[0.6, 1.4, 6]} />
            <meshLambertMaterial color="#6b7280" />
          </mesh>
          <mesh position={[-0.7, 0.15, 0.4]}>
            <coneGeometry args={[0.5, 1.1, 6]} />
            <meshLambertMaterial color="#4b5563" />
          </mesh>
        </group>
      );

    case 'Desert Dunes':
      return (
        <group>
          <mesh position={[0, -0.6, 0]}>
            <cylinderGeometry args={[2.3, 2.8, 0.6, 12]} />
            <meshLambertMaterial color={baseColor} />
          </mesh>
          {/* Dunes */}
          {[[-0.8, 0.05, 0.2, 0.5], [0.9, 0.02, -0.4, 0.4], [0.2, 0.03, 0.8, 0.35]].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x as number, y as number, z as number]}>
              <coneGeometry args={[r as number, (r as number) * 0.8, 10]} />
              <meshLambertMaterial color="#d6b98c" />
            </mesh>
          ))}
          {/* Cactus */}
          <group position={[0.2, 0.1, -0.6]}>
            <mesh>
              <cylinderGeometry args={[0.08, 0.08, 0.5]} />
              <meshLambertMaterial color="#2d6a4f" />
            </mesh>
            <mesh position={[0, 0.2, 0.1]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.25]} />
              <meshLambertMaterial color="#2d6a4f" />
            </mesh>
          </group>
        </group>
      );

    case 'Coral Reef':
      return (
        <group>
          {/* Shallow water with coral mounds */}
          <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[12, 12]} />
            <meshLambertMaterial color={waterColor} transparent opacity={0.7} />
          </mesh>
          {[[-0.6, 0, 0.4, '#ff6b6b'], [0.7, 0, -0.2, '#ffd166'], [0.1, 0, 0.9, '#06d6a0']].map(([x, _y, z, c], i) => (
            <mesh key={i} position={[x as number, -0.7, z as number]}>
              <sphereGeometry args={[0.3, 12, 10]} />
              <meshLambertMaterial color={c as string} />
            </mesh>
          ))}
        </group>
      );

    case 'Mystic Forest':
      return (
        <group>
          <mesh position={[0, -0.5, 0]}>
            <cylinderGeometry args={[2.0, 2.5, 0.85, 10]} />
            <meshLambertMaterial color={baseColor} />
          </mesh>
          {/* Tall, sparse trees */}
          {[[-0.9, 0, 0.6], [0.8, 0, -0.5], [0.2, 0, 0.9]].map((p, i) => (
            <group key={i} position={[p[0], 0.25, p[2]]}>
              <mesh position={[0, 0.6, 0]}>
                <coneGeometry args={[0.28, 1.2, 8]} />
                <meshLambertMaterial color="#3b6e57" />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.07, 0.07, 0.6]} />
                <meshLambertMaterial color="#6b4f2a" />
              </mesh>
            </group>
          ))}
        </group>
      );

    case 'Alpine Peaks':
      return (
        <group>
          <mesh position={[0, -0.6, 0]}>
            <cylinderGeometry args={[2.3, 2.7, 0.7, 6]} />
            <meshLambertMaterial color={baseColor} />
          </mesh>
          {/* Peaks with snowcaps */}
          {[[-0.5, 0.2, 0.1, 0.55], [0.7, 0.15, -0.4, 0.45]].map(([x, y, z, r], i) => (
            <group key={i} position={[x as number, y as number, z as number]}>
              <mesh>
                <coneGeometry args={[r as number, (r as number) * 2.0, 6]} />
                <meshLambertMaterial color="#6b7280" />
              </mesh>
              <mesh position={[0, (r as number) * 0.8, 0]}>
                <coneGeometry args={[(r as number) * 0.5, (r as number) * 0.7, 6]} />
                <meshLambertMaterial color="#e5e7eb" />
              </mesh>
            </group>
          ))}
        </group>
      );

    case 'Crystal Caves':
      return (
        <group>
          <mesh position={[0, -0.55, 0]}>
            <cylinderGeometry args={[2.1, 2.4, 0.8, 10]} />
            <meshLambertMaterial color={baseColor} />
          </mesh>
          {/* Crystal spikes */}
          {[[-0.6, 0, 0.4], [0.6, 0, -0.3], [0.1, 0, 0.8]].map((p, i) => (
            <mesh key={i} position={[p[0], 0.1, p[2]]} rotation={[0, 0, 0.2 * i]}>
              <coneGeometry args={[0.15, 0.8, 5]} />
              <meshLambertMaterial color="#a78bfa" />
            </mesh>
          ))}
        </group>
      );

    case 'Celestial Isles':
      return (
        <group>
          {/* Floating base */}
          <mesh position={[0, -0.2, 0]}>
            <sphereGeometry args={[1.2, 16, 12]} />
            <meshLambertMaterial color={baseColor} />
          </mesh>
          {/* Floating rocks */}
          {[[-1.0, 0.6, 0.3], [1.1, 0.4, -0.5], [0.3, 0.8, 0.9]].map((p, i) => (
            <mesh key={i} position={[p[0], p[1], p[2]]}>
              <sphereGeometry args={[0.15, 10, 8]} />
              <meshLambertMaterial color="#9ca3af" />
            </mesh>
          ))}
          {/* Water aura below */}
          <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[12, 12]} />
            <meshLambertMaterial color={waterColor} transparent opacity={0.5} />
          </mesh>
        </group>
      );

    default: // Meadow
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
   }
});

interface Island3DProps {
  totalPets?: number;
  isAppActive?: boolean;
  currentLevel?: number;
  unlockedAnimals?: string[];
  currentBiome?: string;
}

export const Island3D = ({ totalPets = 0, isAppActive = true, currentLevel = 1, unlockedAnimals = ['Rabbit'], currentBiome = 'Meadow' }: Island3DProps) => {
  useEffect(() => {
    console.log('Island3D received currentBiome:', currentBiome);
  }, [currentBiome]);
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

          {/* GLB Island with Error Boundary */}
          <GLBErrorBoundary 
            fallback={
              <group scale={[2, 2, 2]} position={[0, -0.5, 0]}>
                <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[2, 2.5, 0.8, 16]} />
                  <meshLambertMaterial color="#4a7c59" />
                </mesh>
                <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[10, 10]} />
                  <meshLambertMaterial color="#3b82c7" transparent opacity={0.7} />
                </mesh>
              </group>
            }
          >
            <GLBIsland islandType="default-island" scale={0.05} />
          </GLBErrorBoundary>

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
            minDistance={2}
            maxDistance={50}
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
