// Special animations that can play randomly while walking
// Maps the base sprite path to available special animation configurations

export interface SpecialAnimationConfig {
  spritePath: string;
  frameCount: number;
  frameWidth: number;
  frameHeight: number;
  animationSpeed?: number;
  playOnce?: boolean; // If true, plays once then returns to walk (default true)
}

// Map of base sprite paths to their available special animations
// Excludes death, hurt, and attack animations - only fun/idle ones
export const SPECIAL_ANIMATIONS: Record<string, SpecialAnimationConfig[]> = {
  // Crab special animations
  '/assets/sprites/CRAB_CRABWALK.png': [
    {
      spritePath: '/assets/sprites/CRAB_Special.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/CRAB_Idle.png',
      frameCount: 4,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 6,
      playOnce: true
    }
  ],

  // DudeMonster Walk2 special animations
  '/assets/sprites/DudeMonster_Walk2.png': [
    {
      spritePath: '/assets/sprites/DudeMonster_Happy.png',
      frameCount: 6,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 10,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/DudeMonster_Roll.png',
      frameCount: 6,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/DudeMonster_Squat.png',
      frameCount: 4,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // DudeMonster Happy special animations (for Night Sprite)
  '/assets/sprites/DudeMonster_Happy.png': [
    {
      spritePath: '/assets/sprites/DudeMonster_Roll.png',
      frameCount: 6,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/DudeMonster_Squat.png',
      frameCount: 4,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // DudeMonster Roll special animations (for Jungle Spirit)
  '/assets/sprites/DudeMonster_Roll.png': [
    {
      spritePath: '/assets/sprites/DudeMonster_Happy.png',
      frameCount: 6,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 10,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/DudeMonster_Squat.png',
      frameCount: 4,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // DudeMonster Slide special animations (for Frost Spirit)
  '/assets/sprites/DudeMonster_Slide.png': [
    {
      spritePath: '/assets/sprites/DudeMonster_Happy.png',
      frameCount: 6,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 10,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/DudeMonster_Squat.png',
      frameCount: 4,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // DudeMonster Squat special animations (for Cosmic Spirit)
  '/assets/sprites/DudeMonster_Squat.png': [
    {
      spritePath: '/assets/sprites/DudeMonster_Happy.png',
      frameCount: 6,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 10,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/DudeMonster_Roll.png',
      frameCount: 6,
      frameWidth: 32,
      frameHeight: 32,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Horse Walk special animations
  '/assets/sprites/Horse_Walk.png': [
    {
      spritePath: '/assets/sprites/Horse_Jump.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Horse_Idle.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6,
      playOnce: true
    }
  ],

  // Horse Jump special animations (for Sunset Stallion, Unicorn, Aurora Horse)
  '/assets/sprites/Horse_Jump.png': [
    {
      spritePath: '/assets/sprites/Horse_Idle.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6,
      playOnce: true
    }
  ],

  // Octopus Walk special animations
  '/assets/sprites/OCTOPUS_Walk.png': [
    {
      spritePath: '/assets/sprites/OCTOPUS_Special.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/OCTOPUS_Idle.png',
      frameCount: 4,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 6,
      playOnce: true
    }
  ],

  // Shark Walk special animations
  '/assets/sprites/SHARK_Walk.png': [
    {
      spritePath: '/assets/sprites/SHARK_Special.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 9,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/SHARK_Idle.png',
      frameCount: 4,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 6,
      playOnce: true
    }
  ],

  // Turtle Walk special animations
  '/assets/sprites/Turtle_Walk.png': [
    {
      spritePath: '/assets/sprites/Turtle_Swim.png',
      frameCount: 6,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Turtle_Idle.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 5,
      playOnce: true
    }
  ],

  // Bear Walk special animations
  '/assets/sprites/Bear_Walk.png': [
    {
      spritePath: '/assets/sprites/Bear_Idle.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6,
      playOnce: true
    }
  ],

  // Bird Fly special animations (for flying birds)
  '/assets/sprites/Bird_Fly.png': [
    {
      spritePath: '/assets/sprites/Bird_Idle.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Snake Walk special animations
  '/assets/sprites/SNAKE_Walk.png': [
    {
      spritePath: '/assets/sprites/SNAKE_Idle.png',
      frameCount: 4,
      frameWidth: 48,
      frameHeight: 48,
      animationSpeed: 6,
      playOnce: true
    }
  ],

  // Elk Walk special animations
  '/assets/sprites/ELK_WALK.png': [
    {
      spritePath: '/assets/sprites/ELK_IDLE.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6,
      playOnce: true
    }
  ],

  // Camel Walk special animations
  '/assets/sprites/Camel_Walk.png': [
    {
      spritePath: '/assets/sprites/Camel_Idle.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 5,
      playOnce: true
    }
  ],

  // Lizard Walk special animations
  '/assets/sprites/Lizard_Walk.png': [
    {
      spritePath: '/assets/sprites/Lizard_Idle.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 6,
      playOnce: true
    }
  ],

  // Hare Walk special animations
  '/assets/sprites/HARE_WALK.png': [
    {
      spritePath: '/assets/sprites/HARE_IDLE.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // White Hare Walk special animations
  '/assets/sprites/Whitehare_Walk.png': [
    {
      spritePath: '/assets/sprites/Whitehare_Idle.png',
      frameCount: 4,
      frameWidth: 28,
      frameHeight: 28,
      animationSpeed: 8,
      playOnce: true
    }
  ]
};

// Get available special animations for a sprite path
export const getSpecialAnimations = (spritePath: string): SpecialAnimationConfig[] => {
  return SPECIAL_ANIMATIONS[spritePath] || [];
};

// Check if a sprite has special animations available
export const hasSpecialAnimations = (spritePath: string): boolean => {
  return spritePath in SPECIAL_ANIMATIONS && SPECIAL_ANIMATIONS[spritePath].length > 0;
};

// Get a random special animation for a sprite
export const getRandomSpecialAnimation = (spritePath: string): SpecialAnimationConfig | null => {
  const animations = SPECIAL_ANIMATIONS[spritePath];
  if (!animations || animations.length === 0) return null;
  return animations[Math.floor(Math.random() * animations.length)];
};
