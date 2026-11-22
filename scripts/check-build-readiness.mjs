import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  { name: 'Backend', dir: root, lock: 'package-lock.json', build: 'npm run build' },
  { name: 'Android mobile app', dir: path.join(root, 'mobile'), lock: 'package-lock.json', build: 'npm run typecheck' },
];
const blockers = [];
const warnings = [];

console.log('TABIBI connected-build readiness audit');
console.log(`Node: ${process.version}`);
console.log(`npm: ${process.env.npm_config_user_agent ?? 'run with npm to display version'}`);

for (const target of targets) {
  const packagePath = path.join(target.dir, 'package.json');
  const packageExists = fs.existsSync(packagePath);
  const lockExists = fs.existsSync(path.join(target.dir, target.lock));
  const modulesExist = fs.existsSync(path.join(target.dir, 'node_modules'));
  console.log(`\n${target.name}:`);
  console.log(`  package.json: ${packageExists ? 'present' : 'MISSING'}`);
  console.log(`  ${target.lock}: ${lockExists ? 'present' : 'MISSING'}`);
  console.log(`  node_modules: ${modulesExist ? 'present' : 'not installed'}`);
  if (!packageExists) blockers.push(`${target.name}: package.json is missing.`);
  if (!lockExists) blockers.push(`${target.name}: ${target.lock} is missing; generate and review it in a network-enabled environment.`);
  if (!modulesExist) blockers.push(`${target.name}: dependencies are not installed.`);
}

const apiUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();
if (!apiUrl) {
  warnings.push('EXPO_PUBLIC_API_URL is not set; a physical-device build cannot connect to the backend yet.');
} else {
  try {
    const url = new URL(apiUrl);
    if (url.protocol !== 'https:') warnings.push('EXPO_PUBLIC_API_URL is not HTTPS; production mobile builds require HTTPS.');
    if (!url.pathname.replace(/\/$/, '').endsWith('/api/v1')) warnings.push('EXPO_PUBLIC_API_URL must end with /api/v1.');
    if (['localhost', '127.0.0.1', '0.0.0.0', '10.0.2.2'].includes(url.hostname)) warnings.push('EXPO_PUBLIC_API_URL uses a local/emulator host that is not reachable from a physical phone.');
  } catch {
    blockers.push('EXPO_PUBLIC_API_URL is not a valid URL.');
  }
}

for (const warning of warnings) console.log(`\nWARNING: ${warning}`);
if (blockers.length) {
  console.log('\nRESULT: BLOCKED — do not claim a dependency-backed build has passed.');
  for (const blocker of blockers) console.log(`- ${blocker}`);
  console.log('\nIn a network-enabled environment, run:');
  console.log('  ./scripts/prepare-connected-build.sh');
  process.exit(1);
}

console.log('\nRESULT: dependency files are present. Run the backend build and mobile typecheck before device testing.');
