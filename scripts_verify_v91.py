from pathlib import Path
import sys
root=Path(__file__).parent
service=(root/'src/medical-records/medical-records.service.ts').read_text()
module=(root/'src/medical-records/medical-records.module.ts').read_text()
controller=(root/'src/medical-records/medical-records.controller.ts').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
screen=(root/'mobile/src/screens/PatientHealthFileScreen.tsx').read_text()
uploads=(root/'src/uploads/uploads.service.ts').read_text()
checks=[]
def check(name,ok): checks.append((name,bool(ok)))
check('access history remains restricted to patient owner',"actor.role !== UserRole.PATIENT) throw new ForbiddenException('سجل الاطلاع متاح لصاحب الملف الطبي فقط')" in service)
check('access history returns latest 200 events',"order: { createdAt: 'DESC' }, take: 200" in service)
check('access history loads only minimal actor identity fields','select: { id: true, displayName: true, role: true }' in service)
check('access history loads record titles and types for referenced IDs','recordIds.length ? this.records.find({ where: { id: In(recordIds) }, select: { id: true, title: true, recordType: true, deletedAt: true } })' in service)
check('event labels cover reads, share changes, attachment reads and downloads',all(x in service for x in ['health_file_read:','share_grant:','share_revoke:','attachment_read:','attachment_download:','prescription_read:','lab_result_read:','clinical_report_read:']))
check('history response does not expose phone, email or raw actor UUID', 'actorName: user?.displayName' in service and 'actorUserId: event.actorUserId' not in service and 'email:' not in service and 'phone:' not in service)
check('record deletion state is represented without exposing record content','recordDeleted: !!record?.deletedAt' in service and 'recordTitle: record?.title' in service)
check('controller still exposes patient access-history endpoint',"@Get('access-history') history(" in controller)
check('User entity is registered in medical records module','User]), AuthModule]' in module)
check('mobile API exposes access-history endpoint',"medicalAccessHistory: () => request<any[]>('/medical-records/access-history')" in api)
check('patient health file provides collapsible access history','سجل الاطلاع والنشاط على ملفي الصحي' in screen and 'api.medicalAccessHistory()' in screen)
check('mobile displays actor, action label, record title and Baghdad timestamp',all(x in screen for x in ['event.actorName','event.actionLabel','event.recordTitle','timeZone:\'Asia/Baghdad\'']))
check('mobile labels downloads and revocations distinctly',all(x in screen for x in ['attachment_download','#B42318','share_revoke']))
check('actual medical attachment download is already audit-logged','action: \'attachment_download\'' in uploads)
failed=[name for name,ok in checks if not ok]
for name,ok in checks: print(('PASS' if ok else 'FAIL')+' | '+name)
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)}')
if failed: sys.exit(1)
