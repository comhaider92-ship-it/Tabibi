from pathlib import Path
root=Path(__file__).parent
checks={
 'message entity has appointment/facility booking binding':'src/messages/message.entity.ts',
 'message service enforces booking participant checks':'src/messages/messages.service.ts',
 'message controller protected by JWT and roles':'src/messages/messages.controller.ts',
 'message module registered in application':'src/app.module.ts',
 'message entity registered in TypeORM datasource':'src/database/data-source.ts',
 'migration creates booking message table':'src/database/migrations/1733100000000-CreateBookingMessages.ts',
 'message body DTO validates length':'src/messages/dto/send-booking-message.dto.ts',
 'doctor appointment message endpoint exists':'src/messages/messages.controller.ts',
 'facility booking message endpoint exists':'src/messages/messages.controller.ts',
 'patient list exposes server-calculated canMessage':'src/appointments/appointments.service.ts',
 'facility patient bookings expose canMessage':'src/facilities/facilities.service.ts',
 'mobile API has read/send message methods':'mobile/src/api/client.ts',
 'mobile reusable booking message UI exists':'mobile/src/components/BookingMessages.tsx',
 'patient booking list gates message UI by canMessage':'mobile/src/screens/BookingsScreen.tsx',
 'doctor dashboard has message UI':'mobile/src/screens/ProviderDashboardScreen.tsx',
 'owner facility booking dashboard has message UI':'mobile/src/screens/ProviderDashboardScreen.tsx',
 'phase documentation exists':'docs/phase-v44-booking-messages.md',
}
missing=[]
for label,rel in checks.items():
 p=root/rel
 if not p.exists(): missing.append(label); continue
 s=p.read_text(errors='ignore')
 if label=='message entity has appointment/facility booking binding' and not ('appointmentId' in s and 'facilityBookingId' in s): missing.append(label)
 elif label=='message service enforces booking participant checks' and not ('appointmentParticipants' in s and 'facilityParticipants' in s and 'ForbiddenException' in s): missing.append(label)
 elif label=='message controller protected by JWT and roles' and not ('JwtAuthGuard' in s and 'RolesGuard' in s): missing.append(label)
 elif label=='message module registered in application' and 'MessagesModule' not in s: missing.append(label)
 elif label=='message entity registered in TypeORM datasource' and 'BookingMessage' not in s: missing.append(label)
 elif label=='migration creates booking message table' and 'CREATE TABLE "booking_messages"' not in s: missing.append(label)
 elif label=='message body DTO validates length' and 'MaxLength(1000)' not in s: missing.append(label)
 elif label=='doctor appointment message endpoint exists' and 'appointments/:id' not in s: missing.append(label)
 elif label=='facility booking message endpoint exists' and 'facility-bookings/:id' not in s: missing.append(label)
 elif label=='patient list exposes server-calculated canMessage' and 'canMessage:' not in s: missing.append(label)
 elif label=='facility patient bookings expose canMessage' and 'canMessage:true' not in s: missing.append(label)
 elif label=='mobile API has read/send message methods' and not ('bookingMessages:' in s and 'sendBookingMessage:' in s): missing.append(label)
 elif label=='mobile reusable booking message UI exists' and 'export function BookingMessages' not in s: missing.append(label)
 elif label=='patient booking list gates message UI by canMessage' and 'x.canMessage===true' not in s: missing.append(label)
 elif label=='doctor dashboard has message UI' and 'kind="doctor"' not in s: missing.append(label)
 elif label=='owner facility booking dashboard has message UI' and 'kind="facility"' not in s: missing.append(label)
print(f'V44: {len(checks)-len(missing)}/{len(checks)} checks passed')
for item in missing: print('FAIL:',item)
raise SystemExit(1 if missing else 0)
