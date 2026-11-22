from pathlib import Path
root=Path(__file__).parent
svc=(root/'src/facilities/facilities.service.ts').read_text()
dto=(root/'src/facilities/dto/create-facility-booking.dto.ts').read_text()
mobile=(root/'mobile/src/screens/BookingScreen.tsx').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
checks={
 'facility booking still requires idempotency key':'if(!key||key.length>100)' in svc,
 'replay lookup uses idempotency key':'where:{idempotencyKey:key}' in svc,
 'replay binds original booking user':'replay.bookedByUserId===userId' in svc,
 'replay validates facility id':'replay.facilityId===dto.facilityId' in svc,
 'replay validates service id':'replay.serviceId===dto.serviceId' in svc,
 'replay validates slot id':'replay.slotId===dto.slotId' in svc,
 'replay validates patient name':'replay.patientName===dto.patientName' in svc,
 'replay validates patient phone including null':'replay.patientPhone===(dto.patientPhone??null)' in svc,
 'replay validates patient note including null':'replay.patientNote===(dto.patientNote??null)' in svc,
 'mismatched replay is rejected with conflict':'مفتاح الحجز مستخدم لطلب مختلف' in svc,
 'new booking still locks selected slot':'setLock(\'pessimistic_write\')' in svc,
 'new booking still verifies facility service relationship':'slot.serviceId!==dto.serviceId' in svc and 'facilityId:facility.id,isActive:true' in svc,
 'facility booking still records authenticated booker':'bookedByUserId:userId' in svc,
 'facility booking still starts as requested':'status:FacilityBookingStatus.REQUESTED' in svc,
 'mobile sends selected service and slot':'serviceId:service.id,slotId:slot.id' in mobile,
 'mobile sends patient name and optional phone':'patientName:patientName.trim(),patientPhone:patientPhone.trim()||undefined' in mobile,
 'API preserves idempotency header':'Idempotency-Key' in api,
 'patient name remains validated':'@IsString() @MinLength(2) @MaxLength(120) patientName:string' in dto,
}
failed=[k for k,v in checks.items() if not v]
print(f'V57 facility booking idempotency checks: {len(checks)-len(failed)}/{len(checks)} passed')
for x in failed: print('FAIL:',x)
raise SystemExit(bool(failed))
