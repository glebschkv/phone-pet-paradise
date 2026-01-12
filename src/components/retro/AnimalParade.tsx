import { memo, useMemo } from 'react';
import { SpriteAnimal } from './SpriteAnimal';
import { AnimalData } from '@/data/AnimalDatabase';
import { useAnimalPositionRegistry } from './useAnimalPositions';

// Debug ruler overlay - set to true to show measurement lines
const SHOW_DEBUG_RULER = true;

const DebugRulerOverlay = memo(({ groundLevel }: { groundLevel: number }) => {
  const lines = [];
  for (let i = 0; i <= 40; i += 2) {
    lines.push(i);
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
      {lines.map((percent) => (
        <div
          key={percent}
          className="absolute w-full"
          style={{
            bottom: `${percent}%`,
            height: percent % 10 === 0 ? '2px' : '1px',
            backgroundColor: percent % 10 === 0 ? '#ff0000' : percent % 5 === 0 ? '#0066ff' : 'rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="absolute left-1 px-1 text-xs font-mono"
            style={{
              backgroundColor: 'rgba(255,255,255,0.9)',
              color: percent % 10 === 0 ? '#ff0000' : percent % 5 === 0 ? '#0066ff' : '#666',
              fontWeight: percent % 10 === 0 ? 'bold' : 'normal',
              transform: 'translateY(-50%)',
              fontSize: '10px',
            }}
          >
            {percent}%
          </div>
        </div>
      ))}
      {/* Ground level indicator */}
      <div
        className="absolute w-full"
        style={{
          bottom: `${groundLevel}%`,
          height: '3px',
          backgroundColor: '#00ff00',
          zIndex: 1001,
        }}
      >
        <div
          className="absolute left-1/2 px-2 py-1 text-xs font-bold font-mono rounded"
          style={{
            backgroundColor: '#00cc00',
            color: 'white',
            transform: 'translate(-50%, -120%)',
            fontSize: '10px',
          }}
        >
          GROUND: {groundLevel}%
        </div>
      </div>
    </div>
  );
});
DebugRulerOverlay.displayName = 'DebugRulerOverlay';

interface AnimalParadeProps {
  unlockedAnimals: AnimalData[];
  groundLevel?: number; // Ground level percentage from bottom
}

export const AnimalParade = memo(({ unlockedAnimals, groundLevel = 8 }: AnimalParadeProps) => {
  // Create shared position registry for collision-aware spacing
  const positionRegistry = useAnimalPositionRegistry();

  // Create parade formation from active ground animals
  const paradeAnimals = useMemo(() => {
    // Only show animals with sprite configs
    const spriteAnimals = unlockedAnimals.filter(a => a.spriteConfig);

    if (spriteAnimals.length === 0) return [];

    // Distribute animals evenly across the screen
    // This ensures better initial spacing to prevent bunching
    const totalAnimals = spriteAnimals.length;
    const spacing = 1.0 / Math.max(totalAnimals, 1);

    return spriteAnimals.map((animal, index) => ({
      animal,
      // Distribute starting positions evenly across the screen
      position: (index * spacing) % 1.0,
      speed: 30, // Base speed - will be adjusted dynamically
      key: `ground-${animal.id}-${index}`
    }));
  }, [unlockedAnimals]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {SHOW_DEBUG_RULER && <DebugRulerOverlay groundLevel={groundLevel} />}
      {paradeAnimals.map(({ animal, position, speed, key }) => (
        <SpriteAnimal
          key={key}
          animalId={key}
          animal={animal}
          position={position}
          speed={speed}
          positionRegistry={positionRegistry}
          groundLevel={groundLevel}
        />
      ))}
    </div>
  );
});

AnimalParade.displayName = 'AnimalParade';
