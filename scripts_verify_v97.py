from pathlib import Path

root = Path(__file__).resolve().parent
source = (root / "src/medical-records/medical-records.service.ts").read_text()
doc = (root / "DEPLOYMENT.md").read_text()
checks = {
    "both QR generators use the validated URL helper": source.count("this.getPublicApiBaseUrl()") == 2,
    "localhost fallback is removed": "http://localhost:3000/api/v1" not in source,
    "missing public URL is rejected": "PUBLIC_API_BASE_URL must be configured" in source,
    "production requires HTTPS": "process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:'" in source,
    "local-only hosts are rejected": "parsed.hostname.endsWith('.local')" in source,
    "API path is validated": "endsWith('/api/v1')" in source,
    "deployment requirements are documented": "refuses to generate prescription or clinical-report verification QR codes" in doc,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + " | " + label)
print(f"RESULT: {sum(checks.values())}/{len(checks)}")
raise SystemExit(0 if all(checks.values()) else 1)
