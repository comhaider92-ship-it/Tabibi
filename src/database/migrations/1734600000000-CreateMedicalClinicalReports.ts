import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMedicalClinicalReports1734600000000 implements MigrationInterface {
  name = 'CreateMedicalClinicalReports1734600000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "medical_clinical_reports" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "recordId" uuid NOT NULL,
      "patientUserId" uuid NOT NULL,
      "doctorUserId" uuid NOT NULL,
      "appointmentId" uuid NOT NULL,
      "reportKind" varchar(24) NOT NULL,
      "title" varchar(180) NOT NULL,
      "summary" text NOT NULL,
      "sections" jsonb NOT NULL,
      "recommendations" text NULL,
      "followUpPlan" text NULL,
      "nextReviewDate" date NULL,
      "verificationToken" varchar(64) NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_medical_clinical_reports" PRIMARY KEY ("id"),
      CONSTRAINT "FK_medical_clinical_report_record" FOREIGN KEY ("recordId") REFERENCES "medical_records"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_clinical_report_patient" FOREIGN KEY ("patientUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_clinical_report_doctor" FOREIGN KEY ("doctorUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_clinical_report_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE RESTRICT,
      CONSTRAINT "CK_medical_clinical_report_kind" CHECK ("reportKind" IN ('visit','diagnosis','follow_up','imaging','medical_summary'))
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_medical_clinical_reports_record" ON "medical_clinical_reports" ("recordId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_medical_clinical_reports_verification_token" ON "medical_clinical_reports" ("verificationToken") WHERE "verificationToken" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX "ix_medical_clinical_reports_patient_created" ON "medical_clinical_reports" ("patientUserId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "ix_medical_clinical_reports_doctor_created" ON "medical_clinical_reports" ("doctorUserId", "createdAt")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "medical_clinical_reports"`);
  }
}
