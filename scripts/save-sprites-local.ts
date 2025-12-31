/**
 * Save sprites from locally cached JSON files
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';

const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets', 'sprites');

interface ImageData {
  base64: string;
  width: number;
  height: number;
}

const PETS = [
  { id: 'chubby_hamster', file: '/tmp/hamster.json', name: 'Chubby Hamster' },
  { id: 'moonlight_cat', file: '/tmp/cat.json', name: 'Moonlight Cat' },
  { id: 'ember_dragon', file: '/tmp/dragon.json', name: 'Ember Dragon' },
];

function saveImage(data: ImageData, filename: string): void {
  const buffer = Buffer.from(data.base64, 'base64');
  const png = new PNG({ width: data.width, height: data.height });

  for (let i = 0; i < buffer.length; i++) {
    png.data[i] = buffer[i];
  }

  const outputPath = path.join(ASSETS_DIR, filename);
  fs.writeFileSync(outputPath, PNG.sync.write(png));
  console.log(`   ✅ Saved: ${filename}`);
}

function createWalkSheet(eastData: ImageData, petId: string): void {
  const { width, height } = eastData;
  const buffer = Buffer.from(eastData.base64, 'base64');

  // Create 4-frame sprite sheet
  const sheetWidth = width * 4;
  const sheet = new PNG({ width: sheetWidth, height });

  for (let frame = 0; frame < 4; frame++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = (y * sheetWidth + (frame * width) + x) * 4;
        sheet.data[dstIdx] = buffer[srcIdx];
        sheet.data[dstIdx + 1] = buffer[srcIdx + 1];
        sheet.data[dstIdx + 2] = buffer[srcIdx + 2];
        sheet.data[dstIdx + 3] = buffer[srcIdx + 3];
      }
    }
  }

  const outputPath = path.join(ASSETS_DIR, `${petId}_Walk.png`);
  fs.writeFileSync(outputPath, PNG.sync.write(sheet));
  console.log(`   🎬 Created: ${petId}_Walk.png (${sheetWidth}x${height})`);
}

function main() {
  console.log('🚀 Saving PixelLab Sprites\n');

  for (const pet of PETS) {
    console.log(`\n🐾 ${pet.name}`);

    const data = JSON.parse(fs.readFileSync(pet.file, 'utf-8'));
    const images = data.last_response?.images;

    if (!images) {
      console.log('   ⚠️ No images found');
      continue;
    }

    // Save each direction
    for (const dir of ['east', 'west', 'north', 'south']) {
      if (images[dir]) {
        saveImage(images[dir], `${pet.id}_${dir}.png`);
      }
    }

    // Create walk sprite sheet
    if (images.east) {
      createWalkSheet(images.east, pet.id);
    }
  }

  console.log('\n\n✅ All done!');
  console.log(`📂 Files saved to: ${ASSETS_DIR}`);
}

main();
