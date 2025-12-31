/**
 * Create sprite sheet from animation frames
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';

const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets', 'sprites');

const jsonFile = process.argv[2];
const outputName = process.argv[3];

if (!jsonFile || !outputName) {
  console.log('Usage: npx tsx save-animation-sheet.ts <json-file> <output-name>');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
const frames = data.images;

console.log(`📦 Processing ${frames.length} frames...`);

// Save individual frames and determine size
const pngFrames: PNG[] = [];
for (let i = 0; i < frames.length; i++) {
  const frameData = Buffer.from(frames[i].base64, 'base64');
  const png = PNG.sync.read(frameData);
  pngFrames.push(png);

  // Save individual frame
  const framePath = path.join(ASSETS_DIR, `${outputName}_frame${i.toString().padStart(2, '0')}.png`);
  fs.writeFileSync(framePath, frameData);
}

console.log(`✅ Saved ${frames.length} individual frames`);

// Create horizontal sprite sheet
const frameWidth = pngFrames[0].width;
const frameHeight = pngFrames[0].height;
const sheetWidth = frameWidth * frames.length;

const sheet = new PNG({ width: sheetWidth, height: frameHeight });

for (let f = 0; f < pngFrames.length; f++) {
  const frame = pngFrames[f];
  for (let y = 0; y < frameHeight; y++) {
    for (let x = 0; x < frameWidth; x++) {
      const srcIdx = (y * frameWidth + x) * 4;
      const dstIdx = (y * sheetWidth + (f * frameWidth) + x) * 4;
      sheet.data[dstIdx] = frame.data[srcIdx];
      sheet.data[dstIdx + 1] = frame.data[srcIdx + 1];
      sheet.data[dstIdx + 2] = frame.data[srcIdx + 2];
      sheet.data[dstIdx + 3] = frame.data[srcIdx + 3];
    }
  }
}

const sheetPath = path.join(ASSETS_DIR, `${outputName}_Walk.png`);
fs.writeFileSync(sheetPath, PNG.sync.write(sheet));
console.log(`🎬 Created sprite sheet: ${outputName}_Walk.png (${sheetWidth}x${frameHeight}, ${frames.length} frames)`);

// Also create a reduced 8-frame version for performance
if (frames.length > 8) {
  const sheet8 = new PNG({ width: frameWidth * 8, height: frameHeight });
  const step = Math.floor(frames.length / 8);

  for (let f = 0; f < 8; f++) {
    const srcFrame = pngFrames[f * step];
    for (let y = 0; y < frameHeight; y++) {
      for (let x = 0; x < frameWidth; x++) {
        const srcIdx = (y * frameWidth + x) * 4;
        const dstIdx = (y * frameWidth * 8 + (f * frameWidth) + x) * 4;
        sheet8.data[dstIdx] = srcFrame.data[srcIdx];
        sheet8.data[dstIdx + 1] = srcFrame.data[srcIdx + 1];
        sheet8.data[dstIdx + 2] = srcFrame.data[srcIdx + 2];
        sheet8.data[dstIdx + 3] = srcFrame.data[srcIdx + 3];
      }
    }
  }

  const sheet8Path = path.join(ASSETS_DIR, `${outputName}_Walk8.png`);
  fs.writeFileSync(sheet8Path, PNG.sync.write(sheet8));
  console.log(`🎬 Created 8-frame sheet: ${outputName}_Walk8.png`);
}

console.log('\n📊 Sprite Config:');
console.log(`{
  spritePath: '/assets/sprites/${outputName}_Walk.png',
  frameCount: ${frames.length},
  frameWidth: ${frameWidth},
  frameHeight: ${frameHeight},
  animationSpeed: 12
}`);
