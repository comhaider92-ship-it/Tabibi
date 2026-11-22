import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreatePatientMedicalRecords1734200000000 implements MigrationInterface {
  name = 'CreatePatientMedicalRecords1734200000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "medical_records" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "patientUserId" uuid NOT NULL,
      "appointmentId" uuid NULL, "authorUserId" uuid NOT NULL, "authorRole" varchar(16) NOT NULL,
      "recordType" varchar(24) NOT NULL, "title" varchar(160) NOT NULL, "content" text NOT NULL,
      "deletedAt" timestamptz NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now(), CONSTRAINT "PK_medical_records_id" PRIMARY KEY ("id"),
      CONSTRAINT "FK_medical_records_patient" FOREIGN KEY ("patientUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_records_author" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_records_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE INDEX "ix_medical_records_patient_created" ON "medical_records" ("patientUserId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "ix_medical_records_appointment" ON "medical_records" ("appointmentId")`);
    await queryRunner.query(`CREATE INDEX "ix_medical_records_author" ON "medical_records" ("authorUserId")`);
    await queryRunner.query(`CREATE TABLE "medical_record_access_logs" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "patientUserId" uuid NOT NULL, "recordId" uuid NULL,
      "actorUserId" uuid NOT NULL, "actorRole" varchar(16) NOT NULL, "action" varchar(16) NOT NULL,
      "appointmentId" uuid NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_medical_record_access_logs_id" PRIMARY KEY ("id"),
      CONSTRAINT "FK_medical_record_access_patient" FOREIGN KEY ("patientUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_record_access_actor" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_record_access_record" FOREIGN KEY ("recordId") REFERENCES "medical_records"("id") ON DELETE SET NULL,
      CONSTRAINT "FK_medical_record_access_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL
    )`);
    await queryRunner.query(`CREATE INDEX "ix_medical_record_access_patient_created" ON "medical_record_access_logs" ("patientUserId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "ix_medical_record_access_record_created" ON "medical_record_access_logs" ("recordId", "createdAt")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "medical_record_access_logs"`);
    await queryRunner.query(`DROP TABLE "medical_records"`);
  }
}
