import { MigrationInterface, QueryRunner } from 'typeorm';
export class ExtendMedicalRecordsSharingAndAttachments1734300000000 implements MigrationInterface {
  name = 'ExtendMedicalRecordsSharingAndAttachments1734300000000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "medical_record_access_logs" ALTER COLUMN "action" TYPE varchar(32)`);
    await queryRunner.query(`CREATE TABLE "medical_record_attachments" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "recordId" uuid NOT NULL,
      "uploadAssetId" uuid NOT NULL, "attachedByUserId" uuid NOT NULL,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_medical_record_attachments" PRIMARY KEY ("id"),
      CONSTRAINT "FK_medical_attachment_record" FOREIGN KEY ("recordId") REFERENCES "medical_records"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_attachment_asset" FOREIGN KEY ("uploadAssetId") REFERENCES "upload_assets"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_attachment_user" FOREIGN KEY ("attachedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_medical_record_attachment_asset" ON "medical_record_attachments" ("uploadAssetId")`);
    await queryRunner.query(`CREATE INDEX "ix_medical_record_attachments_record" ON "medical_record_attachments" ("recordId", "createdAt")`);
    await queryRunner.query(`CREATE TABLE "medical_record_share_consents" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(), "patientUserId" uuid NOT NULL,
      "doctorUserId" uuid NOT NULL, "recordIds" uuid[] NOT NULL,
      "expiresAt" timestamptz NOT NULL, "allowDownload" boolean NOT NULL DEFAULT false,
      "revokedAt" timestamptz NULL, "createdAt" timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT "PK_medical_record_share_consents" PRIMARY KEY ("id"),
      CONSTRAINT "FK_medical_share_patient" FOREIGN KEY ("patientUserId") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "FK_medical_share_doctor" FOREIGN KEY ("doctorUserId") REFERENCES "users"("id") ON DELETE RESTRICT
    )`);
    await queryRunner.query(`CREATE INDEX "ix_medical_share_patient_doctor" ON "medical_record_share_consents" ("patientUserId", "doctorUserId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "ix_medical_share_doctor_expiry" ON "medical_record_share_consents" ("doctorUserId", "expiresAt", "revokedAt")`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "medical_record_share_consents"`);
    await queryRunner.query(`DROP TABLE "medical_record_attachments"`);
    // PostgreSQL enum values cannot be safely removed in a reversible migration.
  }
}
