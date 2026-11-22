from pathlib import Path
root = Path(__file__).resolve().parent
module = (root / 'src/app.module.ts').read_text()
readme = (root / 'DEPLOYMENT.md').read_text()
checks = {
    'production database password rejects placeholders and enforces 16 chars': "databasePassword.length < 16" in module and "|replace)/i.test(databasePassword)" in module,
    'production owner email is required and format-validated': "OWNER_EMAIL" in module and "test(ownerEmail)" in module,
    'production owner email placeholders are rejected': "example\\.com|YOUR_|CHANGE_ME" in module,
    'production owner password minimum is enforced': "ownerPassword.length < 14" in module,
    'production owner password placeholders are rejected': "replace|change_me|password|admin" in module,
    'existing JWT production validation remains': "secret.length < 32" in module,
    'production HTTPS API validation remains': "publicApi.protocol !== 'https:'" in module,
    'database synchronization remains disabled': "synchronize:false" in module,
    'deployment guide documents owner bootstrap requirements': 'OWNER_EMAIL' in readme and 'OWNER_PASSWORD' in readme,
    'deployment guide warns to rotate bootstrap credentials': 'rotate' in readme.lower() or 'غيّر' in readme,
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items(): print(('PASS' if ok else 'FAIL') + ' - ' + name)
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)} checks passed')
raise SystemExit(bool(failed))
