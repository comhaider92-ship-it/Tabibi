import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const metroAssetsPath = fileURLToPath(new URL('../node_modules/metro/src/Assets.js', import.meta.url));
const source = readFileSync(metroAssetsPath, 'utf8');
const legacy = 'const getImageSize = require("image-size");';
const metroPathInputLegacy = 'const dimensions = isImage ? (0, _imageSize.default)(isImageInput) : null;';
const metroPathInputCompatible = 'const dimensions = isImage ? (0, _imageSize.default)(typeof isImageInput === "string" ? _fs.default.readFileSync(isImageInput) : isImageInput) : null;';
const previous = [
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
const compatible = [
  'const imageSizeModule = require("image-size");',
  'const imageSize = typeof imageSizeModule === "function" ? imageSizeModule : imageSizeModule.imageSize;',
  'const getImageSize = (input) => {',
  '  const bytes = typeof input === "string" ? require("node:fs").readFileSync(input) : (Buffer.isBuffer(input) ? input : Buffer.from(input));',
  '  return imageSize(bytes);',
  '};',
].join('\n');

if (source.includes(metroPathInputCompatible)) {
  console.log('Metro asset-path image-size adapter already applied.');
} else if (source.includes(metroPathInputLegacy)) {
  writeFileSync(metroAssetsPath, source.replace(metroPathInputLegacy, metroPathInputCompatible));
  console.log('Patched Metro to read filesystem asset paths before image-size v2.');
} else if (source.includes(compatible)) {
  console.log('Metro image-size compatibility patch already applied.');
} else if (source.includes(previous)) {
  writeFileSync(metroAssetsPath, source.replace(previous, compatible));
  console.log('Updated Metro adapter to read asset paths as bytes for image-size v2.');
} else if (source.includes(legacy)) {
  writeFileSync(metroAssetsPath, source.replace(legacy, compatible));
  console.log('Applied Metro adapter with path-aware image-size v2 support.');
} else if (!source.includes('image-size')) {
  console.log('Metro no longer depends on image-size; no compatibility patch is required.');
} else if (source.includes('imageSize')) {
  console.log('Metro already uses the imageSize API; no compatibility patch is required.');
  console.log(source.split('\\n').filter((line) => line.includes('image-size') || line.includes('imageSize')));
} else {
  throw new Error('Unsupported Metro image-size integration; refusing to patch an unknown version.');
}
