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
  ],

  // Dragon 1 Walk special animations
  '/assets/sprites/DRAGON1_Walk.png': [
    {
      spritePath: '/assets/sprites/DRAGON1_Idle.png',
      frameCount: 7,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/DRAGON1_Special.png',
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Dragon 2 Walk special animations
  '/assets/sprites/DRAGON2_Walk.png': [
    {
      spritePath: '/assets/sprites/DRAGON2_Idle.png',
      frameCount: 7,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/DRAGON2_Special.png',
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Dragon 3 Walk special animations
  '/assets/sprites/DRAGON3_Walk.png': [
    {
      spritePath: '/assets/sprites/DRAGON3_Idle.png',
      frameCount: 7,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/DRAGON3_Special.png',
      frameCount: 12,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Dragon Flight special animations (for flying dragons)
  '/assets/sprites/DRAGON1_Flight.png': [
    {
      spritePath: '/assets/sprites/DRAGON1_Idle.png',
      frameCount: 7,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  '/assets/sprites/DRAGON2_Flight.png': [
    {
      spritePath: '/assets/sprites/DRAGON2_Idle.png',
      frameCount: 7,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  '/assets/sprites/DRAGON3_Flight.png': [
    {
      spritePath: '/assets/sprites/DRAGON3_Idle.png',
      frameCount: 7,
      frameWidth: 256,
      frameHeight: 256,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Slime 1 Walk special animations
  '/assets/sprites/Slime1_Walk_without_shadow.png': [
    {
      spritePath: '/assets/sprites/Slime1_Idle_without_shadow.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Slime1_Run_without_shadow.png',
      frameCount: 8,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 14,
      playOnce: true
    }
  ],

  // Slime 2 Walk special animations
  '/assets/sprites/Slime2_Walk_without_shadow.png': [
    {
      spritePath: '/assets/sprites/Slime2_Idle_without_shadow.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Slime2_Run_without_shadow.png',
      frameCount: 8,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 14,
      playOnce: true
    }
  ],

  // Slime 3 Walk special animations
  '/assets/sprites/Slime3_Walk_without_shadow.png': [
    {
      spritePath: '/assets/sprites/Slime3_Idle_without_shadow.png',
      frameCount: 6,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Slime3_Run_without_shadow.png',
      frameCount: 8,
      frameWidth: 64,
      frameHeight: 64,
      animationSpeed: 14,
      playOnce: true
    }
  ],

  // Slime Boss 1 Walk special animations
  '/assets/sprites/Slime_boss1_Walk_without_shadow.png': [
    {
      spritePath: '/assets/sprites/Slime_boss1_Idle_without_shadow.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 7,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Slime_boss1_Run_without_shadow.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Slime Boss 2 Walk special animations
  '/assets/sprites/Slime_boss2_Walk_without_shadow.png': [
    {
      spritePath: '/assets/sprites/Slime_boss2_Idle_without_shadow.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 7,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Slime_boss2_Run_without_shadow.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Slime Boss 3 Walk special animations
  '/assets/sprites/Slime_boss3_Walk_without_shadow.png': [
    {
      spritePath: '/assets/sprites/Slime_boss3_Idle_without_shadow.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 7,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Slime_boss3_Run_without_shadow.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Vampire Bat Walk special animations
  '/assets/sprites/VampireBat_walk.png': [
    {
      spritePath: '/assets/sprites/VampireBat_idle.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/VampireBat_sneer.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Goblin King Walk special animations
  '/assets/sprites/GoblinKing_walk.png': [
    {
      spritePath: '/assets/sprites/GoblinKing_idle.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/GoblinKing_sneer.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Mech Walk special animations
  '/assets/sprites/Mech_walk.png': [
    {
      spritePath: '/assets/sprites/Mech_idle.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Mech_sneer.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Mech Attack special animation (for Mech Warrior)
  '/assets/sprites/Mech_attack1.png': [
    {
      spritePath: '/assets/sprites/Mech_idle.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6,
      playOnce: true
    }
  ],

  // HugeMushroom Walk special animations
  '/assets/sprites/HugeMushroom_walk.png': [
    {
      spritePath: '/assets/sprites/HugeMushroom_idle.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 6,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/HugeMushroom_sneer.png',
      frameCount: 4,
      frameWidth: 72,
      frameHeight: 72,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Metal Shark Swim special animations
  '/assets/sprites/metalshark_Swim.png': [
    {
      spritePath: '/assets/sprites/metalshark_Idle.png',
      frameCount: 4,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 6,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/metalshark_Swim2.png',
      frameCount: 6,
      frameWidth: 96,
      frameHeight: 96,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SPRITE SPECIAL ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Cat special animations
  '/assets/sprites/Cat_Walk.png': [
    {
      spritePath: '/assets/sprites/Cat_Idle.png',
      frameCount: 7,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Cat_Special.png',
      frameCount: 4,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Cat_Jamp.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Baby Dragon special animations
  '/assets/sprites/BabyDragon_Walk.png': [
    {
      spritePath: '/assets/sprites/BabyDragon_Idle.png',
      frameCount: 9,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/BabyDragon_Attack_1.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // Golden Fox special animations
  '/assets/sprites/GoldenFox_Walk.png': [
    {
      spritePath: '/assets/sprites/GoldenFox_Idle.png',
      frameCount: 7,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/GoldenFox_Attack_1.png',
      frameCount: 4,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // Little Lizard special animations
  '/assets/sprites/LittleLizard_Walk.png': [
    {
      spritePath: '/assets/sprites/LittleLizard_Idle.png',
      frameCount: 7,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/LittleLizard_Attack_1.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // Doggo special animations
  '/assets/sprites/doggo_Walk.png': [
    {
      spritePath: '/assets/sprites/doggo_Jump.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/doggo_Special.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // Doggo2 special animations
  '/assets/sprites/doggo2_Walk.png': [
    {
      spritePath: '/assets/sprites/doggo2_Jamp.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/doggo2_Special.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // Kitsune special animations
  '/assets/sprites/Kitsune_Walk.png': [
    {
      spritePath: '/assets/sprites/Kitsune_Idle.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Kitsune_Run.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Kitsune_Jump.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Karasu Tengu special animations
  '/assets/sprites/KarasuTengu_Walk.png': [
    {
      spritePath: '/assets/sprites/KarasuTengu_Idle.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/KarasuTengu_Run.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/KarasuTengu_Jump.png',
      frameCount: 15,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 14,
      playOnce: true
    }
  ],

  // Yamabushi Tengu special animations
  '/assets/sprites/YamabushTengu_Walk.png': [
    {
      spritePath: '/assets/sprites/YamabushTengu_Idle.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/YamabushTengu_Run.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/YamabushTengu_Jump.png',
      frameCount: 15,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 14,
      playOnce: true
    }
  ],

  // Knight special animations (Silver Knight)
  '/assets/sprites/knight1_Idle_2.png': [
    {
      spritePath: '/assets/sprites/knight1_Roll.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/knight1_Elixir.png',
      frameCount: 4,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Knight3 special animations (Golden Knight)
  '/assets/sprites/Knight3_Idle_2.png': [
    {
      spritePath: '/assets/sprites/Knight3_Roll.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Knight3_Elixir.png',
      frameCount: 4,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Royal Knight special animations
  '/assets/sprites/KNIGHT2REAL_knight1_Idle_2.png': [
    {
      spritePath: '/assets/sprites/KNIGHT2REAL_knight1_Roll.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/KNIGHT2REAL_knight1_Invocation.png',
      frameCount: 5,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Elf Archer special animations
  '/assets/sprites/elf1_Walk.png': [
    {
      spritePath: '/assets/sprites/elf1_Idle.png',
      frameCount: 21,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/elf1_Attack.png',
      frameCount: 11,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Elf Mage special animations
  '/assets/sprites/elf2_Walk.png': [
    {
      spritePath: '/assets/sprites/elf2_Idle.png',
      frameCount: 5,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Elf Warrior special animations
  '/assets/sprites/elf3_Walk.png': [
    {
      spritePath: '/assets/sprites/elf3_Idle.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Zombie Walker special animations
  '/assets/sprites/zombie1walk.png': [
    {
      spritePath: '/assets/sprites/zombie1run.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Zombie Sprinter special animations
  '/assets/sprites/zombie2walk.png': [
    {
      spritePath: '/assets/sprites/zombie2run.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Zombie Brute special animations
  '/assets/sprites/zombie3walk.png': [
    {
      spritePath: '/assets/sprites/zombie3run.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // Demon Imp special animations
  '/assets/sprites/demon1_Walk.png': [
    {
      spritePath: '/assets/sprites/demon1_Idle.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/demon1_Attack.png',
      frameCount: 9,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Demon Warrior special animations
  '/assets/sprites/demon2_Walk.png': [
    {
      spritePath: '/assets/sprites/demon2_Idle.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/demon2_Attack.png',
      frameCount: 5,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // Demon Lord special animations
  '/assets/sprites/demon3_Walk.png': [
    {
      spritePath: '/assets/sprites/demon3_Idle.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/demon3_Attack.png',
      frameCount: 5,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // Dwarf Miner special animations
  '/assets/sprites/dwarf1_Walk.png': [
    {
      spritePath: '/assets/sprites/dwarf1_Idle_2.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/dwarf1_Jump.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/dwarf1_Special.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // Dwarf Warrior special animations
  '/assets/sprites/dwarf2_Walk.png': [
    {
      spritePath: '/assets/sprites/dwarf2_Run.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/dwarf2_Jump.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Dwarf King special animations
  '/assets/sprites/dwarf3_Walk.png': [
    {
      spritePath: '/assets/sprites/dwarf3_Run.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/dwarf3_Special.png',
      frameCount: 4,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Holy Priest special animations
  '/assets/sprites/Priest1_Walk.png': [
    {
      spritePath: '/assets/sprites/Priest1_Idle.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Priest1_Special.png',
      frameCount: 11,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // Temple Monk special animations
  '/assets/sprites/Priests2_Walk.png': [
    {
      spritePath: '/assets/sprites/Priests2_Idle.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Ancient Sage special animations
  '/assets/sprites/Priests3_Walk.png': [
    {
      spritePath: '/assets/sprites/Priests3_Idle.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    }
  ],

  // Lab Researcher special animations
  '/assets/sprites/Scientist1_Walk.png': [
    {
      spritePath: '/assets/sprites/Scientist1_Run.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Scientist1_Special.png',
      frameCount: 14,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
      playOnce: true
    }
  ],

  // Mad Chemist special animations
  '/assets/sprites/Scientists2_Walk.png': [
    {
      spritePath: '/assets/sprites/Scientists2_Run.png',
      frameCount: 11,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Genius Inventor special animations
  '/assets/sprites/Scientists3_Walk.png': [
    {
      spritePath: '/assets/sprites/Scientists3_Run.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Business Man special animations
  '/assets/sprites/CityMen1_Walk.png': [
    {
      spritePath: '/assets/sprites/CityMen1_Idle.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/CityMen1_Run.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Executive special animations
  '/assets/sprites/CityMen3_Walk.png': [
    {
      spritePath: '/assets/sprites/CityMen3_Idle.png',
      frameCount: 6,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/CityMen3_Run.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Field Medic special animations
  '/assets/sprites/doctor1_Walk.png': [
    {
      spritePath: '/assets/sprites/doctor1_Run.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Surgeon special animations
  '/assets/sprites/Doctor2_Walk.png': [
    {
      spritePath: '/assets/sprites/Doctor2_Idle.png',
      frameCount: 5,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Doctor2_Run.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Medical Specialist special animations
  '/assets/sprites/Doctor3_Walk.png': [
    {
      spritePath: '/assets/sprites/Doctor3_Idle.png',
      frameCount: 7,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 8,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Doctor3_Run.png',
      frameCount: 10,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    }
  ],

  // Desert Raider special animations
  '/assets/sprites/Raider1_Walk.png': [
    {
      spritePath: '/assets/sprites/Raider1_Run.png',
      frameCount: 8,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Raider1_Jump.png',
      frameCount: 11,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 12,
      playOnce: true
    },
    {
      spritePath: '/assets/sprites/Raider1_Shot.png',
      frameCount: 12,
      frameWidth: 128,
      frameHeight: 128,
      animationSpeed: 10,
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
