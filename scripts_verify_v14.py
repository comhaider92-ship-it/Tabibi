from pathlib import Path
root = Path(__file__).parent
service = (root / 'src/appointments/appointments.service.ts').read_text()
checks = {
    'transactional booking': 'dataSource.transaction' in service,
    'slot row lock': "setLock('pessimistic_write')" in service,
    'exact doctor and time slot': 'slot."doctorId" = :doctorId' in service and 'slot."startsAt" = :start AND slot."endsAt" = :end' in service,
    'approved doctor validation': 'DoctorProfileStatus.APPROVED' in service,
    'idempotency payload validation': 'replayOrConflict' in service,
    'overlap conflict handling': "code === '23P01'" in service,
    'transactional cancellation': 'appointment.status = AppointmentStatus.CANCELLED' in service,
    'slot closes on booking': 'slot.status = SlotStatus.CLOSED' in service,
    'slot reopens on cancellation unless an active exceptional closure applies': 'closure ? SlotStatus.CLOSED : SlotStatus.OPEN' in service,
}
for label, passed in checks.items():
    print(('PASS' if passed else 'FAIL') + ' - ' + label)
if not all(checks.values()):
    raise SystemExit(1)
print(f'{sum(checks.values())}/{len(checks)} static checks passed')
