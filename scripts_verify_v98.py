from pathlib import Path

root = Path(__file__).resolve().parent
source = (root / 'src/uploads/uploads.service.ts').read_text()
entity = (root / 'src/uploads/upload-asset.entity.ts').read_text()
controller = (root / 'src/uploads/uploads.controller.ts').read_text()
checks = {
    'doctor and facility images have a dedicated allow-list': "const allowedMime = expectedImage" in source and "? ['image/jpeg', 'image/png', 'image/webp']" in source,
    'PDF is excluded from public profile images': "? ['image/jpeg', 'image/png', 'image/webp']" in source and 'application/pdf' not in source.split('? [\'image/jpeg\', \'image/png\', \'image/webp\']', 1)[1].split(':', 1)[0],
    'private medical attachments allow JPEG PNG WebP and PDF': "? ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']" in source,
    'official qualification and facility documents remain PDF-only': ": ['application/pdf'];" in source,
    'file signatures are checked against declared MIME': 'matchesSignature(buffer, dto.mimeType)' in source,
    'upload size limits remain enforced': 'buffer.length > maxBytes' in source,
    'private uploads are not exposed as public URLs': 'isPublic: expectedImage' in source,
    'private download route retains nosniff header': "@Header('X-Content-Type-Options', 'nosniff')" in controller,
    'medical attachment access still requires consent checks': 'c.allowDownload = true' in source and 'c.revokedAt IS NULL AND c.expiresAt > NOW()' in source,
    'medical attachment access is logged': "action: 'attachment_download'" in source,
    'all five upload categories remain defined': all(x in entity for x in ['doctor_photo', 'doctor_qualification', 'facility_image', 'facility_document', 'medical_attachment']),
}
for label, ok in checks.items():
    print(('PASS' if ok else 'FAIL') + ' | ' + label)
print(f'RESULT: {sum(checks.values())}/{len(checks)}')
raise SystemExit(0 if all(checks.values()) else 1)
