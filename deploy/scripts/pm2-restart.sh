#!/usr/bin/env bash
# Restart the Raqi API under PM2. Run on the VPS from the repo deploy folder or DEPLOY_ROOT.
set -euo pipefail

ROOT="${DEPLOY_ROOT:-/var/www/raqi}"
cd "$ROOT"

mkdir -p logs uploads/deposits api

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from template — update JWT_SECRET before production use."
fi

if command -v docker >/dev/null 2>&1; then
  docker compose up -d mongo
fi

pm2 stop raqi-api 2>/dev/null || true

cd api
npm ci --omit=dev
node scripts/verify-production-deps.js
cd "$ROOT"

pm2 delete wassetpay-api 2>/dev/null || true
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

cd api
node --env-file=../.env dist/scripts/seed-admin.js
cd "$ROOT"

echo "PM2 status:"
pm2 status raqi-api

echo "Health check:"
curl -fsS "http://127.0.0.1:${PORT:-3000}/api/v1/health" || true
