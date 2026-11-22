from pathlib import Path
import sys
root=Path(__file__).parent
checks=[]
def check(name,condition): checks.append((name,bool(condition)))
api=(root/'mobile/src/api/client.ts').read_text()
screen=(root/'mobile/src/screens/PatientHealthFileScreen.tsx').read_text()
service=(root/'src/medical-records/medical-records.service.ts').read_text()
uploads=(root/'src/uploads/uploads.service.ts').read_text()
pkg=(root/'mobile/package.json').read_text()
controller=(root/'src/medical-records/medical-records.controller.ts').read_text()
check('attachment listing client targets authenticated record endpoint','medicalRecordAttachments:' in api and '/attachments' in api)
check('patient screen loads attachment metadata on demand','loadAttachments' in screen and 'api.medicalRecordAttachments(recordId)' in screen)
check('patient sees attachment name type size and date',all(x in screen for x in ['file.fileName','file.mimeType','file.sizeBytes','file.createdAt']))
check('download uses authenticated bearer token', 'Authorization:`Bearer ${accessToken}`' in api and '/uploads/${encodeURIComponent(id)}/download' in api)
check('native file open/share requires explicit tap','downloadMedicalAttachment(file.id,file.fileName,file.mimeType)' in screen and 'Sharing.shareAsync' in api)
check('download button is gated by server canDownload','file.canDownload?' in screen)
check('consent list API is connected','medicalShareConsents:' in api and "'/medical-records/share-consents'" in api)
check('patient can revoke consent with confirmation','revokeMedicalShare:' in api and 'سحب صلاحية المشاركة' in screen and 'api.revokeMedicalShare(id)' in screen)
check('consent UI exposes expiry download flag and rendered record count',all(x in screen for x in ['item.expiresAt','item.allowDownload','item.records?.length']))
check('backend lists attachments through guarded medical controller','listAttachments' in controller and 'UseGuards(JwtAuthGuard, RolesGuard)' in controller)
check('backend checks exact doctor grant and expiry before listing attachments',"c.revokedAt IS NULL AND c.expiresAt > NOW()" in service and ':recordId = ANY(c.recordIds)' in service)
check('backend checks consent again for binary download','medicalAttachment' in uploads and 'allowDownload' in uploads)
check('Expo native file and sharing dependencies declared','expo-file-system' in pkg and 'expo-sharing' in pkg)
failed=[name for name,ok in checks if not ok]
for name,ok in checks: print(('PASS' if ok else 'FAIL')+' | '+name)
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)}')
if failed: sys.exit(1)
