import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStructuredPrescriptionsAndLabResults1734400000000 implements MigrationInterface {
  name = 'CreateStructuredPrescriptionsAndLabResults1734400000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "medical_prescriptions" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "recordId" uuid NOT NULL,
      "patientUserId" uuid NOT NULL, "doctorUserId" uuid NOT NULL, "appointmentId" uuid NOT NULL,
      "medications" jsonb NOT NULL, "generalInstructions" text NULL, "validUntil" timestamptz NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_medical_prescriptions" PRIMARY KEY ("id"),
      CONSTRAINT "FK_medical_prescription_record" FOREIGN KEY ("recordId") REFERENCES "medical_records"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_prescription_patient" FOREIGN KEY ("patientUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_prescription_doctor" FOREIGN KEY ("doctorUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_prescription_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_medical_prescriptions_record" ON "medical_prescriptions" ("recordId")`);
    await queryRunner.query(`CREATE INDEX "ix_medical_prescriptions_patient_created" ON "medical_prescriptions" ("patientUserId", "createdAt")`);
    await queryRunner.query(`CREATE TABLE "medical_lab_results" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "recordId" uuid NOT NULL,
      "patientUserId" uuid NOT NULL, "doctorUserId" uuid NOT NULL, "appointmentId" uuid NOT NULL,
      "testName" varchar(160) NOT NULL, "resultValue" text NOT NULL, "unit" varchar(40) NULL,
      "referenceRange" varchar(120) NULL, "interpretation" varchar(24) NOT NULL DEFAULT 'not_interpreted',
      "laboratoryName" varchar(160) NULL, "performedOn" date NULL, "clinicalComment" text NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_medical_lab_results" PRIMARY KEY ("id"),
      CONSTRAINT "FK_medical_lab_result_record" FOREIGN KEY ("recordId") REFERENCES "medical_records"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_lab_result_patient" FOREIGN KEY ("patientUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_lab_result_doctor" FOREIGN KEY ("doctorUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_lab_result_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT,
      CONSTRAINT "CK_medical_lab_interpretation" CHECK ("interpretation" IN ('low','normal','high','critical','positive','negative','not_interpreted'))
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_medical_lab_results_record" ON "medical_lab_results" ("recordId")`);
    await queryRunner.query(`CREATE INDEX "ix_medical_lab_results_patient_created" ON "medical_lab_results" ("patientUserId", "createdAt")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "medical_lab_results"`);
    await queryRunner.query(`DROP TABLE "medical_prescriptions"`);
  }
}
