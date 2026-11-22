import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const metroAssetsPath = fileURLToPath(new URL('../node_modules/metro/src/Assets.js', import.meta.url));
const source = readFileSync(metroAssetsPath, 'utf8');
const legacy = 'const getImageSize = require("image-size");';
const compatible = [
  'const imageSizeModule = require("image-size");',
  'const getImageSize = typeof imageSizeModule === "function" ? imageSizeModule : imageSizeModule.imageSize;',
].join('\n');

if (source.includes(compatible)) {
  console.log('Metro image-size compatibility patch already applied.');
} else if (source.includes(legacy)) {
  writeFileSync(metroAssetsPath, source.replace(legacy, compatible));
  console.log('Applied Metro compatibility adapter for image-size v2.');
} else {
  throw new Error('Unsupported Metro Assets.js layout; refusing to patch an unknown version.');
}
