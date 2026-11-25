from pathlib import Path

ROOT = Path(__file__).parent
sql = (ROOT / 'docs/operations/medical-upload-retention-audit.sql').read_text()
service = (ROOT / 'src/medical-records/medical-records.service.ts').read_text()
uploads = (ROOT / 'src/uploads/uploads.service.ts').read_text()
checks = {
    'V100 verification script retained': (ROOT / 'scripts_verify_v100.py').exists(),
    'Audit SQL is documented as read-only': 'READ-ONLY' in sql and 'SELECT privileges only' in sql,
    'Audit covers unlinked private medical uploads': 'ma.\"id\" IS NULL' in sql and "'medical_attachment'" in sql and 'a.\"isPublic\" = false' in sql,
    'Audit covers attachments on soft-deleted records': 'r."deletedAt" IS NOT NULL' in sql,
    'Audit covers superseded doctor/facility images': "'doctor_photo'" in sql and "'facility_image'" in sql and 'IS DISTINCT FROM' in sql,
    'Audit SQL has no destructive statements': not any(line.lstrip().upper().startswith(('DELETE ', 'UPDATE ', 'TRUNCATE ', 'DROP ')) for line in sql.splitlines() if not line.lstrip().startswith('--')),
    'Unlink retains upload asset and bytes': 'fileRetained: true' in service and 'await attachmentRepo.delete({ id: link.id })' in service,
    'Record deletion remains soft-delete': 'row.deletedAt = new Date()' in service and 'await this.records.save(row)' in service,
    'Public image guard checks current profile pointer': 'doctor.photoUrl === expectedUrl' in uploads and 'facility.imageUrl === expectedUrl' in uploads,
    'Medical download requires a current linked record': "deletedAt: IsNull()" in uploads and 'attachment_download' in uploads,
}
for name, ok in checks.items():
    print(f"{'PASS' if ok else 'FAIL'}: {name}")
print(f"\n{sum(checks.values())}/{len(checks)} checks passed")
raise SystemExit(0 if all(checks.values()) else 1)
