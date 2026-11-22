import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateNotifications1731800000000 implements MigrationInterface {
  name = 'CreateNotifications1731800000000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "appointmentId" uuid NULL REFERENCES appointments(id) ON DELETE SET NULL,
      type varchar(40) NOT NULL,
      title varchar(180) NOT NULL,
      body text NOT NULL,
      data jsonb NOT NULL DEFAULT '{}'::jsonb,
      "isRead" boolean NOT NULL DEFAULT false,
      "readAt" timestamptz NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now()
    )`);
    await q.query(`CREATE INDEX ix_notifications_user_created ON notifications ("userId", "createdAt" DESC)`);
    await q.query(`CREATE INDEX ix_notifications_user_read_created ON notifications ("userId", "isRead", "createdAt" DESC)`);
  }
  async down(q: QueryRunner): Promise<void> { await q.query('DROP TABLE notifications'); }
}
