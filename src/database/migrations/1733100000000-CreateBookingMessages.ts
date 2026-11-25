import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateBookingMessages1733100000000 implements MigrationInterface {
 name='CreateBookingMessages1733100000000';
 public async up(q:QueryRunner):Promise<void>{
  await q.query(`CREATE TABLE "booking_messages" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "appointmentId" uuid, "facilityBookingId" uuid, "senderUserId" uuid NOT NULL, "recipientUserId" uuid NOT NULL, "body" varchar(1000) NOT NULL, "readAt" timestamptz, "createdAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_booking_messages_id" PRIMARY KEY ("id"), CONSTRAINT "CK_booking_messages_one_booking" CHECK (("appointmentId" IS NOT NULL AND "facilityBookingId" IS NULL) OR ("appointmentId" IS NULL AND "facilityBookingId" IS NOT NULL)), CONSTRAINT "FK_booking_messages_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE, CONSTRAINT "FK_booking_messages_facility_booking" FOREIGN KEY ("facilityBookingId") REFERENCES "facility_bookings"("id") ON DELETE CASCADE, CONSTRAINT "FK_booking_messages_sender" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE, CONSTRAINT "FK_booking_messages_recipient" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE CASCADE)`);
  await q.query(`CREATE INDEX "ix_booking_messages_appointment_created" ON "booking_messages" ("appointmentId","createdAt")`);
  await q.query(`CREATE INDEX "ix_booking_messages_facility_booking_created" ON "booking_messages" ("facilityBookingId","createdAt")`);
  await q.query(`CREATE INDEX "ix_booking_messages_recipient_unread" ON "booking_messages" ("recipientUserId","readAt")`);
 }
 public async down(q:QueryRunner):Promise<void>{await q.query(`DROP TABLE IF EXISTS "booking_messages"`);}
}
