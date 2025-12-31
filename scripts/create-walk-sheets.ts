/**
 * Create 4-frame walk sheets from single sprites
 */

import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';

const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets', 'sprites');

const SPRITES = [
  { input: 'cat_v3.png', output: 'cat_v3_Walk.png' },
  { input: 'hamster_v3.png', output: 'hamster_v3_Walk.png' },
  { input: 'dragon_v3.png', output: 'dragon_v3_Walk.png' },
];

for (const sprite of SPRITES) {
  const inputPath = path.join(ASSETS_DIR, sprite.input);
  const outputPath = path.join(ASSETS_DIR, sprite.output);

  // Read the source PNG
  const data = fs.readFileSync(inputPath);
  const png = PNG.sync.read(data);

  // Create 4-frame sheet
  const sheetWidth = png.width * 4;
  const sheet = new PNG({ width: sheetWidth, height: png.height });

  for (let frame = 0; frame < 4; frame++) {
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const srcIdx = (y * png.width + x) * 4;
        const dstIdx = (y * sheetWidth + (frame * png.width) + x) * 4;
        sheet.data[dstIdx] = png.data[srcIdx];
        sheet.data[dstIdx + 1] = png.data[srcIdx + 1];
        sheet.data[dstIdx + 2] = png.data[srcIdx + 2];
        sheet.data[dstIdx + 3] = png.data[srcIdx + 3];
      }
    }
  }

  fs.writeFileSync(outputPath, PNG.sync.write(sheet));
  console.log(`✅ Created ${sprite.output} (${sheetWidth}x${png.height})`);
}
