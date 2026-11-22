from pathlib import Path

root = Path(__file__).resolve().parent
checks = []
def check(label, ok):
    checks.append((label, bool(ok)))
    print(('PASS' if ok else 'FAIL') + ' | ' + label)

data_source = (root / 'src/database/data-source.ts').read_text()
app_module = (root / 'src/app.module.ts').read_text()
auth = (root / 'src/auth/auth.service.ts').read_text()
health = (root / 'src/health/health.controller.ts').read_text()
doc = (root / 'docs/phase-v94-production-readiness-baseline.md').read_text()

check('clinical report entity imported into migration data source', "import { MedicalClinicalReport }" in data_source)
check('clinical report entity registered in migration data source', 'MedicalLabResult,MedicalClinicalReport]' in data_source)
check('health controller registered in Nest application', 'controllers: [HealthController]' in app_module)
check('liveness endpoint exists', "@Get('live')" in health)
check('database readiness endpoint exists', "@Get('ready')" in health and 'SELECT 1' in health)
check('readiness failure is returned as service unavailable', 'ServiceUnavailableException' in health)
check('authentication no longer contains fallback JWT secret', 'tabibi-security-fallback' not in auth)
check('both authentication HMAC uses require configured JWT secret', auth.count("getOrThrow<string>('JWT_SECRET')") == 2)
check('V94 deployment limitations are documented', 'Build and install an Android preview APK' in doc)

failed = [label for label, ok in checks if not ok]
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)}')
raise SystemExit(1 if failed else 0)
