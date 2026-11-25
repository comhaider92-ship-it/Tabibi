from pathlib import Path
import json, re
root=Path(__file__).parent
app=(root/'src/app.module.ts').read_text()
main=(root/'src/main.ts').read_text()
docker=(root/'Dockerfile').read_text()
compose=(root/'compose.yaml').read_text()
checks=[]
def check(name, ok):
    checks.append((name,bool(ok)))
    print(('PASS' if ok else 'FAIL')+' - '+name)
check('JWT secret minimum length and placeholder rejection retained', 'secret.length < 32' in app and 'replace_with_a_long_random_secret_at_least_32_chars' in app)
check('PORT is validated as an integer in valid TCP range', 'Number.isInteger(port)' in app and 'port > 65535' in app)
check('NODE_ENV is restricted to supported modes', "['development', 'test', 'production']" in app)
check('production requires explicit database host, user, name, and password', "['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME', 'DATABASE_PASSWORD']" in app)
check('production database password minimum is enforced', 'databasePassword.length < 16' in app and 'databasePassword)' in app)
check('production database port is validated', 'DATABASE_PORT must be an integer between 1 and 65535' in app)
check('production rejects placeholder public API domains', 'example\\.com|YOUR_|CHANGE_ME' in app)
check('production upload directory must be absolute', "!uploadsDirectory.startsWith('/')" in app)
check('production public API URL must use HTTPS and /api/v1', "publicApi.protocol !== 'https:'" in app and "endsWith('/api/v1')" in app)
check('container server binds to all interfaces', "app.listen(port, '0.0.0.0')" in main)
check('graceful shutdown hooks are enabled', 'app.enableShutdownHooks()' in main)
check('Docker build requires explicit package lockfile', 'COPY package.json package-lock.json ./' in docker)
check('Docker uses npm ci instead of npm install', 'npm ci --include=dev' in docker and 'npm install' not in docker)
check('runtime image includes migration source and TypeScript config', 'COPY --chown=node:node src ./src' in docker and 'COPY --chown=node:node tsconfig.json ./tsconfig.json' in docker)
check('runtime image runs as non-root node user', 'USER node' in docker)
check('Compose keeps database port private and API host binding local', '127.0.0.1:${API_PORT:-3000}:3000' in compose and '5432:5432' not in compose)
for f in ['package.json','mobile/package.json']:
    data=json.loads((root/f).read_text())
    check(f'{f} declares Node.js >=20', data.get('engines',{}).get('node')=='>=20')
print(f'RESULT: {sum(ok for _,ok in checks)}/{len(checks)} checks passed')
raise SystemExit(0 if all(ok for _,ok in checks) else 1)
