from pathlib import Path
root=Path(__file__).parent
checks={
 'uploads controller imports ParseUUIDPipe':('src/uploads/uploads.controller.ts','ParseUUIDPipe'),
 'public upload response has nosniff':('src/uploads/uploads.controller.ts',"@Header('X-Content-Type-Options', 'nosniff')"),
 'private download response has no-store':('src/uploads/uploads.controller.ts',"private, no-store, max-age=0"),
 'public image cache is short lived':('src/uploads/uploads.controller.ts',"public, max-age=300"),
 'private file download remains authenticated':('src/uploads/uploads.controller.ts',"@Get(':id/download')\n  @Header('X-Content-Type-Options', 'nosniff')\n  @Header('Cache-Control', 'private, no-store, max-age=0')\n  @UseGuards(JwtAuthGuard)"),
 'public image route still calls approval gate':('src/uploads/uploads.controller.ts','getFile(id, \'\', \'\', true)'),
 'empty file names rejected':('src/uploads/dto/create-upload.dto.ts','IsNotEmpty()'),
 'base64 request size bounded':('src/uploads/dto/create-upload.dto.ts','MaxLength(14 * 1024 * 1024) base64'),
 'doctor uploads reject facility injection':('src/uploads/uploads.service.ts','لا يمكن ربط وثائق الطبيب بمنشأة'),
 'facility upload ownership retained':('src/uploads/uploads.service.ts','ownerUserId: userId'),
 'decoded image size still limited':('src/uploads/uploads.service.ts','5 * 1024 * 1024'),
 'decoded document size still limited':('src/uploads/uploads.service.ts','10 * 1024 * 1024'),
 'file signatures still validated':('src/uploads/uploads.service.ts','matchesSignature(buffer, dto.mimeType)'),
 'storage key remains random':('src/uploads/uploads.service.ts','randomUUID()'),
 'private storage permissions retained':('src/uploads/uploads.service.ts','mode: 0o600'),
 'JWT secret startup validation added':('src/app.module.ts','JWT_SECRET must be a unique random value'),
 'JWT minimum length enforced':('src/app.module.ts','secret.length < 32'),
 'JWT secret sample documented':('.env.example','JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars'),
 'security phase documentation exists':('docs/phase-v52-security-and-privacy-hardening.md','production-grade distributed rate limiter'),
 'uploads migration remains registered':('src/database/data-source.ts','UploadAsset'),
 'owner report access remains role limited':('src/messages/messages.controller.ts','@Patch(\'owner/reports/:id\') @Roles(UserRole.OWNER)'),
 'booking message routes remain role limited':('src/messages/messages.controller.ts','@Roles(UserRole.PATIENT,UserRole.DOCTOR)'),
}
failed=[]
for label,(rel,needle) in checks.items():
 p=root/rel
 content=p.read_text(errors='ignore') if p.exists() else ''
 if needle not in content: failed.append(label)
controller=(root/'src/uploads/uploads.controller.ts').read_text()
if 'import { Request' in controller or "from 'express'" in controller: failed.append('unused Express request import removed')
print(f"V52: {len(checks)+1-len(failed)}/{len(checks)+1} checks passed")
for item in failed: print('FAIL:',item)
raise SystemExit(1 if failed else 0)
