/**
 * Save PixelLab generated sprites to assets folder
 */

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'https://api.pixellab.ai/v2';
const API_KEY = 'db20c97f-46d5-4cdc-88a2-b31af0b41263';
const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets', 'sprites');

interface CharacterImages {
  east: { base64: string; width: number; height: number };
  west: { base64: string; width: number; height: number };
  north: { base64: string; width: number; height: number };
  south: { base64: string; width: number; height: number };
}

// Pet configurations
const PETS = [
  {
    id: 'chubby_hamster',
    characterId: '6401b4fa-9bb9-482b-8c20-bf6604d5f210',
    name: 'Chubby Hamster',
    jobId: 'b8741aae-c523-4ec8-bc3b-9b653e56f5be'
  },
  {
    id: 'moonlight_cat',
    characterId: '9c4e80d8-3028-43f0-9923-052b1b976d37',
    name: 'Moonlight Cat',
    jobId: '45f5e872-ef1e-47ba-9dea-9230e9d498c2'
  },
  {
    id: 'ember_dragon',
    characterId: 'de47b5d8-7f53-4588-a026-31eb1b616bde',
    name: 'Ember Dragon',
    jobId: 'd6100eab-b12e-4904-bbaf-29524d9abe1b'
  },
];

async function waitForJob(jobId: string, petName: string): Promise<any> {
  console.log(`⏳ Waiting for ${petName} to complete...`);

  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${API_BASE}/background-jobs/${jobId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });
    const data = await res.json();

    if (data.status === 'completed') {
      console.log(`✅ ${petName} completed!`);
      return data;
    }

    if (data.status === 'failed') {
      console.log(`❌ ${petName} failed!`);
      return null;
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`⚠️ ${petName} timed out`);
  return null;
}

function saveBase64Image(base64: string, width: number, height: number, filename: string): void {
  // Decode base64 to raw RGBA bytes
  const buffer = Buffer.from(base64, 'base64');

  // Create PNG file from RGBA data
  const PNG = require('pngjs').PNG;
  const png = new PNG({ width, height });

  // Copy RGBA data
  for (let i = 0; i < buffer.length; i++) {
    png.data[i] = buffer[i];
  }

  const outputPath = path.join(ASSETS_DIR, filename);
  const pngBuffer = PNG.sync.write(png);
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`   📁 Saved: ${filename}`);
}

function createSpriteSheet(images: CharacterImages, petId: string, width: number, height: number): void {
  // For walk animation, we'll use East and West directions
  // Create a simple 4-frame sprite sheet (East direction duplicated as walk frames)
  const PNG = require('pngjs').PNG;

  // Create sprite sheet with 4 frames horizontally (for walk animation)
  const sheetWidth = width * 4;
  const sheetHeight = height;
  const sheet = new PNG({ width: sheetWidth, height: sheetHeight });

  // Use east direction for all 4 frames (we'll generate actual walk animation later)
  const eastBuffer = Buffer.from(images.east.base64, 'base64');

  for (let frame = 0; frame < 4; frame++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = (y * sheetWidth + (frame * width) + x) * 4;
        sheet.data[dstIdx] = eastBuffer[srcIdx];
        sheet.data[dstIdx + 1] = eastBuffer[srcIdx + 1];
        sheet.data[dstIdx + 2] = eastBuffer[srcIdx + 2];
        sheet.data[dstIdx + 3] = eastBuffer[srcIdx + 3];
      }
    }
  }

  const outputPath = path.join(ASSETS_DIR, `${petId}_Walk.png`);
  const pngBuffer = PNG.sync.write(sheet);
  fs.writeFileSync(outputPath, pngBuffer);
  console.log(`   🎬 Created sprite sheet: ${petId}_Walk.png (${sheetWidth}x${sheetHeight})`);
}

async function main() {
  console.log('🚀 Saving PixelLab Generated Sprites');
  console.log('=====================================\n');

  // Ensure output directory exists
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  for (const pet of PETS) {
    console.log(`\n🐾 Processing ${pet.name}...`);

    // Wait for job to complete
    const jobData = await waitForJob(pet.jobId, pet.name);

    if (!jobData || !jobData.last_response?.images) {
      console.log(`   ⚠️ Skipping ${pet.name} - no image data`);
      continue;
    }

    const images = jobData.last_response.images as CharacterImages;
    const width = images.east.width;
    const height = images.east.height;

    // Save individual direction images
    for (const [direction, data] of Object.entries(images)) {
      saveBase64Image(
        (data as any).base64,
        (data as any).width,
        (data as any).height,
        `${pet.id}_${direction}.png`
      );
    }

    // Create walk sprite sheet
    createSpriteSheet(images, pet.id, width, height);
  }

  console.log('\n\n✅ All sprites saved!');
  console.log(`📂 Location: ${ASSETS_DIR}`);
}

main().catch(console.error);
