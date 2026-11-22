import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePushAndAppointmentReminders1731900000000 implements MigrationInterface {
  name = 'CreatePushAndAppointmentReminders1731900000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "notification_device_tokens" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid NOT NULL,
      "token" text NOT NULL, "platform" varchar(16) NOT NULL,
      "isActive" boolean NOT NULL DEFAULT true,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_notification_device_tokens" PRIMARY KEY ("id"),
      CONSTRAINT "FK_notification_device_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_notification_device_token" ON "notification_device_tokens" ("token")`);
    await queryRunner.query(`CREATE INDEX "ix_notification_device_user_active" ON "notification_device_tokens" ("userId", "isActive")`);
    await queryRunner.query(`CREATE TABLE "notification_preferences" (
      "userId" uuid NOT NULL, "pushEnabled" boolean NOT NULL DEFAULT true,
      "remindersEnabled" boolean NOT NULL DEFAULT true, "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("userId"),
      CONSTRAINT "FK_notification_preferences_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE "appointment_reminders" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "appointmentId" uuid NOT NULL,
      "recipientUserId" uuid NOT NULL, "kind" varchar(16) NOT NULL, "sendAt" timestamptz NOT NULL,
      "status" varchar(16) NOT NULL DEFAULT 'pending', "attempts" integer NOT NULL DEFAULT 0,
      "lastError" text, "sentAt" timestamptz,
      "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_appointment_reminders" PRIMARY KEY ("id"),
      CONSTRAINT "FK_appointment_reminders_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_appointment_reminders_recipient" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_appointment_reminder_kind_recipient" ON "appointment_reminders" ("appointmentId", "recipientUserId", "kind")`);
    await queryRunner.query(`CREATE INDEX "ix_appointment_reminder_due" ON "appointment_reminders" ("status", "sendAt")`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "appointment_reminders"`);
    await queryRunner.query(`DROP TABLE "notification_preferences"`);
    await queryRunner.query(`DROP TABLE "notification_device_tokens"`);
  }
}
