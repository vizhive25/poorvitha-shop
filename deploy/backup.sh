#!/usr/bin/env bash
# VPS only: daily backup of the MySQL database (orders, products, staff AND uploaded photos live in it). Keeps 14 days.
# On managed hosting (Hostinger Node.js web app) use hPanel backups + phpMyAdmin → Export instead.
# Install:  chmod +x /var/www/poorvitha/deploy/backup.sh && crontab -e
#           30 2 * * * /var/www/poorvitha/deploy/backup.sh >> /var/log/poorvitha-backup.log 2>&1
# Needs ~/.my.cnf for the backup user (so no password appears in this file):
#   [client]
#   user=DBUSER
#   password=DBPASSWORD
# Then copy /var/backups/poorvitha OFF this server regularly.
set -euo pipefail
DBNAME=${DBNAME:-poorvitha}
OUT=/var/backups/poorvitha
mkdir -p "$OUT"
mysqldump --single-transaction --quick --routines "$DBNAME" | gzip > "$OUT/shop-$(date +%F).sql.gz"
find "$OUT" -type f -mtime +14 -delete
echo "$(date -Is) backup ok"
