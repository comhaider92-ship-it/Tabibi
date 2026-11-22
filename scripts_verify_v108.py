from pathlib import Path

root = Path(__file__).resolve().parent
auth = (root / 'src/auth/auth.service.ts').read_text()
health = (root / 'src/health/health.controller.ts').read_text()
checks = {
    'owner email is trimmed and lowercased before lookup': "?.trim().toLowerCase()" in auth and 'findOwnerByEmail(email)' in auth,
    'existing non-owner account causes explicit startup failure': 'existing.role!==UserRole.OWNER' in auth and 'already assigned to a non-owner account' in auth,
    'existing patient or doctor is never silently promoted': 'existing.role!==UserRole.OWNER' in auth and 'role:UserRole.OWNER' in auth,
    'existing owner account is not overwritten by bootstrap password': 'if(!existing){' in auth and 'passwordHash:await bcrypt.hash(password,12)' in auth,
    'readiness checks database connectivity': "this.dataSource.query('SELECT 1')" in health,
    'readiness checks pending TypeORM migrations': 'this.dataSource.showMigrations()' in health,
    'pending migrations prevent ready response': 'if (migrationsPending)' in health and "status: 'not_ready'" in health,
    'ready response reports current migration state': "migrations: 'current'" in health,
}
for label, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} - {label}")
print(f"RESULT: {sum(checks.values())}/{len(checks)} checks passed")
raise SystemExit(0 if all(checks.values()) else 1)
