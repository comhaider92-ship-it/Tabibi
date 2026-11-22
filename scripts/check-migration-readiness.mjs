import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationDir = path.join(root, 'src/database/migrations');
const files = fs.readdirSync(migrationDir).filter((name) => name.endsWith('.ts')).sort();
const failures = [];
const pass = (label, ok) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${label}`);
  if (!ok) failures.push(label);
};

const entries = files.map((file) => {
  const match = file.match(/^(\d{13})-(.+)\.ts$/);
  const source = fs.readFileSync(path.join(migrationDir, file), 'utf8');
  return { file, timestamp: match ? Number(match[1]) : NaN, stem: match?.[2], source };
});

pass('migration directory contains migration files', entries.length > 0);
pass('all migration filenames use 13-digit timestamps', entries.every((entry) => Number.isFinite(entry.timestamp)));
pass('migration timestamps are unique', new Set(entries.map((entry) => entry.timestamp)).size === entries.length);
pass('migration timestamps are strictly increasing in execution order', entries.every((entry, index) => index === 0 || entries[index - 1].timestamp < entry.timestamp));
pass('each migration exports a class whose name matches its filename and timestamp', entries.every((entry) => {
  if (!entry.stem) return false;
  const className = `${entry.stem}${entry.timestamp}`;
  return entry.source.includes(`export class ${className} `);
}));
pass('every migration implements both up and down methods', entries.every((entry) => /async\s+up\s*\(/.test(entry.source) && /async\s+down\s*\(/.test(entry.source)));

const uuidMigrations = entries.filter((entry) => entry.source.includes('gen_random_uuid()'));
const extensionMigration = entries.find((entry) => /CREATE EXTENSION IF NOT EXISTS pgcrypto/i.test(entry.source));
pass('pgcrypto extension is enabled before the first gen_random_uuid default', Boolean(extensionMigration && uuidMigrations.length && extensionMigration.timestamp <= Math.min(...uuidMigrations.map((entry) => entry.timestamp))));

const dataSource = fs.readFileSync(path.join(root, 'src/database/data-source.ts'), 'utf8');
const appModule = fs.readFileSync(path.join(root, 'src/app.module.ts'), 'utf8');
pass('TypeORM data source explicitly loads migration files', /migrations\s*:\s*\[\s*['"]src\/database\/migrations\/\*\.ts['"]\s*\]/.test(dataSource));
pass('CLI and runtime keep synchronize disabled', /synchronize\s*:\s*false/.test(dataSource) && /synchronize\s*:\s*false/.test(appModule));

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
pass('migration run and show commands are available', typeof pkg.scripts?.['migration:run'] === 'string' && typeof pkg.scripts?.['migration:show'] === 'string');

console.log(`RESULT: ${entries.length} migrations inspected; ${failures.length ? `${failures.length} failure(s)` : 'all checks passed'}.`);
if (failures.length) process.exitCode = 1;
