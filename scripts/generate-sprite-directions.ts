/**
 * Script to generate missing directional sprite animations using Pixellab API
 *
 * Usage: PIXELLAB_API_KEY=your_key npx ts-node scripts/generate-sprite-directions.ts
 *
 * This script takes sprites that only have front-facing (south) animations
 * and generates east-facing walking animations using the Pixellab API.
 */

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'https://api.pixellab.ai/v2';
const API_KEY = process.env.PIXELLAB_API_KEY;

if (!API_KEY) {
  console.error('Error: PIXELLAB_API_KEY environment variable is required');
  console.error('Get your API key at: https://pixellab.ai/account');
  process.exit(1);
}

// Sprites that need east-facing animations generated
const SPRITES_TO_FIX = [
  {
    name: 'panda',
    inputPath: 'public/assets/sprites/meadow/panda-walk.png',
    outputPath: 'public/assets/sprites/meadow/panda-walk-new.png',
    description: 'cute chibi panda character, black and white, round body, pixel art style'
  },
  {
    name: 'honey-bear',
    inputPath: 'public/assets/sprites/meadow/honey-bear-walk.png',
    outputPath: 'public/assets/sprites/meadow/honey-bear-walk-new.png',
    description: 'adorable chibi bear creature, fluffy brown round body with tan belly, holding honey pot, pixel art style'
  },
  {
    name: 'flame-spirit',
    inputPath: 'public/assets/sprites/elemental/flame-spirit-walk.png',
    outputPath: 'public/assets/sprites/elemental/flame-spirit-walk-new.png',
    description: 'cute fire spirit elemental, yellow and red flames, chibi style, pixel art'
  },
  {
    name: 'cat-hood',
    inputPath: 'public/assets/sprites/humanoid/cat-hood-walk.png',
    outputPath: 'public/assets/sprites/humanoid/cat-hood-walk-new.png',
    description: 'cute kid in purple cat hoodie costume, chibi style, pixel art'
  }
];

async function imageToBase64(imagePath: string): Promise<string> {
  const absolutePath = path.resolve(imagePath);
  const imageBuffer = fs.readFileSync(absolutePath);
  return imageBuffer.toString('base64');
}

async function rotateToEast(spriteConfig: typeof SPRITES_TO_FIX[0]): Promise<string | null> {
  console.log(`\nRotating ${spriteConfig.name} from south to east...`);

  try {
    const imageBase64 = await imageToBase64(spriteConfig.inputPath);

    const response = await fetch(`${API_BASE}/rotate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_size: { width: 64, height: 64 },
        from_direction: 'south',
        to_direction: 'east',
        image_guidance_scale: 5.0,
        from_image: {
          type: 'base64',
          base64: imageBase64,
          format: 'png'
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Error rotating ${spriteConfig.name}:`, error);
      return null;
    }

    const result = await response.json();
    console.log(`Successfully rotated ${spriteConfig.name}`);
    return result.data?.image?.base64 || null;
  } catch (error) {
    console.error(`Failed to rotate ${spriteConfig.name}:`, error);
    return null;
  }
}

async function generateWalkingAnimation(
  spriteConfig: typeof SPRITES_TO_FIX[0],
  eastFacingBase64: string
): Promise<string | null> {
  console.log(`Generating walking animation for ${spriteConfig.name}...`);

  try {
    const response = await fetch(`${API_BASE}/animate-with-text-v2`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reference_image: {
          type: 'base64',
          base64: eastFacingBase64,
          format: 'png'
        },
        reference_image_size: { width: 64, height: 64 },
        image_size: { width: 64, height: 64 },
        action: 'walking',
        no_background: true,
        seed: 0
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Error generating animation for ${spriteConfig.name}:`, error);
      return null;
    }

    const result = await response.json();
    console.log(`Successfully generated walking animation for ${spriteConfig.name}`);

    // The API returns multiple frames, we need to combine them into a sprite sheet
    return result.data?.frames?.[0]?.base64 || result.data?.image?.base64 || null;
  } catch (error) {
    console.error(`Failed to generate animation for ${spriteConfig.name}:`, error);
    return null;
  }
}

async function createFullSpriteSheet(
  spriteConfig: typeof SPRITES_TO_FIX[0]
): Promise<void> {
  console.log(`\n=== Processing ${spriteConfig.name} ===`);

  // Step 1: Rotate the front-facing sprite to east-facing
  const eastFacing = await rotateToEast(spriteConfig);
  if (!eastFacing) {
    console.error(`Failed to create east-facing version of ${spriteConfig.name}`);
    return;
  }

  // Step 2: Generate walking animation from the east-facing sprite
  const walkingAnimation = await generateWalkingAnimation(spriteConfig, eastFacing);
  if (!walkingAnimation) {
    console.error(`Failed to generate walking animation for ${spriteConfig.name}`);
    return;
  }

  // Step 3: Save the result
  const outputBuffer = Buffer.from(walkingAnimation, 'base64');
  fs.writeFileSync(spriteConfig.outputPath, outputBuffer);
  console.log(`Saved ${spriteConfig.name} to ${spriteConfig.outputPath}`);
}

async function checkBalance(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/balance`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    if (!response.ok) {
      console.error('Failed to check balance. Is your API key valid?');
      return false;
    }

    const result = await response.json();
    console.log('Account balance:', result.data);
    return true;
  } catch (error) {
    console.error('Error checking balance:', error);
    return false;
  }
}

async function main() {
  console.log('Pixellab Sprite Direction Generator');
  console.log('===================================\n');

  // Check API key is valid
  const isValid = await checkBalance();
  if (!isValid) {
    process.exit(1);
  }

  // Process each sprite
  for (const sprite of SPRITES_TO_FIX) {
    await createFullSpriteSheet(sprite);
  }

  console.log('\n=== Done! ===');
  console.log('New sprite sheets have been saved with -new suffix.');
  console.log('Review them and rename to replace the originals if they look good.');
}

main().catch(console.error);
