#!/usr/bin/env python3
"""Static Android/EAS release-readiness checks for Tabibi V54."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
checks = []
def check(name, condition):
    checks.append((name, bool(condition)))

app = json.loads((ROOT / 'mobile/app.json').read_text())['expo']
mobile = json.loads((ROOT / 'mobile/package.json').read_text())
eas = json.loads((ROOT / 'mobile/eas.json').read_text())
preview = eas['build']['preview']
production = eas['build']['production']
check('Expo app name is Arabic Tabibi', app.get('name') == 'طبيبي')
check('Expo slug exists', app.get('slug') == 'tabibi')
check('App version is valid', app.get('version') == '1.0.0')
check('Android application ID preserved', app.get('android', {}).get('package') == 'iq.tabibi.app')
check('iOS bundle ID preserved', app.get('ios', {}).get('bundleIdentifier') == 'iq.tabibi.app')
check('Android versionCode is positive integer', isinstance(app.get('android', {}).get('versionCode'), int) and app['android']['versionCode'] > 0)
check('Preview profile is internal distribution', preview.get('distribution') == 'internal')
check('Preview profile produces APK', preview.get('android', {}).get('buildType') == 'apk')
check('Production profile produces AAB', production.get('android', {}).get('buildType') == 'app-bundle')
check('EAS preview script exists', mobile.get('scripts', {}).get('build:android:preview') == 'eas build --platform android --profile preview')
check('EAS production script exists', mobile.get('scripts', {}).get('build:android:production') == 'eas build --platform android --profile production')
check('Expo SecureStore plugin retained', 'expo-secure-store' in app.get('plugins', []))
check('Expo Notifications plugin retained', 'expo-notifications' in app.get('plugins', []))
check('Expo SDK 52 retained', mobile.get('dependencies', {}).get('expo') == '~52.0.0')

for name, ok in checks:
    print(('PASS' if ok else 'FAIL') + ' ' + name)
print(f'RESULT: {sum(ok for _, ok in checks)}/{len(checks)} checks passed')
raise SystemExit(0 if all(ok for _, ok in checks) else 1)
