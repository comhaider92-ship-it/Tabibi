from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
migrations = sorted((ROOT / 'src/database/migrations').glob('*.ts'))
text = '\n'.join(p.read_text() for p in migrations)
checks = {
    'all UUID defaults use PostgreSQL 16 built-in gen_random_uuid': 'uuid_generate_v4()' not in text and 'gen_random_uuid()' in text,
    'base migration enables pgcrypto for gen_random_uuid compatibility': 'CREATE EXTENSION IF NOT EXISTS pgcrypto' in (ROOT / 'src/database/migrations/1731200000000-CreateUsersAndAppointments.ts').read_text(),
    'medical record migration uses gen_random_uuid': 'gen_random_uuid()' in (ROOT / 'src/database/migrations/1734200000000-CreatePatientMedicalRecords.ts').read_text(),
    'secure uploads migration uses gen_random_uuid': 'gen_random_uuid()' in (ROOT / 'src/database/migrations/1733400000000-CreateSecureUploadAssets.ts').read_text(),
    'medical attachment and consent migrations use gen_random_uuid': 'gen_random_uuid()' in (ROOT / 'src/database/migrations/1734300000000-ExtendMedicalRecordsSharingAndAttachments.ts').read_text(),
    'prescription and lab result migrations use gen_random_uuid': 'gen_random_uuid()' in (ROOT / 'src/database/migrations/1734400000000-CreateStructuredPrescriptionsAndLabResults.ts').read_text(),
    'clinical report migration uses gen_random_uuid': 'gen_random_uuid()' in (ROOT / 'src/database/migrations/1734600000000-CreateMedicalClinicalReports.ts').read_text(),
    'ORM schema synchronization remains disabled': 'synchronize:false' in (ROOT / 'src/app.module.ts').read_text().replace(' ', '') and 'synchronize:false' in (ROOT / 'src/database/data-source.ts').read_text().replace(' ', ''),
    'migration command is explicit and documented': 'migration:run' in (ROOT / 'package.json').read_text() and 'migration:run' in (ROOT / 'DEPLOYMENT.md').read_text(),
    'deployment instructions require backup before migration': 'verified backup' in (ROOT / 'DEPLOYMENT.md').read_text(),
}
for name, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ' - ' + name)
print(f'RESULT: {sum(checks.values())}/{len(checks)} checks passed')
raise SystemExit(0 if all(checks.values()) else 1)
