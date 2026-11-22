-- TABIBI V101: READ-ONLY medical upload retention audit.
-- Run with a database account that has SELECT privileges only.
-- This file intentionally contains no DELETE, UPDATE, TRUNCATE, or filesystem commands.

-- 1) Private medical uploads not currently linked to a record.
-- These may be newly uploaded or intentionally detached by the patient.
-- They are review candidates only; do NOT auto-delete them.
SELECT
  a."id" AS upload_asset_id,
  a."ownerUserId" AS patient_user_id,
  a."originalName",
  a."mimeType",
  a."sizeBytes",
  a."createdAt",
  GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - a."createdAt")) / 86400))::int AS age_days
FROM "upload_assets" a
LEFT JOIN "medical_record_attachments" ma ON ma."uploadAssetId" = a."id"
WHERE a."category" = 'medical_attachment'
  AND a."isPublic" = false
  AND ma."id" IS NULL
ORDER BY a."createdAt" ASC;

-- 2) Attachments still linked to soft-deleted records.
-- These are retained for audit/history and are not doctor-downloadable.
SELECT
  a."id" AS upload_asset_id,
  a."ownerUserId" AS patient_user_id,
  ma."recordId" AS medical_record_id,
  r."deletedAt" AS record_deleted_at,
  a."createdAt" AS upload_created_at
FROM "upload_assets" a
JOIN "medical_record_attachments" ma ON ma."uploadAssetId" = a."id"
JOIN "medical_records" r ON r."id" = ma."recordId"
WHERE a."category" = 'medical_attachment'
  AND r."deletedAt" IS NOT NULL
ORDER BY r."deletedAt" ASC;

-- 3) Superseded public-profile image rows.
-- The public download guard already rejects these unless the current profile URL points to them.
-- Keep them for owner review; never bulk-delete based only on this report.
SELECT
  a."id" AS upload_asset_id,
  a."ownerUserId" AS owner_user_id,
  a."facilityId" AS facility_id,
  a."category",
  a."createdAt"
FROM "upload_assets" a
LEFT JOIN "doctor_profiles" d
  ON a."category" = 'doctor_photo'
 AND d."userId" = a."ownerUserId"
LEFT JOIN "medical_facilities" f
  ON a."category" = 'facility_image'
 AND f.id = a."facilityId"
WHERE a."isPublic" = true
  AND (
    (a."category" = 'doctor_photo' AND (d."photoUrl" IS DISTINCT FROM '/api/v1/uploads/public/' || a."id"::text))
    OR
    (a."category" = 'facility_image' AND (f."imageUrl" IS DISTINCT FROM '/api/v1/uploads/public/' || a."id"::text))
  )
ORDER BY a."createdAt" ASC;
