#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ensure_platform_dependencies() {
  if [ ! -f "package-lock.json" ]; then
    return
  fi

  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies with npm ci..."
    npm ci
    return
  fi

  if command -v node >/dev/null 2>&1; then
    if ! node -e "const pkg='@esbuild/'+process.platform+'-'+process.arch;try{require.resolve(pkg);process.exit(0);}catch{process.exit(1);}"; then
      echo "Detected node_modules from another platform. Reinstalling dependencies for current platform..."
      rm -rf "node_modules"
      npm ci
    fi
  fi
}

if [ ! -f "apps/api/.env" ] && [ -f "apps/api/.env.example" ]; then
  cp "apps/api/.env.example" "apps/api/.env"
fi

ensure_platform_dependencies

echo "Starting Pump API on http://localhost:4000"
npm run dev:api
