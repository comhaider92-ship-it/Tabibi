import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateSecureUploadAssets1733400000000 implements MigrationInterface {
  name = 'CreateSecureUploadAssets1733400000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "medical_facilities" ADD COLUMN "imageUrl" text`);
    await queryRunner.query(`CREATE TABLE "upload_assets" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "ownerUserId" uuid NOT NULL,
      "facilityId" uuid,
      "category" character varying(32) NOT NULL,
      "originalName" character varying(100) NOT NULL,
      "mimeType" character varying(80) NOT NULL,
      "storageKey" character varying(180) NOT NULL,
      "sizeBytes" integer NOT NULL,
      "isPublic" boolean NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_upload_assets_id" PRIMARY KEY ("id"),
      CONSTRAINT "UQ_upload_assets_storageKey" UNIQUE ("storageKey"),
      CONSTRAINT "FK_upload_assets_user" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE,
      CONSTRAINT "FK_upload_assets_facility" FOREIGN KEY ("facilityId") REFERENCES "medical_facilities"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE INDEX "ix_upload_assets_owner_category" ON "upload_assets" ("ownerUserId", "category")`);
    await queryRunner.query(`CREATE INDEX "ix_upload_assets_facility" ON "upload_assets" ("facilityId")`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "upload_assets"`);
    await queryRunner.query(`ALTER TABLE "medical_facilities" DROP COLUMN IF EXISTS "imageUrl"`);
  }
}
