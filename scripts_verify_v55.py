from pathlib import Path

ROOT = Path(__file__).resolve().parent
client = (ROOT / "mobile/src/api/client.ts").read_text()
env = (ROOT / "mobile/.env.example").read_text()
checks = {
    "no implicit localhost API fallback": "?? 'http://localhost:3000/api/v1'" not in client,
    "API URL reads Expo public environment": "process.env.EXPO_PUBLIC_API_URL" in client,
    "missing URL has actionable Arabic error": "عنوان خادم طبيبي غير مضبوط" in client,
    "malformed URL is rejected": "new URL(API_BASE_URL)" in client,
    "HTTP and HTTPS are the only accepted protocols": "['http:', 'https:']" in client,
    "localhost loopback is rejected": "'localhost', '127.0.0.1', '0.0.0.0'" in client,
    "trailing slash normalization exists": ".replace(/\\/+$/, '')" in client,
    "API config checked before fetch": client.index("assertApiConfiguration();") < client.index("await fetch("),
    "emulator guidance exists": "10.0.2.2" in env,
    "physical device guidance exists": "YOUR_COMPUTER_LAN_IP" in env,
    "production HTTPS guidance exists": "Production: use your deployed HTTPS API domain" in env,
    "V55 deployment document exists": (ROOT / "docs/phase-v55-mobile-backend-connection.md").exists(),
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + " — " + label)
print(f"\n{sum(checks.values())}/{len(checks)} checks passed")
raise SystemExit(0 if all(checks.values()) else 1)
