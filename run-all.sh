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

if [ ! -f "apps/web/.env" ] && [ -f "apps/web/.env.example" ]; then
  cp "apps/web/.env.example" "apps/web/.env"
fi

ensure_platform_dependencies

echo "Starting Pump web and API"
(
  url="http://localhost:3000"
  for _ in {1..120}; do
    if command -v curl >/dev/null 2>&1 && curl -fsS "$url" >/dev/null 2>&1; then
      if command -v open >/dev/null 2>&1; then
        open "$url" >/dev/null 2>&1 || true
      elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$url" >/dev/null 2>&1 || true
      fi
      break
    fi
    sleep 0.5
  done
) &
npm run dev
