from pathlib import Path
root=Path(__file__).parent
checks={
 'patient app requests slots through public profile id route':('mobile/src/api/client.ts','/doctors/${id}/available-slots'),
 'public profile slot route exists':('src/doctors/doctors.controller.ts',"@Get(':id/available-slots')"),
 'public slot route resolves profile id server-side':('src/doctors/doctors.controller.ts','approvedUserIdForProfile(id)'),
 'profile lookup only accepts approved doctors':('src/doctors/doctors.service.ts','status: DoctorProfileStatus.APPROVED'),
 'public slot route delegates to authoritative scheduling service':('src/doctors/doctors.controller.ts','this.scheduling.publicOpen(doctorUserId, from, to)'),
 'scheduling service exported for doctor module reuse':('src/scheduling/scheduling.module.ts','exports:[SchedulingService]'),
 'doctor module imports scheduling module':('src/doctors/doctors.module.ts','SchedulingModule'),
 'patient app sends public profile identifier in booking request':('mobile/src/screens/BookingScreen.tsx','doctorProfileId:item.id'),
 'mobile booking API models public profile identifier':('mobile/src/api/client.ts','doctorProfileId:string'),
 'appointment DTO accepts profile identifier':('src/appointments/dto/create-appointment.dto.ts','doctorProfileId?:string'),
 'appointment controller routes profile-based booking to resolver':('src/appointments/appointments.controller.ts','this.service.createFromProfile(dto, key, user.sub)'),
 'server resolves profile to internal doctor account id':('src/appointments/appointments.service.ts','where: { id: dto.doctorProfileId, status: DoctorProfileStatus.APPROVED }'),
 'server rejects conflicting account and profile identifiers':('src/appointments/appointments.service.ts','بيانات الطبيب غير متطابقة'),
 'resolved booking uses existing atomic reservation path':('src/appointments/appointments.service.ts','return this.create({ ...booking, doctorId: profile.userId }, key, bookerId)'),
 'existing transaction lock retained':('src/appointments/appointments.service.ts','pessimistic_write'),
 'subscription validation retained after profile resolution':('src/appointments/appointments.service.ts','اشتراك الطبيب منتهٍ أو غير مفعل'),
 'public directory does not expose doctor account id':('src/doctors/doctors.service.ts','id: p.id, fullName: p.fullName'),
}
failed=[]
for label,(rel,needle) in checks.items():
 p=root/rel; content=p.read_text(errors='ignore') if p.exists() else ''
 if needle not in content: failed.append(label)
print(f'V56 patient booking integration checks: {len(checks)-len(failed)}/{len(checks)} passed')
for item in failed: print('FAIL:',item)
raise SystemExit(1 if failed else 0)
