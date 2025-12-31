/**
 * PixelLab API Test Script
 * Generates 3 test pets to verify the API works correctly
 */

const API_BASE = 'https://api.pixellab.ai/v2';
const API_KEY = 'db20c97f-46d5-4cdc-88a2-b31af0b41263';

interface GenerationResult {
  success: boolean;
  data?: {
    images?: { url: string }[];
    image?: { url: string };
    character_id?: string;
  };
  error?: string;
}

// Master art style for consistent look
const STYLE_CONFIG = {
  outline: 'black',
  shading: 'soft',
  detail: 'medium',
  view: 'side',
  text_guidance_scale: 8.0,
};

// 3 Test Pets to generate
const TEST_PETS = [
  {
    id: 'chubby_hamster',
    name: 'Chubby Hamster',
    description: 'adorable round hamster with rosy cheeks, tiny paws, fluffy orange and white fur, cute beady eyes, chibi style pixel art',
    size: { width: 32, height: 32 },
    category: 'tiny',
  },
  {
    id: 'moonlight_cat',
    name: 'Moonlight Cat',
    description: 'elegant black cat with bright yellow eyes, sleek fur, long tail, mystical purple collar with glowing gem, chibi proportions pixel art',
    size: { width: 48, height: 48 },
    category: 'small',
  },
  {
    id: 'ember_dragon',
    name: 'Ember Dragon',
    description: 'cute baby dragon with red and orange scales, small wings, big expressive eyes, tiny horns, friendly smile, breathing small flame, chibi fantasy pixel art',
    size: { width: 64, height: 64 },
    category: 'medium',
  },
];

async function generateCharacter(pet: typeof TEST_PETS[0]): Promise<GenerationResult> {
  console.log(`\n🎨 Generating: ${pet.name}...`);
  console.log(`   Description: ${pet.description}`);
  console.log(`   Size: ${pet.size.width}x${pet.size.height}`);

  const response = await fetch(`${API_BASE}/create-character-with-4-directions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: pet.description,
      image_size: pet.size,
      ...STYLE_CONFIG,
    }),
  });

  const result = await response.json();

  if (result.success) {
    console.log(`   ✅ Success! Character ID: ${result.data?.character_id || 'N/A'}`);
  } else {
    console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
  }

  return result;
}

async function generateAnimation(characterId: string, petName: string): Promise<GenerationResult> {
  console.log(`\n🎬 Generating walk animation for ${petName}...`);

  const response = await fetch(`${API_BASE}/animate-character`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      character_id: characterId,
      template_animation_id: 'walk-cycle',
      directions: ['east', 'west'],
    }),
  });

  const result = await response.json();

  if (result.success) {
    console.log(`   ✅ Animation generated!`);
  } else {
    console.log(`   ❌ Animation failed: ${result.error || 'Unknown error'}`);
  }

  return result;
}

async function downloadImage(url: string, filename: string): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const fs = await import('fs');
  const path = await import('path');

  const outputPath = path.join(process.cwd(), 'public', 'assets', 'sprites', filename);
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`   📁 Saved to: ${outputPath}`);
}

async function main() {
  console.log('🚀 PixelLab Pet Generation Test');
  console.log('================================\n');
  console.log('Testing API connection and generating 3 test pets...\n');

  // First, check account balance
  console.log('💰 Checking account balance...');
  const balanceRes = await fetch(`${API_BASE}/balance`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  });
  const balance = await balanceRes.json();
  console.log(`   Credits: ${balance.data?.remaining_credits || 'Unknown'}`);
  console.log(`   Generations: ${balance.data?.remaining_generations || 'Unknown'}`);

  const results: { pet: typeof TEST_PETS[0]; result: GenerationResult }[] = [];

  // Generate each pet
  for (const pet of TEST_PETS) {
    const result = await generateCharacter(pet);
    results.push({ pet, result });

    // If successful and has images, download them
    if (result.success && result.data?.images) {
      for (let i = 0; i < result.data.images.length; i++) {
        const direction = ['south', 'west', 'east', 'north'][i] || `dir${i}`;
        await downloadImage(
          result.data.images[i].url,
          `${pet.id}_${direction}.png`
        );
      }
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n\n📊 SUMMARY');
  console.log('==========');
  for (const { pet, result } of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${pet.name}: ${result.success ? 'Generated' : result.error}`);
  }
}

main().catch(console.error);
