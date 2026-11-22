#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
command -v node >/dev/null 2>&1 || { echo 'Node.js is required.' >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo 'npm is required.' >&2; exit 1; }

node -e "const major=Number(process.versions.node.split('.')[0]); if (major < 20) { console.error('Node.js 20 or newer is required.'); process.exit(1); }"

install_and_build() {
  local dir="$1"
  local label="$2"
  printf '\n== %s: lockfile and dependency install ==\n' "$label"
  if [[ ! -f "${dir}/package-lock.json" ]]; then
    (cd "$dir" && npm install --package-lock-only --ignore-scripts --no-audit --no-fund)
  fi
  (cd "$dir" && npm ci --no-audit --no-fund)
}

install_and_build "$ROOT" 'Backend'
printf '\n== Backend TypeScript/Nest build ==\n'
(cd "$ROOT" && npm run build)

install_and_build "$ROOT/mobile" 'Mobile'
printf '\n== Mobile TypeScript check ==\n'
(cd "$ROOT/mobile" && npm run typecheck)
printf '\n== Expo configuration validation ==\n'
(cd "$ROOT/mobile" && npx expo config --type public >/dev/null)

if [[ -n "${EXPO_PUBLIC_API_URL:-}" ]]; then
  printf '\n== Android preview configuration ==\n'
  (cd "$ROOT/mobile" && npm run check:build-config)
else
  printf '\nWARNING: EXPO_PUBLIC_API_URL is not set. Dependency builds passed, but device connectivity and EAS APK generation are not validated.\n'
fi

printf '\nTABIBI dependency-backed backend build and mobile typecheck completed.\n'
printf 'This script does not deploy PostgreSQL/API or create an APK. EAS credentials and a reachable HTTPS API are still required.\n'
