// ───────────────────────────────────────────────────────────────
//  Animal.tsx  (drop-in replacement with GLB support)
// ───────────────────────────────────────────────────────────────
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, Suspense } from 'react';
import { GLBAnimal } from './GLBAnimal';
import { ANIMAL_MODEL_CONFIG } from './AnimalModelConfig';
import { GLBErrorBoundary } from './GLBErrorBoundary';

interface AnimalProps {
  totalPets: number;
  isActive: boolean;
  animalType: string;
  index: number;
}

const PrimitiveAnimal = ({
  totalPets,
  isActive,
  animalType,
  index,
}: AnimalProps) => {
  const ref = useRef<Group>(null);
  const [angle, setAngle] = useState(
    (index * Math.PI * 2) / Math.max(totalPets, 1)
  );
  const speed = Math.min(0.2 + totalPets * 0.03, 0.8);
  const radius = 1.2 + index * 0.3;
  const opacity = isActive ? Math.min(0.4 + totalPets * 0.1, 1) : 0.3;

  useFrame((state, dt) => {
    if (!ref.current || !isActive) return;
    const dir = index % 2 === 0 ? 1 : -1;
    setAngle((prev) => prev + dt * speed * dir);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    ref.current.position.set(x, 0.15, z);
    ref.current.rotation.y = angle + (Math.PI / 2) * dir;
    ref.current.position.y =
      0.15 + Math.sin(state.clock.elapsedTime * (6 + index)) * 0.04;
  });

  /* Helper to shorten repetitive mesh declarations */
  const Mesh = (p: any) => <mesh castShadow receiveShadow {...p} />;

  switch (animalType) {
    // ─── Rabbit ────────────────────────────────────────────────
    case 'Rabbit':
      return (
        <group ref={ref} position={[radius, 0.15, 0]}>
          {/* 1–3 Body */}
          <Mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.13, 8, 6]} />
            <meshLambertMaterial color="#EBDCCB" transparent opacity={opacity} />
          </Mesh>
          {/* 4 Chest */} {/* 5 Head */}
          <Mesh position={[0, 0.2, 0.02]}>
            <sphereGeometry args={[0.11, 8, 6]} />
            <meshLambertMaterial color="#EBDCCB" transparent opacity={opacity} />
          </Mesh>
          {/* 6–7 Ears */}
          <Mesh position={[-0.04, 0.33, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.16, 6]} />
            <meshLambertMaterial color="#F5F5F5" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0.04, 0.33, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.16, 6]} />
            <meshLambertMaterial color="#F5F5F5" transparent opacity={opacity} />
          </Mesh>
          {/* 8–9 Eyes */}
          <Mesh position={[-0.05, 0.22, 0.09]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          <Mesh position={[0.05, 0.22, 0.09]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          {/* 10 Nose */}
          <Mesh position={[0, 0.19, 0.11]}>
            <sphereGeometry args={[0.012, 4, 4]} />
            <meshLambertMaterial color="#D08A8A" />
          </Mesh>
          {/* 11–14 Legs */}
          {[-0.06, 0.06].map((x) =>
            [0, 1].map((i) => (
              <Mesh key={`${x}-${i}`} position={[x, -0.04, i ? 0.05 : -0.05]}>
                <cylinderGeometry args={[0.025, 0.025, 0.08, 6]} />
                <meshLambertMaterial
                  color="#EBDCCB"
                  transparent
                  opacity={opacity}
                />
              </Mesh>
            ))
          )}
          {/* 15 Tail */}
          <Mesh position={[0, 0.07, -0.12]}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshLambertMaterial color="#FFFFFF" transparent opacity={opacity} />
          </Mesh>
          {/* 16–18 Inner-ear accents */}
          <Mesh position={[-0.04, 0.33, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.14, 6]} />
            <meshLambertMaterial color="#FFC0CB" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0.04, 0.33, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.14, 6]} />
            <meshLambertMaterial color="#FFC0CB" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0, 0.2, -0.07]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshBasicMaterial color="#EBDCCB" transparent opacity={opacity} />
          </Mesh>
        </group>
      );

    // ─── Fox ───────────────────────────────────────────────────
    case 'Fox':
      return (
        <group ref={ref} position={[radius, 0.12, 0]}>
          {/* 1–2 Torso + chest */}
          <Mesh position={[0, 0.03, 0]}>
            <sphereGeometry args={[0.15, 8, 6]} />
            <meshLambertMaterial color="#E35928" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0, 0.18, 0.03]}>
            <coneGeometry args={[0.11, 0.2, 8]} />
            <meshLambertMaterial color="#E35928" transparent opacity={opacity} />
          </Mesh>
          {/* 3–4 Ears */}
          <Mesh position={[-0.07, 0.32, -0.01]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.03, 0.1, 4]} />
            <meshLambertMaterial color="#B14B10" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0.07, 0.32, -0.01]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.03, 0.1, 4]} />
            <meshLambertMaterial color="#B14B10" transparent opacity={opacity} />
          </Mesh>
          {/* 5–6 Eyes */}
          <Mesh position={[-0.05, 0.22, 0.11]}>
            <sphereGeometry args={[0.016, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          <Mesh position={[0.05, 0.22, 0.11]}>
            <sphereGeometry args={[0.016, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          {/* 7 Snout tip */}
          <Mesh position={[0, 0.16, 0.14]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          {/* 8–11 Legs */}
          {[-0.08, 0.08].map((x) =>
            [0, 1].map((i) => (
              <Mesh key={`${x}-${i}`} position={[x, -0.06, i ? 0.06 : -0.06]}>
                <cylinderGeometry args={[0.028, 0.028, 0.12, 6]} />
                <meshLambertMaterial
                  color="#E35928"
                  transparent
                  opacity={opacity}
                />
              </Mesh>
            ))
          )}
          {/* 12–14 Tail segments */}
          {Array.from({ length: 3 }).map((_, i) => (
            <Mesh
              key={i}
              position={[0, 0.05 + i * 0.05, -0.18 - i * 0.05]}
              rotation={[i * 0.1, 0, 0]}
            >
              <sphereGeometry args={[0.08 - i * 0.015, 6, 6]} />
              <meshLambertMaterial
                color={i === 2 ? '#FFFFFF' : '#E35928'}
                transparent
                opacity={opacity}
              />
            </Mesh>
          ))}
          {/* 15–18 White muzzle + accents */}
          <Mesh position={[0, 0.2, 0.08]}>
            <sphereGeometry args={[0.055, 6, 4]} />
            <meshLambertMaterial color="#FFFFFF" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[-0.05, 0.27, -0.04]}>
            <sphereGeometry args={[0.03, 4, 4]} />
            <meshLambertMaterial color="#FFFFFF" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0.05, 0.27, -0.04]}>
            <sphereGeometry args={[0.03, 4, 4]} />
            <meshLambertMaterial color="#FFFFFF" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0, 0.05, -0.02]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshBasicMaterial color="#E35928" transparent opacity={opacity} />
          </Mesh>
        </group>
      );

    // ─── Bear / Panda ────────────────────────────────────────────
    case 'Bear':
    case 'Panda': {
      const isPanda = animalType === 'Panda';
      const torsoColor = isPanda ? '#FFFFFF' : '#7B4B27';
      const limbColor = isPanda ? '#000000' : '#7B4B27';
      const earColor = isPanda ? '#000000' : '#4D3017';
      const muzzleColor = isPanda ? '#FFFFFF' : '#C9A27D';
      const bellyColor = isPanda ? '#FFFFFF' : '#9C6C43';

      return (
        <group ref={ref} position={[radius, 0.1, 0]}>
          {/* 1 Torso */}
          <Mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.2, 10, 8]} />
            <meshLambertMaterial color={torsoColor} transparent opacity={opacity} />
          </Mesh>
          {/* 2 Chest */}
          <Mesh position={[0, 0.25, 0.01]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshLambertMaterial color={torsoColor} transparent opacity={opacity} />
          </Mesh>
          {/* 3–4 Ears */}
          <Mesh position={[-0.1, 0.4, -0.01]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshLambertMaterial color={earColor} transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0.1, 0.4, -0.01]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshLambertMaterial color={earColor} transparent opacity={opacity} />
          </Mesh>
          {/* 5–6 Eyes */}
          <Mesh position={[-0.06, 0.28, 0.11]}>
            <sphereGeometry args={[0.02, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          <Mesh position={[0.06, 0.28, 0.11]}>
            <sphereGeometry args={[0.02, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          {/* 7 Snout */}
          <Mesh position={[0, 0.22, 0.12]}>
            <sphereGeometry args={[0.06, 6, 4]} />
            <meshLambertMaterial color={muzzleColor} />
          </Mesh>
          {/* 8 Nose tip */}
          <Mesh position={[0, 0.22, 0.17]}>
            <sphereGeometry args={[0.022, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          {/* 9–12 Arms */}
          {[-0.18, 0.18].map((x) => (
            <Mesh key={x} position={[x, 0.12, 0]}>
              <cylinderGeometry args={[0.04, 0.05, 0.2, 8]} />
              <meshLambertMaterial color={limbColor} transparent opacity={opacity} />
            </Mesh>
          ))}
          {/* 13–16 Legs */}
          {[-0.1, 0.1].map((x) =>
            [0, 1].map((i) => (
              <Mesh key={`${x}-${i}`} position={[x + i * 0.08, -0.12, 0.05]}>
                <cylinderGeometry args={[0.05, 0.06, 0.24, 8]} />
                <meshLambertMaterial color={limbColor} transparent opacity={opacity} />
              </Mesh>
            ))
          )}
          {/* 17–18 Belly patches */}
          <Mesh position={[0, 0.02, 0.05]}>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshLambertMaterial color={bellyColor} transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0, 0.1, 0.04]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshLambertMaterial color={bellyColor} transparent opacity={opacity} />
          </Mesh>
        </group>
      );
    }

    // ─── Deer ──────────────────────────────────────────────────
    case 'Deer':
      return (
        <group ref={ref} position={[radius, 0.15, 0]}>
          {/* 1–2 Body + chest */}
          <Mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.13, 8, 6]} />
            <meshLambertMaterial color="#C39A5F" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.11, 8, 6]} />
            <meshLambertMaterial color="#C39A5F" transparent opacity={opacity} />
          </Mesh>
          {/* 3–4 Antlers */}
          {[-0.05, 0.05].map((x) => (
            <Mesh key={x} position={[x, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.007, 0.007, 0.18]} />
              <meshLambertMaterial color="#6B4F2A" transparent opacity={opacity} />
            </Mesh>
          ))}
          {/* 5–6 Antler branches */}
          {[-0.06, 0.06].map((x) => (
            <Mesh
              key={`b-${x}`}
              position={[x, 0.38, 0.02]}
              rotation={[Math.PI / 3, 0, 0]}
            >
              <cylinderGeometry args={[0.006, 0.006, 0.11]} />
              <meshLambertMaterial color="#6B4F2A" transparent opacity={opacity} />
            </Mesh>
          ))}
          {/* 7–8 Eyes */}
          <Mesh position={[-0.05, 0.22, 0.09]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          <Mesh position={[0.05, 0.22, 0.09]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          {/* 9 Nose */}
          <Mesh position={[0, 0.18, 0.12]}>
            <sphereGeometry args={[0.012, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          {/* 10–13 Legs */}
          {[-0.06, 0.06].map((x) =>
            [0, 1].map((i) => (
              <Mesh key={`${x}-${i}`} position={[x, -0.16, i ? 0.06 : -0.06]}>
                <cylinderGeometry args={[0.018, 0.018, 0.32, 6]} />
                <meshLambertMaterial
                  color="#C39A5F"
                  transparent
                  opacity={opacity}
                />
              </Mesh>
            ))
          )}
          {/* 14–17 Spots */}
          {[-0.05, 0, 0.05].map((x, i) => (
            <Mesh key={i} position={[x, 0.06 + i * 0.03, -0.1]}>
              <sphereGeometry args={[0.02, 4, 4]} />
              <meshLambertMaterial color="#F9F5EF" />
            </Mesh>
          ))}
          {/* 18 Tail */}
          <Mesh position={[0, 0.07, -0.15]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshLambertMaterial color="#F9F5EF" />
          </Mesh>
        </group>
      );

    // ─── Owl (larger wingspan, ~18 primitives) ──────────────────
    case 'Owl':
      return (
        <group ref={ref} position={[radius, 0.25, 0]}>
          {/* 1–2 Body + head */}
          <Mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshLambertMaterial color="#8F7A64" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0, 0.18, 0]}>
            <sphereGeometry args={[0.14, 8, 6]} />
            <meshLambertMaterial color="#8F7A64" transparent opacity={opacity} />
          </Mesh>
          {/* 3–4 Eyes */}
          <Mesh position={[-0.06, 0.22, 0.11]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshLambertMaterial color="#FFD700" />
          </Mesh>
          <Mesh position={[0.06, 0.22, 0.11]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshLambertMaterial color="#FFD700" />
          </Mesh>
          {/* 5 Beak */}
          <Mesh position={[0, 0.18, 0.14]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.02, 0.06, 6]} />
            <meshLambertMaterial color="#DDA431" />
          </Mesh>
          {/* 6–9 Wings (two segments each) */}
          {[-0.18, 0.18].map((x) =>
            [0, 1].map((i) => (
              <Mesh
                key={`${x}-${i}`}
                position={[x, 0.02 - i * 0.05, i ? -0.02 : 0.02]}
                rotation={[0, 0, x > 0 ? -0.4 : 0.4]}
              >
                <sphereGeometry
                  args={[i ? 0.07 : 0.09, 6, 6, 0, Math.PI]}
                />
                <meshLambertMaterial
                  color="#6B5846"
                  transparent
                  opacity={opacity}
                  side={2}
                />
              </Mesh>
            ))
          )}
          {/* 10–13 Feet */}
          {[-0.05, 0.05].map((x) =>
            [0, 1].map((i) => (
              <Mesh key={`${x}-${i}`} position={[x, -0.08, i ? 0 : 0.04]}>
                <cylinderGeometry args={[0.015, 0.015, 0.07, 6]} />
                <meshLambertMaterial color="#DDA431" />
              </Mesh>
            ))
          )}
          {/* 14–17 Ear tufts */}
          {[-0.06, 0.06].map((x) =>
            [0, 1].map((i) => (
              <Mesh
                key={`${x}-${i}`}
                position={[x, 0.28 + 0.03 * i, -0.02]}
                rotation={[0, 0, x > 0 ? -0.3 : 0.3]}
              >
                <coneGeometry args={[0.02, 0.06 - i * 0.015, 4]} />
                <meshLambertMaterial
                  color="#6B5846"
                  transparent
                  opacity={opacity}
                />
              </Mesh>
            ))
          )}
          {/* 18 Tail */}
          <Mesh position={[0, -0.05, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.06, 0.12, 6]} />
            <meshLambertMaterial color="#6B5846" transparent opacity={opacity} />
          </Mesh>
        </group>
      );

    // ─── Elephant ───────────────────────────────────────────────
    case 'Elephant':
      return (
        <group ref={ref} position={[radius, 0.15, 0]}>
          {/* Body */}
          <Mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.2, 0.18, 0.25, 8]} />
            <meshLambertMaterial color="#A0A0A0" transparent opacity={opacity} />
          </Mesh>
          {/* Head */}
          <Mesh position={[0, 0.28, 0.15]}>
            <sphereGeometry args={[0.15, 8, 6]} />
            <meshLambertMaterial color="#A0A0A0" transparent opacity={opacity} />
          </Mesh>
          {/* Trunk */}
          <Mesh position={[0, 0.2, 0.28]}>
            <cylinderGeometry args={[0.04, 0.06, 0.2, 8]} />
            <meshLambertMaterial color="#A0A0A0" transparent opacity={opacity} />
          </Mesh>
          {/* Ears */}
          <Mesh position={[-0.12, 0.3, 0.08]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.08, 0.05, 0.02, 8]} />
            <meshLambertMaterial color="#909090" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0.12, 0.3, 0.08]} rotation={[0, 0, -0.3]}>
            <cylinderGeometry args={[0.08, 0.05, 0.02, 8]} />
            <meshLambertMaterial color="#909090" transparent opacity={opacity} />
          </Mesh>
          {/* Eyes */}
          <Mesh position={[-0.06, 0.32, 0.22]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          <Mesh position={[0.06, 0.32, 0.22]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshLambertMaterial color="black" />
          </Mesh>
          {/* Legs */}
          <Mesh position={[-0.1, -0.1, 0.08]}>
            <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
            <meshLambertMaterial color="#A0A0A0" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0.1, -0.1, 0.08]}>
            <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
            <meshLambertMaterial color="#A0A0A0" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[-0.1, -0.1, -0.08]}>
            <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
            <meshLambertMaterial color="#A0A0A0" transparent opacity={opacity} />
          </Mesh>
          <Mesh position={[0.1, -0.1, -0.08]}>
            <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
            <meshLambertMaterial color="#A0A0A0" transparent opacity={opacity} />
          </Mesh>
          {/* Tail */}
          <Mesh position={[0, 0.1, -0.2]}>
            <cylinderGeometry args={[0.015, 0.02, 0.15, 6]} />
            <meshLambertMaterial color="#A0A0A0" transparent opacity={opacity} />
          </Mesh>
        </group>
      );

    // ─── Default placeholder ───────────────────────────────────
    default:
      return (
        <group ref={ref} position={[radius, 0.15, 0]}>
          <Mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshLambertMaterial color="#CCCCCC" transparent opacity={opacity} />
          </Mesh>
        </group>
      );
  }
};

export const Animal = ({ totalPets, isActive, animalType, index }: AnimalProps) => {
  const modelConfig = ANIMAL_MODEL_CONFIG[animalType];
  
  // Use GLB model if configured and available
  if (modelConfig?.type === 'glb' && modelConfig.modelPath) {
    console.log(`Animal: Using GLB for ${animalType} with config:`, modelConfig);
    return (
      <Suspense fallback={
        <PrimitiveAnimal 
          totalPets={totalPets}
          isActive={isActive}
          animalType={animalType}
          index={index}
        />
      }>
        <GLBErrorBoundary fallback={
          <PrimitiveAnimal 
            totalPets={totalPets}
            isActive={isActive}
            animalType={animalType}
            index={index}
          />
        }>
          <GLBAnimal
            modelPath={modelConfig.modelPath}
            animalType={animalType}
            totalPets={totalPets}
            isActive={isActive}
            index={index}
            scale={modelConfig.scale}
            animationName={modelConfig.animationName}
          />
        </GLBErrorBoundary>
      </Suspense>
    );
  }
  
  // Fallback to primitive animal
  return (
    <PrimitiveAnimal 
      totalPets={totalPets}
      isActive={isActive}
      animalType={animalType}
      index={index}
    />
  );
};