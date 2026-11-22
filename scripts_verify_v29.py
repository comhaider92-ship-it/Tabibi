from pathlib import Path
root = Path(__file__).resolve().parent
service = (root/'src/appointments/appointments.service.ts').read_text()
dto = (root/'src/appointments/dto/create-appointment.dto.ts').read_text()
entity = (root/'src/appointments/appointment.entity.ts').read_text()
mobile = (root/'mobile/src/screens/BookingScreen.tsx').read_text()
api = (root/'mobile/src/api/client.ts').read_text()
migration = (root/'src/database/migrations/1732700000000-AllowGuestBeneficiaryDoctorBookings.ts').read_text()
checks = {
    'guest beneficiary migration exists': (root/'src/database/migrations/1732700000000-AllowGuestBeneficiaryDoctorBookings.ts').exists(),
    'beneficiary id optional in DTO': '@IsOptional() @IsUUID() beneficiaryId?:string;' in dto,
    'beneficiary name validated': '@MaxLength(120) beneficiaryName?:string;' in dto,
    'beneficiary phone validated': '@MaxLength(32) beneficiaryPhone?:string;' in dto,
    'guest name required when no beneficiary id': "if (!dto.beneficiaryId && !dto.beneficiaryName?.trim())" in service,
    'guest beneficiary name persisted': 'beneficiaryName: dto.beneficiaryName?.trim() ?? null' in service,
    'guest beneficiary phone persisted': 'beneficiaryPhone: dto.beneficiaryPhone?.trim() ?? null' in service,
    'idempotency compares guest identity': 'appointment.beneficiaryName === (dto.beneficiaryName?.trim() ?? null)' in service,
    'guest recipients filtered from notifications': 'filter((id): id is string => !!id)' in service,
    'guest excluded from reminder recipient list': 'reminderRecipients' in service and 'saved.beneficiaryId].filter' in service,
    'guest name returned in appointment list': 'displayName: a.beneficiaryName' in service,
    'guest name returned in appointment details': 'displayName: appointment.beneficiaryName' in service,
    'entity beneficiary nullable': "@Column({type:'uuid',nullable:true}) beneficiaryId:string|null;" in entity,
    'entity stores guest phone': 'beneficiaryPhone:string|null' in entity,
    'migration relaxes beneficiary foreign key nullability': 'ALTER COLUMN "beneficiaryId" DROP NOT NULL' in migration,
    'migration requires beneficiary name or id': 'ck_appointments_beneficiary' in migration and 'NULLIF(BTRIM("beneficiaryName"), \'\')' in migration,
    'mobile exposes self booking': 'الحجز لنفسي' in mobile,
    'mobile exposes booking for another person': 'الحجز لشخص آخر' in mobile,
    'mobile sends guest name to doctor API': 'beneficiaryName:patientName.trim()' in mobile,
    'mobile API type supports guest beneficiary': 'beneficiaryName?:string;beneficiaryPhone?:string' in api,
    'phase documentation exists': (root/'docs/phase-v29-book-for-another-person.md').exists(),
}
for name, ok in checks.items(): print(('PASS' if ok else 'FAIL') + ' - ' + name)
print(f'RESULT: {sum(checks.values())}/{len(checks)} checks passed')
raise SystemExit(0 if all(checks.values()) else 1)
