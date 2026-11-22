from pathlib import Path
root=Path(__file__).parent
controller=(root/'src/auth/auth.controller.ts').read_text()
service=(root/'src/auth/otp.service.ts').read_text()
entity=(root/'src/auth/otp.entity.ts').read_text()
users=(root/'src/users/users.service.ts').read_text()
request_dto=(root/'src/auth/dto/request-contact-change.dto.ts').read_text()
confirm_dto=(root/'src/auth/dto/confirm-contact-change.dto.ts').read_text()
mobile=(root/'mobile/src/screens/PatientProfileScreen.tsx').read_text()
api=(root/'mobile/src/api/client.ts').read_text()
checks={
 'contact-change request requires authenticated account': "@Post('me/contact-change/request') @UseGuards(JwtAuthGuard)" in controller and 'user.sub,dto.contactType,dto.value' in controller,
 'contact-change confirmation requires authenticated account': "@Post('me/contact-change/confirm') @UseGuards(JwtAuthGuard)" in controller and 'user.sub,dto.contactType,dto.value,dto.code' in controller,
 'separate OTP purposes bind phone and email': "CHANGE_PHONE='change_phone'" in entity and "CHANGE_EMAIL='change_email'" in entity,
 'new email is normalized and validated': "rawValue.trim().toLowerCase()" in service and 'البريد الإلكتروني غير صالح' in service,
 'new phone is validated': 'رقم الهاتف غير صالح' in service and '7,15' in service,
 'existing identifiers are rejected before OTP': "if(await this.users.findByIdentifier(value)) throw new ConflictException" in service,
 'OTP request has expiry and resend throttling': 'expiresAt:new Date(Date.now()+this.ttl)' in service and 'TooManyRequestsException' in service,
 'OTP is bound to contact type and exact target': "contactType==='email'?OtpPurpose.CHANGE_EMAIL:OtpPurpose.CHANGE_PHONE" in service and 'target:value' in service,
 'OTP confirmation limits attempts and checks expiry': 'row.attempts>=this.maxAttempts' in service and 'expiresAt:MoreThan(new Date())' in service,
 'contact update occurs only after successful OTP': service.index('bcrypt.compare(code,row.codeHash)') < service.index('users.updateContact(userId,contactType,value)'),
 'database uniqueness conflicts are handled': "error?.code==='23505'" in service,
 'contact update service changes only requested field': "contactType==='email'?{email:value.trim().toLowerCase()}:{phone:value.trim()}" in users,
 'DTO restricts contact type': "@IsIn(['phone','email'])" in request_dto and "@IsIn(['phone','email'])" in confirm_dto,
 'DTO requires six digit OTP': "@Matches(/^[0-9]{6}$/)" in confirm_dto,
 'mobile exposes authenticated request and confirm': 'requestContactChange:' in api and 'confirmContactChange:' in api,
 'mobile allows separate phone and email selection': "setContactType('phone')" in mobile and "setContactType('email')" in mobile,
 'mobile updates display only after confirmation': 'await api.confirmContactChange' in mobile and 'load();' in mobile,
 'patient saved-beneficiary feature remains absent': 'BeneficiariesScreen' not in (root/'mobile/App.tsx').read_text() and 'patientBeneficiaries' not in api,
 'day-only booking/no-queue policy retained': 'queueStatus' not in (root/'mobile/src/screens/BookingsScreen.tsx').read_text(),
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' '+k)
print(f'\n{len(checks)-len(failed)}/{len(checks)} checks passed')
raise SystemExit(bool(failed))
