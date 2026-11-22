from pathlib import Path
import json, subprocess, os
root = Path(__file__).parent
mobile = root / 'mobile'
pkg = json.loads((mobile / 'package.json').read_text())
eas = json.loads((mobile / 'eas.json').read_text())
app = json.loads((mobile / 'app.json').read_text())['expo']
script = mobile / 'scripts' / 'check-build-config.mjs'
checks = []
def check(name, condition):
    checks.append((name, bool(condition)))
check('build config validator exists', script.exists())
check('preview checked build command is wired', 'build:android:preview:checked' in pkg['scripts'])
check('production checked build command is wired', 'build:android:production:checked' in pkg['scripts'])
check('preview EAS artifact is APK', eas['build']['preview']['android']['buildType'] == 'apk')
check('production EAS artifact is app bundle', eas['build']['production']['android']['buildType'] == 'app-bundle')
check('Android application identifier exists', bool(app.get('android', {}).get('package')))
env = os.environ.copy(); env.pop('EXPO_PUBLIC_API_URL', None)
r = subprocess.run(['node', str(script), 'preview'], cwd=mobile, env=env, capture_output=True, text=True)
check('missing API URL is rejected', r.returncode != 0 and 'EXPO_PUBLIC_API_URL is missing' in r.stderr)
env['EXPO_PUBLIC_API_URL'] = 'http://10.0.2.2:3000/api/v1'
r = subprocess.run(['node', str(script), 'preview'], cwd=mobile, env=env, capture_output=True, text=True)
check('emulator-only host is rejected for phone build', r.returncode != 0 and 'not reachable from a physical phone' in r.stderr)
env['EXPO_PUBLIC_API_URL'] = 'https://api.tabibi.invalid/api/v1'
r = subprocess.run(['node', str(script), 'preview'], cwd=mobile, env=env, capture_output=True, text=True)
check('valid HTTPS preview API config is accepted', r.returncode == 0)
r = subprocess.run(['node', str(script), 'production'], cwd=mobile, env=env, capture_output=True, text=True)
check('valid HTTPS production API config is accepted', r.returncode == 0)
env['EXPO_PUBLIC_API_URL'] = 'http://api.tabibi.invalid/api/v1'
r = subprocess.run(['node', str(script), 'production'], cwd=mobile, env=env, capture_output=True, text=True)
check('production HTTP is rejected', r.returncode != 0 and 'require HTTPS' in r.stderr)
for name, ok in checks:
    print(('PASS' if ok else 'FAIL') + ' | ' + name)
print(f'RESULT: {sum(ok for _,ok in checks)}/{len(checks)}')
raise SystemExit(0 if all(ok for _,ok in checks) else 1)
