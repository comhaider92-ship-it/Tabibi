import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
const apiValue = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();
const profile = process.argv[2] ?? 'preview';
const errors = [];

if (!['preview', 'production'].includes(profile)) errors.push('Build profile must be preview or production.');
if (!apiValue) errors.push('EXPO_PUBLIC_API_URL is missing. Set it to the reachable backend URL before building.');
let api;
if (apiValue) {
  try { api = new URL(apiValue); } catch { errors.push('EXPO_PUBLIC_API_URL is not a valid URL.'); }
  if (api) {
    if (!['http:', 'https:'].includes(api.protocol)) errors.push('API URL must use HTTP or HTTPS.');
    if (['localhost', '127.0.0.1', '0.0.0.0', '10.0.2.2'].includes(api.hostname)) errors.push('This host is not reachable from a physical phone. Use a public HTTPS API domain.');
    if (profile === 'production' && api.protocol !== 'https:') errors.push('Production builds require HTTPS.');
    if (!api.pathname.replace(/\/$/, '').endsWith('/api/v1')) errors.push('API URL must end with /api/v1.');
    if (/example\.com|YOUR_|CHANGE_ME/i.test(apiValue)) errors.push('API URL still contains a placeholder.');
  }
}
if (!app?.android?.package) errors.push('Android package identifier is missing from app.json.');
if (!eas?.build?.[profile]?.android?.buildType) errors.push(`Android buildType is missing for the ${profile} profile in eas.json.`);
if (errors.length) {
  console.error(`TABIBI ${profile} build configuration: NOT READY`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`TABIBI ${profile} build configuration: READY`);
console.log(`API host: ${api.host}`);
console.log(`Android package: ${app.android.package}`);
console.log(`Artifact type: ${eas.build[profile].android.buildType}`);
