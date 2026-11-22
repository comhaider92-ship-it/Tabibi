from pathlib import Path
import sys
root=Path(__file__).parent
api=(root/'mobile/src/api/client.ts').read_text()
screen=(root/'mobile/src/screens/PatientHealthFileScreen.tsx').read_text()
pkg=(root/'mobile/package.json').read_text()
uploads=(root/'src/uploads/uploads.service.ts').read_text()
medical=(root/'src/medical-records/medical-records.service.ts').read_text()
checks=[]
def check(name,ok): checks.append((name,bool(ok)))
check('Expo document picker dependency declared','expo-document-picker' in pkg)
check('patient health screen uses native document picker','DocumentPicker.getDocumentAsync' in screen)
check('picker is restricted to supported medical image and PDF MIME types',all(x in screen for x in ['image/jpeg','image/png','image/webp','application/pdf']))
check('picker copies selected file to app cache','copyToCacheDirectory:true' in screen)
check('file size is checked against 10 MB before upload','10*1024*1024' in screen and 'fileSize>10*1024*1024' in screen)
check('patient confirms filename and size before upload','تأكيد رفع الملف' in screen and 'file.name' in screen and 'fileSize' in screen)
check('file content is read as base64 from local URI','FileSystem.readAsStringAsync(file.uri' in screen and 'EncodingType.Base64' in screen)
check('upload client requires active access token','uploadMedicalAttachment' in api and 'if(!accessToken)' in api)
check('upload client restricts medical attachment MIME types',"'image/jpeg','image/png','image/webp','application/pdf'" in api)
check('upload request uses private medical_attachment category',"'category:'" not in api and "category:'medical_attachment'" in api)
check('uploaded asset is linked to selected health record','api.linkMedicalAttachment(recordId,uploaded.id)' in screen)
check('link endpoint remains authenticated and patient-only', "actor.role !== UserRole.PATIENT" in medical and "@Post(':id/attachments')" in (root/'src/medical-records/medical-records.controller.ts').read_text())
check('backend enforces 10 MB limit and validates file signature','10 * 1024 * 1024' in uploads and 'matchesSignature' in uploads)
check('patient is told that doctor sharing requires separate consent','بموافقة منفصلة منك' in screen)
check('existing secure attachment listing and refresh remain connected','medicalRecordAttachments(recordId)' in screen and 'setAttachments' in screen)
failed=[name for name,ok in checks if not ok]
for name,ok in checks: print(('PASS' if ok else 'FAIL')+' | '+name)
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)}')
if failed: sys.exit(1)
