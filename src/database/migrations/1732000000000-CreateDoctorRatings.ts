import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctorRatings1732000000000 implements MigrationInterface {
  name = 'CreateDoctorRatings1732000000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "doctor_ratings" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "appointmentId" uuid NOT NULL,
      "doctorId" uuid NOT NULL,
      "patientId" uuid NOT NULL,
      "stars" smallint NOT NULL,
      "comment" varchar(1000),
      "status" varchar(20) NOT NULL DEFAULT 'published',
      "isReported" boolean NOT NULL DEFAULT false,
      "moderationNote" text,
      "moderatedBy" uuid,
      "moderatedAt" timestamptz,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_doctor_ratings" PRIMARY KEY ("id"),
      CONSTRAINT "FK_doctor_ratings_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_doctor_ratings_doctor" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_doctor_ratings_patient" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_doctor_ratings_moderator" FOREIGN KEY ("moderatedBy") REFERENCES "users"("id") ON DELETE SET NULL,
      CONSTRAINT "CHK_doctor_ratings_stars" CHECK ("stars" >= 1 AND "stars" <= 5),
      CONSTRAINT "CHK_doctor_ratings_status" CHECK ("status" IN ('published','hidden','under_review'))
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_doctor_rating_appointment" ON "doctor_ratings" ("appointmentId")`);
    await queryRunner.query(`CREATE INDEX "ix_doctor_rating_doctor_status_created" ON "doctor_ratings" ("doctorId", "status", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "ix_doctor_rating_reported" ON "doctor_ratings" ("isReported", "status")`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "doctor_ratings"`);
  }
}
