#!/usr/bin/env bash
# Brings the database schema up to date. Safe to run on every deploy.
#
#   1. Nothing pending: exits after a drift check, without touching the database.
#   2. Pending migrations: takes a pg_dump backup, then runs `prisma migrate deploy`.
#   3. Database created with `prisma db push` (no migration history, Prisma error P3005):
#      records the migrations the database already contains as applied, then deploys the rest.
#   4. A previously failed migration (P3009) or an unreachable database: stops with instructions.
#
# Afterwards the live schema must match prisma/schema.prisma exactly, otherwise it exits 1.
#
# Env: DATABASE_URL (else read from backend/.env), DB_BACKUP_DIR, DB_BACKUP_KEEP, SKIP_DB_BACKUP=1
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BACKEND_DIR"

BACKUP_DIR="${DB_BACKUP_DIR:-$HOME/backups/eightblock}"
BACKUP_KEEP="${DB_BACKUP_KEEP:-14}"

# Production ran `prisma migrate deploy` until these existed, then switched to `db push`, which
# only added what 20260928150000_article_score recreates idempotently.
LEGACY_MIGRATIONS=(
  20251208090125_wallet_auth
  20251208184729_add_view_tracking
  20251208225838_add_featured_image_to_article
  20251208230157_add_featured_image
  20251212181812_add_user_email
  20251213093743_add_bookmarks
  20251213202922_add_performance_indexes
)

log() { echo "[migrate] $*"; }
fail() {
  echo "[migrate] ERROR: $*" >&2
  exit 1
}
prisma() { npx --no-install prisma "$@"; }

database_url() {
  if [ -n "${DATABASE_URL:-}" ]; then
    printf '%s' "$DATABASE_URL"
  elif [ -f .env ]; then
    sed -n 's/^[[:space:]]*DATABASE_URL[[:space:]]*=[[:space:]]*//p' .env | tail -n 1 |
      sed -e 's/^["'\'']//' -e 's/["'\'']$//'
  fi
}

DB_URL="$(database_url)"
[ -n "$DB_URL" ] || fail "DATABASE_URL is not set (export it or add it to backend/.env)"
export DATABASE_URL="$DB_URL"

# Exit codes of `migrate diff --exit-code`: 0 = in sync, 2 = differences, 1 = error.
check_drift() {
  local code=0
  prisma migrate diff --from-schema-datasource prisma/schema.prisma \
    --to-schema-datamodel prisma/schema.prisma --exit-code >/dev/null 2>&1 || code=$?
  return "$code"
}

backup() {
  if [ "${SKIP_DB_BACKUP:-0}" = "1" ]; then
    log "SKIP_DB_BACKUP=1, not taking a backup"
    return
  fi
  command -v pg_dump >/dev/null ||
    fail "pg_dump not found. Install postgresql-client, or set SKIP_DB_BACKUP=1 to migrate without a backup"

  mkdir -p "$BACKUP_DIR"
  local file
  file="$BACKUP_DIR/eightblock-$(date +%Y%m%d-%H%M%S).dump"
  log "Backing up the database to $file"
  # pg_dump rejects Prisma-only query parameters such as ?schema=public.
  pg_dump --format=custom --no-owner --file="$file" "${DB_URL%%\?*}" ||
    fail "Backup failed; nothing was migrated"

  local old
  old=$(ls -1t "$BACKUP_DIR"/eightblock-*.dump 2>/dev/null | tail -n +"$((BACKUP_KEEP + 1))" || true)
  if [ -n "$old" ]; then
    echo "$old" | while IFS= read -r f; do rm -f -- "$f"; done
  fi
}

baseline() {
  local to_resolve=()
  if check_drift; then
    log "Database already matches schema.prisma; recording every migration as applied"
    for dir in prisma/migrations/*/; do
      to_resolve+=("$(basename "$dir")")
    done
  else
    log "Recording the ${#LEGACY_MIGRATIONS[@]} legacy migrations as applied"
    to_resolve=("${LEGACY_MIGRATIONS[@]}")
  fi

  for name in "${to_resolve[@]}"; do
    [ -d "prisma/migrations/$name" ] || fail "Missing migration folder prisma/migrations/$name"
    prisma migrate resolve --applied "$name" >/dev/null
    log "  resolved $name"
  done
}

log "Checking migration status"
status_code=0
status_output=$(prisma migrate status 2>&1) || status_code=$?

if echo "$status_output" | grep -qE "P1001|P1000|P1003|Can't reach database"; then
  echo "$status_output" >&2
  fail "Cannot connect to the database. Check DATABASE_URL and that PostgreSQL is running"
fi

if [ "$status_code" -eq 0 ]; then
  log "No pending migrations"
else
  backup

  deploy_code=0
  deploy_output=$(prisma migrate deploy 2>&1) || deploy_code=$?
  echo "$deploy_output"

  if [ "$deploy_code" -ne 0 ]; then
    if echo "$deploy_output" | grep -q "P3005"; then
      log "Database has no migration history (created with prisma db push); baselining"
      baseline
      prisma migrate deploy
    elif echo "$deploy_output" | grep -qE "P3009|P3018"; then
      failed=$(echo "$deploy_output" | sed -nE 's/.*[Mm]igration name: ([0-9A-Za-z_]+).*/\1/p; s/.*The `([0-9A-Za-z_]+)` migration.*failed.*/\1/p' | head -n 1)
      failed=${failed:-<migration>}
      fail "Migration $failed failed. PostgreSQL rolled its changes back, so fix the migration, then on the server run
  cd $BACKEND_DIR && npx prisma migrate resolve --rolled-back $failed
and deploy again. If its changes did reach the database, use --applied instead of --rolled-back.
Backups live in $BACKUP_DIR"
    else
      fail "prisma migrate deploy failed (see output above). Backups live in $BACKUP_DIR"
    fi
  fi
fi

log "Verifying the database matches prisma/schema.prisma"
drift_code=0
check_drift || drift_code=$?
if [ "$drift_code" -eq 2 ]; then
  drift_sql=$(prisma migrate diff --from-schema-datasource prisma/schema.prisma \
    --to-schema-datamodel prisma/schema.prisma --script 2>/dev/null || true)
  echo "$drift_sql" >&2
  # Only DROP statements means the database has extra objects (e.g. a hand-made index): harmless.
  if echo "$drift_sql" | grep -vE '^[[:space:]]*(--|$)' | grep -vq 'DROP'; then
    fail "Schema drift: the database is missing what the SQL above adds. Add a migration for it"
  fi
  log "WARNING: the database has objects schema.prisma does not know about (see above); continuing"
elif [ "$drift_code" -ne 0 ]; then
  fail "Could not compare the database with schema.prisma"
fi

log "Database schema is up to date"
