from pathlib import Path

root = Path(__file__).parent
uploads = (root / 'src/uploads/uploads.service.ts').read_text()
records = (root / 'src/medical-records/medical-records.service.ts').read_text()
controller = (root / 'src/medical-records/medical-records.controller.ts').read_text()

checks = {
    'V99 duplicate Base64 validation declarations removed': uploads.count('const maxBytes = expectedImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;') == 1 and uploads.count('const maxBase64Length = 4 * Math.ceil(maxBytes / 3);') == 1,
    'Base64 size and alphabet checks remain before decoding': uploads.index('dto.base64.length > maxBase64Length') < uploads.index("Buffer.from(dto.base64, 'base64')"),
    'Medical attachment linking is patient-only': "if (actor.role !== UserRole.PATIENT) throw new ForbiddenException('ربط المرفقات الطبية متاح للمريض فقط');" in records,
    'Linking uses a transaction and row locks': 'async linkAttachment' in records and 'this.dataSource.transaction(async manager =>' in records and records.count(".setLock('pessimistic_write')") >= 2,
    'Only private patient-owned medical assets can be linked': 'asset.ownerUserId = :patientId' in records and 'asset.isPublic = false' in records and 'UploadCategory.MEDICAL_ATTACHMENT' in records,
    'Duplicate asset links are rejected and database unique index remains': 'هذا المرفق مرتبط بسجل طبي مسبقاً' in records and "@Index('uq_medical_record_attachment_asset', ['uploadAssetId'], { unique: true })" in (root / 'src/medical-records/medical-record-attachment.entity.ts').read_text(),
    'Unlink is patient-only and verifies record ownership': 'async unlinkAttachment' in records and 'فصل المرفقات الطبية متاح لصاحب الملف فقط' in records and 'record.patientUserId = :patientId' in records,
    'Unlink removes only relationship, retaining file bytes and asset row': 'await attachmentRepo.delete({ id: link.id });' in records and 'fileRetained: true' in records and 'unlink(' not in records[records.index('async unlinkAttachment'):records.index('async listAttachments')],
    'Unlink operation is recorded in access history': "action: 'attachment_unlink'" in records,
    'Unlink endpoint validates both UUID parameters': "@Delete(':id/attachments/:uploadAssetId')" in controller and "new ParseUUIDPipe()) uploadAssetId" in controller,
    'Doctor access still requires live share consent and approved status': "DoctorProfileStatus.APPROVED" in uploads and 'c.allowDownload = true' in uploads,
    'Medical attachment download remains access-logged': "action: 'attachment_download'" in uploads,
    'Soft-deleted records remain excluded from normal attachment listing': "deletedAt: IsNull()" in records[records.index('async listAttachments'):records.index('private async doctorAppointmentPatient')],
}

failed = [name for name, passed in checks.items() if not passed]
for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'}: {name}")
print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed")
if failed:
    raise SystemExit(1)
