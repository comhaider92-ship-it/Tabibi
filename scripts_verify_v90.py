from pathlib import Path
import sys
root=Path(__file__).parent
controller=(root/'src/medical-records/medical-records.controller.ts').read_text()
service=(root/'src/medical-records/medical-records.service.ts').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
screen=(root/'mobile/src/screens/PatientHealthFileScreen.tsx').read_text()
checks=[]
def check(name,ok): checks.append((name,bool(ok)))
check('V89 full-consent revoke endpoint remains available',"@Delete('share-consents/:id')" in controller and 'revokeShare(id, user)' in controller)
check('new endpoint revokes one record within a consent',"@Delete('share-consents/:id/records/:recordId')" in controller and 'revokeSharedRecord(id, recordId, user)' in controller)
check('individual revocation is restricted to patient role',"actor.role !== UserRole.PATIENT" in service and 'تعديل السجلات المشتركة متاح للمريض فقط' in service)
check('consent lookup is scoped to the authenticated patient','consent.patientUserId = :patientId' in service)
check('consent row is locked transactionally against concurrent edits','this.dataSource.transaction' in service and "setLock('pessimistic_write')" in service)
check('only the requested record is removed from the consent array','consent.recordIds.filter(id => id !== recordId)' in service)
check('consent is automatically revoked when its final record is removed','consent.recordIds.length === 0' in service and 'consent.revokedAt = new Date()' in service)
check('expired or already revoked consents cannot be edited','المشاركة ملغاة أو منتهية مسبقاً' in service)
check('record must belong to the patient before removal','recordRepo.findOne({ where: { id: recordId, patientUserId: actor.sub } })' in service)
check('individual revocation is written to access audit log',"action: 'share_revoke'" in service and 'logRepo.save' in service)
check('mobile API exposes per-record revoke action','revokeMedicalSharedRecord:' in api and '/records/${encodeURIComponent(recordId)}' in api)
check('patient UI offers per-record revoke with confirmation','إلغاء مشاركة هذا السجل فقط' in screen and 'إلغاء مشاركة سجل واحد' in screen)
check('patient UI refreshes consent state after individual revoke','await api.revokeMedicalSharedRecord(consentId,recordId);await loadShares();' in screen)
check('whole-doctor revoke remains available in patient UI','سحب صلاحية الطبيب' in screen and 'api.revokeMedicalShare(id)' in screen)
check('patient health screen no longer contains the legacy JSX closing-brace defect','لا توجد ملفات مرفقة بهذا السجل.</Body>}</View>}\n   </View>}' not in screen)
failed=[name for name,ok in checks if not ok]
for name,ok in checks: print(('PASS' if ok else 'FAIL')+' | '+name)
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)}')
if failed: sys.exit(1)
