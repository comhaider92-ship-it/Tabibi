from pathlib import Path
import json

root = Path(__file__).resolve().parent
checks = []

def check(name, condition):
    checks.append((name, bool(condition)))

package = json.loads((root / 'package.json').read_text())
checker = (root / 'scripts/check-build-readiness.mjs').read_text()
runner = (root / 'scripts/prepare-connected-build.sh').read_text()
doc = (root / 'docs/phase-v103-connected-build-preparation.md').read_text()
readme = (root / 'README.md').read_text()

check('readiness audit is exposed as npm script', package['scripts'].get('check:build-readiness') == 'node scripts/check-build-readiness.mjs')
check('audit checks backend and mobile independently', "name: 'Backend'" in checker and "name: 'Android mobile app'" in checker)
check('audit detects absent lockfiles', 'package-lock.json' in checker and 'MISSING' in checker)
check('audit detects missing installed dependencies', 'node_modules' in checker and 'not installed' in checker)
check('audit validates physical-device API host constraints', 'EXPO_PUBLIC_API_URL' in checker and 'localhost' in checker and '/api/v1' in checker)
check('connected script generates lockfiles only when absent', 'npm install --package-lock-only' in runner and '-f "${dir}/package-lock.json"' in runner)
check('connected script uses deterministic npm ci installs', runner.count('npm ci --no-audit --no-fund') == 1)
check('backend build is run', 'npm run build' in runner)
check('mobile typecheck and Expo config validation are run', 'npm run typecheck' in runner and 'npx expo config --type public' in runner)
check('EAS/APK and deployment are not falsely claimed', 'or create an APK' in runner and 'does not deploy PostgreSQL' in doc)
check('environment limitation is documented', 'EAI_AGAIN' in doc and 'could not be run here' in doc)
check('README documents V103 workflow', '## V103 — Connected build preparation' in readme)

for name, ok in checks:
    print(f"{'PASS' if ok else 'FAIL'}: {name}")
print(f"\nV103 verification: {sum(ok for _, ok in checks)}/{len(checks)} passed")
if not all(ok for _, ok in checks):
    raise SystemExit(1)
