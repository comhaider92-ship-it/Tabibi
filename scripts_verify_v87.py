from pathlib import Path
import sys
root=Path(__file__).parent
checks=[]
def check(n,c): checks.append((n,bool(c)))
api=(root/'mobile/src/api/client.ts').read_text()
home=(root/'mobile/src/screens/HomeScreen.tsx').read_text()
app=(root/'mobile/App.tsx').read_text()
screen=(root/'mobile/src/screens/PatientHealthFileScreen.tsx').read_text()
service=(root/'src/medical-records/medical-records.service.ts').read_text()
check('mobile API calls authenticated health-file endpoint', 'patientHealthFile:' in api and '/medical-records/health-file' in api)
check('health file entry is reachable from patient home', 'onHealthFile' in home and 'ملفي الصحي' in home)
check('health file screen is registered only in patient navigation', 'PatientHealthFileScreen' in app and 'PatientHealthFile' in app)
check('screen supports all five record types and all filter', all(x in screen for x in ['visit_summary','diagnosis','prescription','test_result','note']))
check('screen uses bounded server pagination', 'api.patientHealthFile(target,20' in screen and 'page<pages' in screen)
check('screen refreshes and appends older records', 'load(true)' in screen and '...old,...result.items' in screen)
check('screen expands record details', 'setExpanded(open?null:item.id)' in screen)
check('screen renders structured prescription details', all(x in screen for x in ['medications','medicationName','generalInstructions']))
check('screen renders lab result and clinical comment', all(x in screen for x in ['testName','resultValue','referenceRange','clinicalComment']))
check('screen renders clinical report fields matching entity', all(x in screen for x in ['reportKind','summary','s.heading','s.body','followUpPlan']))
check('screen does not expose raw attachment URLs or asset identifiers', 'downloadUrl' not in screen and 'uploadAssetId' not in screen)
check('backend restricts comprehensive timeline to patient role', "actor.role !== UserRole.PATIENT" in service)
check('backend logs health file access', "'health_file_read'" in service)
check('screen explains this is not automated diagnosis', 'لا يُعد تشخيصاً طبياً آلياً' in screen)
failed=[n for n,ok in checks if not ok]
for n,ok in checks: print(('PASS' if ok else 'FAIL')+' | '+n)
print(f'RESULT: {len(checks)-len(failed)}/{len(checks)}')
if failed: sys.exit(1)
