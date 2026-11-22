from pathlib import Path
import sys
root = Path(__file__).parent
checks = []
def check(name, condition): checks.append((name, bool(condition)))

controller = (root/'src/medical-records/medical-records.controller.ts').read_text()
service = (root/'src/medical-records/medical-records.service.ts').read_text()
dto = (root/'src/medical-records/dto/health-file-query.dto.ts').read_text()
record = (root/'src/medical-records/medical-record.entity.ts').read_text()
doc = root/'docs/phase-v86-comprehensive-health-file.md'

check('health file endpoint is authenticated by controller guards', "@UseGuards(JwtAuthGuard, RolesGuard)" in controller and "@Get('health-file')" in controller)
check('health file query supports validated record type and dates', all(x in dto for x in ['@IsEnum(MedicalRecordType)', '@IsDateString()', 'from?: string', 'to?: string']))
check('pagination has safe defaults and bounds', all(x in dto for x in ['page = 1', 'limit = 20', '@Min(1)', '@Max(50)']))
check('only the patient can read the complete health file', "actor.role !== UserRole.PATIENT" in service and 'الملف الصحي الشامل متاح لصاحب الحساب فقط' in service)
check('deleted records are excluded', "record.deletedAt IS NULL" in service)
check('date range order is validated', 'new Date(query.from) > new Date(query.to)' in service)
check('timeline is sorted newest first and paginated', "orderBy('record.createdAt', 'DESC')" in service and '.skip((page - 1) * limit).take(limit).getManyAndCount()' in service)
check('structured prescriptions are joined by record IDs', 'getRepository(MedicalPrescription).find({ where: { recordId: In(ids) } })' in service)
check('structured lab results are joined by record IDs', 'getRepository(MedicalLabResult).find({ where: { recordId: In(ids) } })' in service)
check('clinical reports are joined by record IDs', 'getRepository(MedicalClinicalReport).find({ where: { recordId: In(ids) } })' in service)
check('attachment response exposes counts only, not asset URLs', 'attachmentCount: attachmentCount.get(record.id) || 0' in service and 'getRepository(UploadAsset)' not in service[service.find('async healthFile'):service.find('async create(')])
check('medical access audit is written for each returned record', "'health_file_read'" in service and 'records.map(record => this.log' in service)
check('empty result is also audited', "await this.log(actor.sub, actor, 'health_file_read', null, null)" in service)
check('no schema migration is introduced', not list((root/'src/database/migrations').glob('*HealthFile*')))
check('V86 documentation exists', doc.exists())

failed = [name for name, ok in checks if not ok]
for name, ok in checks: print(('PASS' if ok else 'FAIL') + ' | ' + name)
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)}')
if failed: sys.exit(1)
