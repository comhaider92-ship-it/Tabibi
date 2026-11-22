from pathlib import Path

ROOT = Path(__file__).resolve().parent

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

checks = []
def check(name, condition):
    checks.append((name, bool(condition)))

register = read('src/auth/dto/register.dto.ts')
auth = read('src/auth/auth.service.ts')
jwt = read('src/auth/jwt-auth.guard.ts')
roles = read('src/auth/roles.guard.ts')
medical_controller = read('src/medical-records/medical-records.controller.ts')
medical = read('src/medical-records/medical-records.service.ts')
uploads_controller = read('src/uploads/uploads.controller.ts')
uploads = read('src/uploads/uploads.service.ts')
appointments_controller = read('src/appointments/appointments.controller.ts')
appointments = read('src/appointments/appointments.service.ts')
owner_ads = read('src/ads/ads.controller.ts')

check('Public registration DTO only permits patient role', "@IsIn(['patient']) role:'patient'" in register)
check('Registration service assigns patient role server-side', 'role:UserRole.PATIENT' in auth)
check('JWT guard rejects inactive accounts', '!user||!user.isActive' in jwt)
check('JWT guard checks token version', 'payload.tokenVersion' in jwt and 'session.tokenVersion' in jwt)
check('JWT guard requires a live non-revoked session', 'revokedAt:IsNull()' in jwt and 'session.expiresAt<=new Date()' in jwt)
check('Role guard enforces declared role metadata', 'roles.includes(user.role)' in roles)
check('Medical-record controller applies authentication and role guard globally', '@UseGuards(JwtAuthGuard, RolesGuard)' in medical_controller)
check('Patient medical-record list is scoped to authenticated patient ID', "patientUserId: actor.sub, deletedAt: IsNull()" in medical)
check('Doctor medical-record list requires own appointment relationship', "where: { id: appointmentId, doctorId: actor.sub }" in medical)
check('Doctor structured-record access requires approval', "status: DoctorProfileStatus.APPROVED" in medical and 'if (!appointmentAccess && !consent)' in medical)
check('Owner is explicitly denied structured medical records', "actor.role === UserRole.OWNER" in medical and 'المالك لا يملك صلاحية السجلات الطبية' in medical)
check('Private upload download requires authentication', "@UseGuards(JwtAuthGuard)\n  async download" in uploads_controller)
check('Public upload route only serves currently approved selected profile images', 'isPubliclyApproved(asset)' in uploads and 'doctor.photoUrl === expectedUrl' in uploads and 'facility.imageUrl === expectedUrl' in uploads)
check('Medical attachment download requires patient consent with allowDownload', 'c.allowDownload = true' in uploads and 'موافقة المريض لا تسمح بتنزيل هذا المرفق' in uploads)
check('Patient appointment listing is scoped to booking owner or beneficiary', '(a."bookedByUserId" = :userId OR a."beneficiaryId" = :userId)' in appointments)
check('Doctor appointment listing is scoped to own doctor ID', 'a."doctorId" = :userId' in appointments)
check('Appointment detail rejects unrelated users', 'ليس لديك صلاحية الاطلاع على هذا الحجز' in appointments)
check('Owner advertisement management is guarded and owner-only', "@Controller('owner/ads') @UseGuards(JwtAuthGuard,RolesGuard) @Roles(UserRole.OWNER)" in owner_ads)

for name, ok in checks:
    print(f"{'PASS' if ok else 'FAIL'}: {name}")
print(f"\nV102 authorization regression checks: {sum(ok for _, ok in checks)}/{len(checks)} passed")
raise SystemExit(0 if all(ok for _, ok in checks) else 1)
