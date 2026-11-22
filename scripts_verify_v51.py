from pathlib import Path
root=Path(__file__).parent
checks={
 'upload asset entity exists':('src/uploads/upload-asset.entity.ts','class UploadAsset'),
 'upload categories include doctor and facility assets':('src/uploads/upload-asset.entity.ts','FACILITY_DOCUMENT'),
 'upload dto validates base64':('src/uploads/dto/create-upload.dto.ts','IsBase64'),
 'upload service validates image signatures':('src/uploads/uploads.service.ts','matchesSignature'),
 'upload service limits image size':('src/uploads/uploads.service.ts','5 * 1024 * 1024'),
 'upload service limits document size':('src/uploads/uploads.service.ts','10 * 1024 * 1024'),
 'upload storage uses restrictive file permissions':('src/uploads/uploads.service.ts','mode: 0o600'),
 'storage key is generated rather than user supplied':('src/uploads/uploads.service.ts','randomUUID()'),
 'doctor photo updates profile':('src/uploads/uploads.service.ts','photoUrl: url'),
 'facility image updates facility profile':('src/uploads/uploads.service.ts','imageUrl: url'),
 'public files require approved provider':('src/uploads/uploads.service.ts','isPubliclyApproved'),
 'owner review queue is limited to pending document reviews':('src/uploads/uploads.service.ts','ownerReviewQueue'),
 'owner review queue is owner-only':('src/uploads/uploads.controller.ts','@Roles(UserRole.OWNER)'),
 'private documents require authorization':('src/uploads/uploads.service.ts','isPendingReviewAsset'),
 'facility ownership is checked':('src/uploads/uploads.service.ts','ownerUserId: userId'),
 'upload endpoints are registered':('src/uploads/uploads.controller.ts','@Post()'),
 'upload module registers repositories':('src/uploads/uploads.module.ts','UploadAsset, MedicalFacility, DoctorProfile'),
 'runtime registers upload entity and module':('src/app.module.ts','UploadsModule'),
 'migration datasource registers upload entity':('src/database/data-source.ts','UploadAsset'),
 'migration creates asset table':('src/database/migrations/1733400000000-CreateSecureUploadAssets.ts','CREATE TABLE "upload_assets"'),
 'migration adds facility image field':('src/database/migrations/1733400000000-CreateSecureUploadAssets.ts','ADD COLUMN "imageUrl"'),
 'mobile API exposes upload':('mobile/src/api/client.ts','uploadAsset:'),
 'mobile API lists own uploads':('mobile/src/api/client.ts','myUploadedAssets:'),
 'documentation exists':('docs/phase-v51-secure-uploads.md','شغّل Migration'),
}
missing=[]
for label,(rel,needle) in checks.items():
 p=root/rel
 if not p.exists() or needle not in p.read_text(errors='ignore'): missing.append(label)
print(f"V51: {len(checks)-len(missing)}/{len(checks)} checks passed")
for x in missing: print('FAIL:',x)
raise SystemExit(1 if missing else 0)
