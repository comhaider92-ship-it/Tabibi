from pathlib import Path
root = Path(__file__).parent
service = (root/'src/appointments/appointments.service.ts').read_text()
controller = (root/'src/appointments/appointments.controller.ts').read_text()
module = (root/'src/appointments/appointments.module.ts').read_text()
app = (root/'src/app.module.ts').read_text()
migration = (root/'src/database/migrations/1731700000000-CreateAppointmentStatusHistory.ts').read_text()
docs = (root/'docs/phase-v16-appointment-details-and-status.md').read_text()
checks = {
 'status history entity registered': 'AppointmentStatusHistory' in module and 'AppointmentStatusHistory' in app,
 'new bookings record initial confirmed status': 'toStatus: AppointmentStatus.CONFIRMED' in service,
 'status endpoint exists': "@Patch(':id/status')" in controller and 'updateStatus' in controller,
 'only doctor and owner can change status': 'UserRole.DOCTOR, UserRole.OWNER' in controller and 'user.role !== UserRole.DOCTOR && user.role !== UserRole.OWNER' in service,
 'only completed or no-show accepted': 'dto.status !== AppointmentStatus.COMPLETED' in service and 'dto.status !== AppointmentStatus.NO_SHOW' in service,
 'doctor restricted to own appointments': 'appointment.doctorId !== user.sub' in service,
 'only confirmed appointments transition': 'appointment.status !== AppointmentStatus.CONFIRMED' in service,
 'cannot mark before appointment starts': 'appointment.startsAt.getTime() > Date.now()' in service,
 'status history saved transactionally': 'manager.getRepository(AppointmentStatusHistory).save' in service,
 'cancellation history recorded': 'toStatus: AppointmentStatus.CANCELLED' in service,
 'detail response includes history': 'statusHistory: history.map' in service,
 'legacy appointments backfilled': 'INSERT INTO appointment_status_history' in migration,
 'migration index created': 'ix_appointment_status_history_appointment_created' in migration,
 'no fixed daily cap documented': 'no fixed daily booking cap' in docs.lower() and '200 slots per request' in docs,
}
for name, ok in checks.items(): print(('PASS' if ok else 'FAIL') + ' - ' + name)
print(f'RESULT: {sum(checks.values())}/{len(checks)} checks passed')
raise SystemExit(0 if all(checks.values()) else 1)
