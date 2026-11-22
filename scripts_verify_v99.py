from pathlib import Path
root=Path(__file__).resolve().parent
s=(root/'src/uploads/uploads.service.ts').read_text()
d=(root/'src/uploads/dto/create-upload.dto.ts').read_text()
checks={
 'base64 type is checked before decode': "typeof dto.base64 !== 'string'" in s,
 'encoded size capped before decode': 'const maxBase64Length = 4 * Math.ceil(maxBytes / 3)' in s and 'dto.base64.length > maxBase64Length' in s,
 'base64 alphabet and padding strictly validated': "A-Za-z0-9+/" in s and 'dto.base64.length % 4 !== 0' in s,
 'decoded bytes must round-trip to canonical base64': "buffer.toString('base64') !== dto.base64" in s,
 'decoded byte size remains enforced': 'buffer.length > maxBytes' in s,
 'DTO retains encoded payload upper bound': '@IsBase64() @MaxLength(14 * 1024 * 1024) base64: string' in d,
 'file signature validation remains active': 'matchesSignature(buffer, dto.mimeType)' in s,
}
for name,ok in checks.items(): print(('PASS' if ok else 'FAIL')+' | '+name)
print(f'RESULT: {sum(checks.values())}/{len(checks)}')
raise SystemExit(0 if all(checks.values()) else 1)
