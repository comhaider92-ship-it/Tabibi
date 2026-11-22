import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateAppointmentStatusHistory1731700000000 implements MigrationInterface {
  name = 'CreateAppointmentStatusHistory1731700000000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE appointment_status_history (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "appointmentId" uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
      "fromStatus" varchar(24) NULL, "toStatus" varchar(24) NOT NULL,
      "changedByUserId" uuid NOT NULL REFERENCES users(id), "changedByRole" varchar(16) NOT NULL,
      reason varchar(500) NULL, "createdAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE INDEX ix_appointment_status_history_appointment_created ON appointment_status_history ("appointmentId", "createdAt")`);
    await q.query(`INSERT INTO appointment_status_history ("appointmentId", "fromStatus", "toStatus", "changedByUserId", "changedByRole", reason)
      SELECT id, NULL, status, "bookedByUserId", 'patient', 'سجل سابق قبل تفعيل سجل الحالات' FROM appointments`);
  }
  async down(q: QueryRunner): Promise<void> { await q.query('DROP TABLE appointment_status_history'); }
}
