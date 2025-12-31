/**
 * Save animal sprites from generate-image-v2 (no humanoid skeleton)
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';

const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets', 'sprites');

function saveFromJson(jsonFile: string, outputName: string): void {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));

  if (!data.images || data.images.length === 0) {
    console.log(`⚠️ No images in ${jsonFile}`);
    return;
  }

  const img = data.images[0];
  const buffer = Buffer.from(img.base64, 'base64');
  const png = new PNG({ width: img.width, height: img.height });

  for (let i = 0; i < buffer.length; i++) {
    png.data[i] = buffer[i];
  }

  const outputPath = path.join(ASSETS_DIR, `${outputName}.png`);
  fs.writeFileSync(outputPath, PNG.sync.write(png));
  console.log(`✅ Saved: ${outputName}.png (${img.width}x${img.height})`);

  // Create 4-frame walk sheet by duplicating
  const sheetWidth = img.width * 4;
  const sheet = new PNG({ width: sheetWidth, height: img.height });

  for (let frame = 0; frame < 4; frame++) {
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const srcIdx = (y * img.width + x) * 4;
        const dstIdx = (y * sheetWidth + (frame * img.width) + x) * 4;
        sheet.data[dstIdx] = buffer[srcIdx];
        sheet.data[dstIdx + 1] = buffer[srcIdx + 1];
        sheet.data[dstIdx + 2] = buffer[srcIdx + 2];
        sheet.data[dstIdx + 3] = buffer[srcIdx + 3];
      }
    }
  }

  const sheetPath = path.join(ASSETS_DIR, `${outputName}_Walk.png`);
  fs.writeFileSync(sheetPath, PNG.sync.write(sheet));
  console.log(`🎬 Created: ${outputName}_Walk.png`);
}

// Process command line args
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: npx tsx save-animal-sprites.ts <json-file> <output-name>');
  process.exit(1);
}

saveFromJson(args[0], args[1]);
