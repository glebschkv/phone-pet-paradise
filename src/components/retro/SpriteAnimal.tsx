import { memo, useState, useEffect } from 'react';
import { AnimalData } from '@/data/AnimalDatabase';

interface SpriteAnimalProps {
  animal: AnimalData;
  position: number;
  speed: number;
}

import { memo, useState, useEffect } from ‘react’;

// Mock AnimalData type for demonstration
interface SpriteConfig {
spritePath: string;
frameCount: number;
frameWidth: number;
frameHeight: number;
}

interface AnimalData {
name: string;
spriteConfig?: SpriteConfig;
}

interface SpriteAnimalProps {
animal: AnimalData;
position: number;
speed: number;
}

export const SpriteAnimal = memo(({ animal, position, speed }: SpriteAnimalProps) => {
const [currentPosition, setCurrentPosition] = useState(position);
const [currentFrame, setCurrentFrame] = useState(0);
const [direction, setDirection] = useState<‘right’ | ‘left’>(‘right’);

const spriteConfig = animal.spriteConfig;
if (!spriteConfig) return null;

const { spritePath, frameCount, frameWidth, frameHeight } = spriteConfig;

// Animate sprite frames
useEffect(() => {
const frameInterval = setInterval(() => {
setCurrentFrame(prev => (prev + 1) % frameCount);
}, 100); // Change frame every 100ms for smooth animation

```
return () => clearInterval(frameInterval);
```

}, [frameCount]);

// Animate position and handle direction changes
useEffect(() => {
let animationFrame: number;
let lastTime = performance.now();

```
const animate = (currentTime: number) => {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  setCurrentPosition(prev => {
    const movement = (speed * deltaTime) / window.innerWidth;
    const newPosition = prev + (direction === 'right' ? movement : -movement);
    
    // Bounce back when reaching edges
    if (newPosition > 0.9) {
      setDirection('left');
      return 0.9;
    } else if (newPosition < 0.1) {
      setDirection('right');
      return 0.1;
    }
    
    return newPosition;
  });

  animationFrame = requestAnimationFrame(animate);
};

animationFrame = requestAnimationFrame(animate);

return () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
};
```

}, [speed, direction]);

// Scale up the sprite for better visibility
const scale = 3;
const scaledWidth = frameWidth * scale;
const scaledHeight = frameHeight * scale;

return (
<div
className=“absolute bottom-[40%]”
style={{
left: `${currentPosition * 100}%`,
width: `${scaledWidth}px`,
height: `${scaledHeight}px`,
zIndex: 10,
transform: direction === ‘left’ ? ‘scaleX(-1)’ : ‘scaleX(1)’,
transition: ‘transform 0.3s ease’
}}
>
<div
className=“w-full h-full”
style={{
backgroundImage: `url(${spritePath})`,
backgroundSize: `${frameCount * 100}% 100%`,
backgroundRepeat: ‘no-repeat’,
backgroundPosition: `${-(currentFrame * 100)}% 0`,
imageRendering: ‘pixelated’
}}
/>

```
  {/* Animal name tooltip on hover */}
  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
    <div className="bg-card/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium whitespace-nowrap border border-border">
      {animal.name}
    </div>
  </div>
</div>
```

);
});

SpriteAnimal.displayName = ‘SpriteAnimal’;

// Demo component
export default function Demo() {
const demoAnimal: AnimalData = {
name: ‘Demo Dog’,
spriteConfig: {
spritePath: ‘https://i.imgur.com/example.png’,
frameCount: 6,
frameWidth: 32,
frameHeight: 32
}
};

return (
<div className="relative w-full h-screen bg-gradient-to-b from-sky-200 to-green-100">
<div className="absolute inset-0 flex items-center justify-center">
<div className="text-center space-y-4">
<h1 className="text-4xl font-bold text-gray-800">SpriteAnimal Component</h1>
<p className="text-gray-600">The walking sprite will appear below</p>
<div className="bg-white/80 p-4 rounded-lg max-w-md mx-auto">
<p className="text-sm text-gray-700">Copy the component code above and use it in your project!</p>
</div>
</div>
</div>
<SpriteAnimal animal={demoAnimal} position={0.1} speed={100} />
</div>
);
}