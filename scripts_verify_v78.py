from pathlib import Path
root=Path(__file__).parent
service=(root/'src/uploads/uploads.service.ts').read_text()
controller=(root/'src/uploads/uploads.controller.ts').read_text()
entity=(root/'src/uploads/upload-asset.entity.ts').read_text()
dto=(root/'src/uploads/dto/create-upload.dto.ts').read_text()
checks={
 'Public endpoint rejects non-public assets':'publicOnly && !asset.isPublic' in service,
 'Public endpoint requires currently approved asset':'publicOnly && !(await this.isPubliclyApproved(asset))' in service,
 'Doctor photo must belong to approved doctor':'doctor?.status === DoctorProfileStatus.APPROVED' in service,
 'Doctor photo must be the currently selected image':'doctor.photoUrl === expectedUrl' in service,
 'Facility image must belong to approved facility':'facility?.status === FacilityStatus.APPROVED' in service,
 'Facility image must be the currently selected image':'facility.imageUrl === expectedUrl' in service,
 'Public access is limited to public image categories':'asset.category === UploadCategory.DOCTOR_PHOTO' in service and 'asset.category === UploadCategory.FACILITY_IMAGE' in service,
 'Public files are not cached by browsers':'@Header(\'Cache-Control\', \'private, no-store, max-age=0\')' in controller,
 'Authenticated download endpoint remains protected':'@UseGuards(JwtAuthGuard)' in controller and "@Get(':id/download')" in controller,
 'Owner review queue remains owner-only':'@Roles(UserRole.OWNER)' in controller and "@Get('owner/review-queue')" in controller,
 'File path traversal check remains':'!path.startsWith(`${this.root}${sep}`)' in service,
 'File signature validation remains enabled':'matchesSignature(buffer, dto.mimeType)' in service,
 'Image and document size limits remain enforced':'5 * 1024 * 1024' in service and '10 * 1024 * 1024' in service,
 'Upload categories remain explicit':'DOCTOR_QUALIFICATION' in entity and 'FACILITY_DOCUMENT' in entity,
 'Upload DTO validates base64 payload':'@IsBase64()' in dto,
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' '+name)
print(f'RESULT {sum(checks.values())}/{len(checks)}')
raise SystemExit(0 if all(checks.values()) else 1)
