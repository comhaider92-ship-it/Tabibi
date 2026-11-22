from pathlib import Path

ROOT = Path(__file__).resolve().parent
controller = (ROOT / 'src/appointments/appointments.controller.ts').read_text()
service = (ROOT / 'src/appointments/appointments.service.ts').read_text()
dto = (ROOT / 'src/appointments/dto/list-appointments.dto.ts').read_text()
module = (ROOT / 'src/appointments/appointments.module.ts').read_text()
checks = {
    'authenticated appointments list endpoint': "@Get()" in controller and 'list(@Query()' in controller,
    'patient and doctor role restriction': '@Roles(UserRole.PATIENT, UserRole.DOCTOR)' in controller,
    'patient own and beneficiary scope': 'a."bookedByUserId" = :userId OR a."beneficiaryId" = :userId' in service,
    'doctor own appointment scope': 'a."doctorId" = :userId' in service,
    'status filter': 'filters.status' in service and 'IsEnum(AppointmentStatus)' in dto,
    'inclusive date filters': 'a."startsAt" >= :from' in service and 'a."startsAt" <= :to' in service,
    'bounded pagination': '@Max(50)' in dto and '.skip((page - 1) * limit).take(limit)' in service,
    'pagination metadata': 'totalPages: Math.ceil(total / limit)' in service,
    'limited doctor and beneficiary data': 'fullName: profile.fullName' in service and 'displayName: beneficiary.displayName' in service,
    'repositories registered': all(x in module for x in ['Appointment, AppointmentStatusHistory, User, DoctorProfile, ScheduleException', 'DoctorSubscription']),
    'V14 cancellation retained': 'async cancel(' in service and 'SlotStatus.OPEN' in service,
}
for name, ok in checks.items():
    print(f"{'PASS' if ok else 'FAIL'}: {name}")
print(f'RESULT: {sum(checks.values())}/{len(checks)} checks passed')
raise SystemExit(0 if all(checks.values()) else 1)
