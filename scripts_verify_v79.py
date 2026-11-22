from pathlib import Path
root=Path(__file__).parent
uploads=(root/'src/uploads/uploads.service.ts').read_text()
doctors=(root/'src/doctors/doctors.service.ts').read_text()
module=(root/'src/doctors/doctors.module.ts').read_text()
controller=(root/'src/uploads/uploads.controller.ts').read_text()
checks={
 'Authenticated download still requires JWT':'@UseGuards(JwtAuthGuard)' in controller and "@Get(':id/download')" in controller,
 'Doctor-owned uploads require doctor role':'doctorOwnedCategory && role === \'doctor\'' in uploads,
 'Facility-owned uploads require owner role':'facilityOwnedCategory && role === \'owner\'' in uploads,
 'Patient cannot download another user asset':'if (!ownsAsset && (role !== \'owner\' || !(await this.isPendingReviewAsset(asset))))' in uploads,
 'Owner cross-account access remains limited to pending review':'role !== \'owner\' || !(await this.isPendingReviewAsset(asset))' in uploads,
 'Doctor profile rejects external photo URLs':'يجب اختيار صورة الطبيب من الملفات المرفوعة داخل التطبيق' in doctors,
 'Doctor photo asset must belong to same user':'id: match[1], ownerUserId: userId' in doctors,
 'Doctor photo must have correct category':'category: UploadCategory.DOCTOR_PHOTO' in doctors,
 'Doctor photo must be marked public':'isPublic: true' in doctors,
 'Legacy external photo URLs are sanitized':'if (!currentAsset) profile.photoUrl = null' in doctors,
 'UploadAsset repository is registered for doctor module':'UploadAsset' in module and 'TypeOrmModule.forFeature([DoctorProfile, DoctorRating, OwnerAuditLog, UploadAsset])' in module,
 'Public approved image checks remain in place':'isPubliclyApproved(asset)' in uploads,
 'Private cache policy remains':'@Header(\'Cache-Control\', \'private, no-store, max-age=0\')' in controller,
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' '+name)
print(f'RESULT {sum(checks.values())}/{len(checks)}')
raise SystemExit(0 if all(checks.values()) else 1)
