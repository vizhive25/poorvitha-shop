#!/usr/bin/env bash
# VPS only: deploy a new version after you have pulled the new code into /var/www/poorvitha
set -euo pipefail
cd /var/www/poorvitha
npm ci
npx prisma migrate deploy      # applies any new database changes (never deletes data)
npm run build
pm2 reload poorvitha-shop --update-env
curl -fsS http://127.0.0.1:3000/api/health && echo " <- healthy"
