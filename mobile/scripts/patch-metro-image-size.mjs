import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const metroAssetsPath = fileURLToPath(new URL('../node_modules/metro/src/Assets.js', import.meta.url));
const source = readFileSync(metroAssetsPath, 'utf8');
const legacy = 'const getImageSize = require("image-size");';
const previous = [
  'const imageSizeModule = require("image-size");',
  'const imageSize = typeof imageSizeModule === "function" ? imageSizeModule : imageSizeModule.imageSize;',
  'const getImageSize = (input) => imageSize(Buffer.isBuffer(input) ? input : Buffer.from(input));',
].join('\n');
const compatible = [
  'const imageSizeModule = require("image-size");',
  'const imageSize = typeof imageSizeModule === "function" ? imageSizeModule : imageSizeModule.imageSize;',
  'const getImageSize = (input) => {',
  '  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);',
  '  try { return imageSize(bytes); }',
  '  catch (error) {',
  '    console.error("Metro image-size input diagnostic", { inputType: typeof input, inputConstructor: input?.constructor?.name, inputLength: input?.length, byteLength: bytes.length, firstBytes: bytes.subarray(0, 16).toString("hex") });',
  '    throw error;',
  '  }',
  '};',
].join('\n');

if (source.includes(compatible)) {
  console.log('Metro image-size compatibility patch already applied.');
} else if (source.includes(previous)) {
  writeFileSync(metroAssetsPath, source.replace(previous, compatible));
  console.log('Updated Metro adapter with diagnostics for image-size v2.');
} else if (source.includes(legacy)) {
  writeFileSync(metroAssetsPath, source.replace(legacy, compatible));
  console.log('Applied Metro adapter with image-size v2 byte diagnostics.');
} else {
  throw new Error('Unsupported Metro Assets.js layout; refusing to patch an unknown version.');
}
