from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
migrations = sorted((ROOT / 'src/database/migrations').glob('*.ts'))
files = [p.name for p in migrations]
texts = {p.name: p.read_text() for p in migrations}
all_text = '\n'.join(texts.values())
pkg = json.loads((ROOT / 'package.json').read_text())
compose = (ROOT / 'compose.yaml').read_text()
audit = (ROOT / 'scripts/check-migration-readiness.mjs').read_text()
checks = {
    '33 migration files are present': len(migrations) == 33,
    'migration filenames have unique 13-digit timestamps': all(re.match(r'^\d{13}-.+\.ts$', n) for n in files) and len({n[:13] for n in files}) == len(files),
    'migration classes match filename and timestamp': all(f"export class {p.stem[14:]}{p.stem[:13]} " in texts[p.name] for p in migrations),
    'all migrations implement up and down': all(re.search(r'async\s+up\s*\(', t) and re.search(r'async\s+down\s*\(', t) for t in texts.values()),
    'pgcrypto is enabled before UUID defaults': 'CREATE EXTENSION IF NOT EXISTS pgcrypto' in texts['1731200000000-CreateUsersAndAppointments.ts'] and min(int(n[:13]) for n,t in texts.items() if 'gen_random_uuid()' in t) >= 1731200000000,
    'runtime and CLI schema synchronization remain disabled': 'synchronize:false' in (ROOT / 'src/database/data-source.ts').read_text().replace(' ', '') and 'synchronize:false' in (ROOT / 'src/app.module.ts').read_text().replace(' ', ''),
    'migration run and show commands are declared': 'migration:run' in pkg['scripts'] and 'migration:show' in pkg['scripts'],
    'migration audit script checks ordering and extension dependency': 'timestamps are unique' in audit and 'pgcrypto extension is enabled' in audit,
    'Compose uses PostgreSQL 16 with a readiness healthcheck': 'postgres:16-alpine' in compose and 'pg_isready' in compose,
    'API waits for healthy database before startup': 'condition: service_healthy' in compose,
    'deployment documentation explains migration preflight': 'migration:show' in (ROOT / 'DEPLOYMENT.md').read_text(),
}
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ' - ' + name)
print(f'RESULT: {sum(checks.values())}/{len(checks)} checks passed')
raise SystemExit(0 if all(checks.values()) else 1)
