from pathlib import Path
import sys
root = Path(__file__).parent
checks = []
def check(name, condition):
    checks.append((name, bool(condition)))

entity = (root/'src/medical-records/medical-clinical-report.entity.ts').read_text()
dto = (root/'src/medical-records/dto/create-medical-clinical-report.dto.ts').read_text()
service = (root/'src/medical-records/medical-records.service.ts').read_text()
controller = (root/'src/medical-records/medical-records.controller.ts').read_text()
verify_controller = (root/'src/medical-records/medical-prescription-verification.controller.ts').read_text()
module = (root/'src/medical-records/medical-records.module.ts').read_text()
app = (root/'src/app.module.ts').read_text()
migration = (root/'src/database/migrations/1734600000000-CreateMedicalClinicalReports.ts').read_text()
doc = (root/'docs/phase-v85-clinical-reports.md')

check('clinical report entity table and fields', all(x in entity for x in ['medical_clinical_reports','recordId','patientUserId','doctorUserId','appointmentId','reportKind','sections','verificationToken']))
check('report sections are JSONB', 'type: \'jsonb\'' in entity)
check('report DTO restricts kinds', "@IsIn(['visit', 'diagnosis', 'follow_up', 'imaging', 'medical_summary'])" in dto)
check('report DTO bounds section count', '@ArrayMinSize(1)' in dto and '@ArrayMaxSize(20)' in dto)
check('report DTO bounds text sizes', '@MaxLength(5000)' in dto)
check('creation requires validated doctor appointment', 'doctorAppointmentPatient(actor, dto.appointmentId)' in service)
check('record and report created transactionally', 'this.dataSource.transaction' in service and 'reportRepo.save' in service and 'recordRepo.save' in service)
check('report creation audited', "'clinical_report_create'" in service)
check('report reads use structured access policy', 'assertStructuredRecordAccess(recordId, actor)' in service)
check('report reads audited', "'clinical_report_read'" in service)
check('private print response headers', "@Header('Cache-Control', 'private, no-store, max-age=0')" in controller)
check('print HTML escapes dynamic fields', 'this.escapeHtml(report.summary)' in service and 'this.escapeHtml(section.heading)' in service)
check('print view includes browser PDF workflow', 'window.print()' in service and 'طباعة / حفظ PDF' in service)
check('verification token uses cryptographic random bytes', "randomBytes(32).toString('hex')" in service)
check('public report verification does not return patient or report contents', "documentType: 'clinical_report'" in service and 'لا يتم عرض اسم المريض أو محتوى التقرير' in service and 'title: report.title' not in service[service.find('async verifyClinicalReportToken'):])
check('public report verification route registered', "@Get('report/:token')" in verify_controller)
check('authenticated report endpoints registered', all(x in controller for x in ["@Post('reports')", "@Get('reports/:recordId')", "@Get('reports/:recordId/print')"]))
check('module registers report entity', 'MedicalClinicalReport' in module)
check('application TypeORM entity list registers report', 'MedicalClinicalReport' in app)
check('migration creates table and unique verification token index', 'CREATE TABLE "medical_clinical_reports"' in migration and 'uq_medical_clinical_reports_verification_token' in migration)
check('migration protects foreign key relations', all(x in migration for x in ['FK_medical_clinical_report_record','FK_medical_clinical_report_patient','FK_medical_clinical_report_doctor','FK_medical_clinical_report_appointment']))
check('migration has reversible down operation', 'DROP TABLE "medical_clinical_reports"' in migration)
check('V85 documentation exists', doc.exists())

failed = [name for name, ok in checks if not ok]
for name, ok in checks:
    print(('PASS' if ok else 'FAIL') + ' | ' + name)
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)}')
if failed: sys.exit(1)
