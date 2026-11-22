import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateAuthSessions1734100000000 implements MigrationInterface {
  name = 'CreateAuthSessions1734100000000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "auth_sessions" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "userId" uuid NOT NULL,
      "jti" varchar(64) NOT NULL,
      "tokenVersion" integer NOT NULL DEFAULT 0,
      "userAgent" varchar(200),
      "ipHash" varchar(64),
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "lastSeenAt" timestamptz NOT NULL DEFAULT now(),
      "expiresAt" timestamptz NOT NULL,
      "revokedAt" timestamptz,
      CONSTRAINT "PK_auth_sessions_id" PRIMARY KEY ("id"),
      CONSTRAINT "FK_auth_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "uq_auth_sessions_jti" ON "auth_sessions" ("jti")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "ix_auth_sessions_user_active" ON "auth_sessions" ("userId", "revokedAt", "expiresAt")`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_sessions"`);
  }
}
