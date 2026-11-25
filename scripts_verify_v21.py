from pathlib import Path
root=Path(__file__).resolve().parent
catalog=(root/'src/medical-directory/medical-directory.controller.ts').read_text()
fac=(root/'src/facilities/facilities.controller.ts').read_text()
svc=(root/'src/facilities/facilities.service.ts').read_text()
entity=(root/'src/facilities/facility-booking.entity.ts').read_text()
app=(root/'src/app.module.ts').read_text()
ds=(root/'src/database/data-source.ts').read_text()
mig=(root/'src/database/migrations/1732200000000-AddMedicalCategoriesAndFacilities.ts').read_text()
dto=(root/'src/facilities/dto/create-facility-booking.dto.ts').read_text()
checks={
 'doctor specialties catalog includes pediatrics, gynecology, internal medicine and cardiology': all(x in catalog for x in ['الأطفال','نسائية وتوليد','باطنية','قلبية']),
 'doctor catalog includes additional specialty groups': all(x in catalog for x in ['عظام ومفاصل','جلدية','أعصاب','عيون','أسنان','أنف وأذن وحنجرة']),
 'diagnostic catalog includes lab, MRI, x-ray, ultrasound and CT': all(x in catalog for x in ['مختبرات وتحاليل','رنين مغناطيسي','أشعة سينية','سونار','مفراس طبقي']),
 'catalog endpoint is public and grouped': "@Get('categories')" in catalog and 'doctors: DOCTOR_SPECIALTIES' in catalog and 'diagnostics: DIAGNOSTIC_SERVICES' in catalog,
 'public facility directory only returns approved facilities': "status:FacilityStatus.APPROVED" in svc,
 'facility directory supports city and type filters': 'LOWER(f.city)=LOWER(:city)' in svc and 'facilityType=:type' in svc,
 'facilities expose only active services': 'isActive:true' in svc,
 'owner-only facility and service creation endpoints exist': "@Roles(UserRole.OWNER)" in fac and "@Post(':id/services')" in fac,
 'owner review endpoint exists': "@Patch('owner/:id/review')" in fac,
 'patient facility booking endpoint is protected': "@Post('bookings')" in fac and '@Roles(UserRole.PATIENT)' in fac,
 'booking requires facility, service, patient name and a concrete future slot': all(x in dto for x in ['facilityId:string','serviceId:string','patientName:string','slotId:string']) and 'slot.startsAt<=new Date()' in svc,
 'booking verifies approved facility and service ownership': 'FacilityStatus.APPROVED' in svc and 'facilityId:facility.id' in svc,
 'idempotency and duplicate-time protection included': 'idempotencyKey' in entity and 'uq_facility_service_active_time' in mig,
 'facility booking defaults to request awaiting confirmation': "FacilityBookingStatus.REQUESTED" in entity and "DEFAULT 'requested'" in mig,
 'all entities registered in runtime and migration datasource': all(x in app for x in ['MedicalFacility','FacilityService','FacilityBooking']) and all(x in ds for x in ['MedicalFacility','FacilityService','FacilityBooking']),
 'database migration creates and rolls back facility tables': all(x in mig for x in ['CREATE TABLE medical_facilities','CREATE TABLE facility_services','CREATE TABLE facility_bookings','DROP TABLE IF EXISTS facility_bookings']),
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' '+name)
print(f'{sum(checks.values())}/{len(checks)} checks passed')
raise SystemExit(0 if all(checks.values()) else 1)
