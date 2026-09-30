#!/usr/bin/env bash
# Production deploy for the VPS. Run from the repository root once the release is checked out
# (the GitHub deploy workflow does the checkout, then calls this script).
#
#   ./deploy.sh            install, build, migrate, switch over without downtime, verify
#   ./deploy.sh rollback   switch back to the previous build
#
# The live site keeps serving the old build until the new one is built, has booted successfully
# on spare ports, and the database is migrated. If the new build then fails its health check,
# the previous build is restored.
#
# Server-side config it expects (not in git):
#   backend/.env                   see .env.example (backend section)
#   frontend/.env.production       NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_ADMIN_URL
#   admin/.env.production          the same three variables (all read at build time)
#
# Optional env: FRONTEND_PORT (3006), ADMIN_PORT (3007), HEALTH_TIMEOUT (90s), PM2_BIN (pm2), plus DB_BACKUP_DIR,
# DB_BACKUP_KEEP and SKIP_DB_BACKUP for backend/scripts/migrate.sh.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
ADMIN="$ROOT/admin"
export FRONTEND_PORT="${FRONTEND_PORT:-3006}"
export ADMIN_PORT="${ADMIN_PORT:-3007}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-90}"
read -r -a PM2 <<<"${PM2_BIN:-pm2}"
export CI=true
cd "$ROOT"

CURRENT_STEP="starting"
STARTED_AT=$(date +%s)
mkdir -p "$ROOT/logs"

step() {
  CURRENT_STEP="$*"
  printf '\n==> %s\n' "$*"
}
log() { printf '    %s\n' "$*"; }
REPORTED=""
fail() {
  printf '\n!! %s\n' "$*" >&2
  record "failed: $CURRENT_STEP"
  REPORTED=1
  exit 1
}
record() {
  printf '%s  %s  %s  (%ss)\n' "$(date '+%Y-%m-%d %H:%M:%S')" \
    "$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)" "$1" \
    "$(($(date +%s) - STARTED_AT))" >>"$ROOT/logs/deploy.log"
}

# Reads KEY from a dotenv file, without evaluating it.
env_value() {
  [ -f "$1" ] || return 0
  sed -n "s/^[[:space:]]*$2[[:space:]]*=[[:space:]]*//p" "$1" | tail -n 1 |
    sed -e 's/^["'\'']//' -e 's/["'\'']$//'
}

# next_env DIR KEY: same precedence as `next build`: process env, .env.production.local,
# .env.local, .env.production, .env
next_env() {
  local dir=$1 key=$2 file value
  if [ -n "${!key:-}" ]; then
    printf '%s' "${!key}"
    return
  fi
  for file in .env.production.local .env.local .env.production .env; do
    value="$(env_value "$dir/$file" "$key")"
    if [ -n "$value" ]; then
      printf '%s' "$value"
      return
    fi
  done
}

BACKEND_PORT="$(env_value "$BACKEND/.env" PORT)"
BACKEND_PORT="${BACKEND_PORT:-5000}"

# Moves the staged build into place, keeping the current one as the rollback target.
activate() {
  local live=$1 staged=$2 prev=$3
  rm -rf "$prev"
  if [ -d "$live" ]; then mv "$live" "$prev"; fi
  mv "$staged" "$live"
}

# Swaps the live and previous builds, so running it twice returns to where it started.
swap_back() {
  local live=$1 prev=$2
  [ -d "$prev" ] || return 1
  rm -rf "$live.swap"
  if [ -d "$live" ]; then mv "$live" "$live.swap"; fi
  mv "$prev" "$live"
  if [ -d "$live.swap" ]; then mv "$live.swap" "$prev"; fi
}

# PM2 reload cannot change an app's script, args or exec mode; recreate apps whose config moved.
recreate_stale_apps() {
  local stale
  stale=$("${PM2[@]}" jlist 2>/dev/null | node -e '
    const fs = require("fs");
    const path = require("path");
    const real = (p) => { try { return fs.realpathSync(p); } catch { return p; } };
    const apps = require(process.argv[1]).apps;
    let running = [];
    try { running = JSON.parse(require("fs").readFileSync(0, "utf8")); } catch {}
    const stale = new Set();
    for (const proc of running) {
      const app = apps.find((a) => a.name === proc.name);
      if (!app) continue;
      const env = proc.pm2_env || {};
      const args = typeof app.args === "string" ? app.args.split(/\s+/) : app.args || [];
      if (
        real(env.pm_exec_path || "") !== real(path.resolve(app.cwd, app.script)) ||
        env.exec_mode !== (app.exec_mode === "cluster" ? "cluster_mode" : "fork_mode") ||
        JSON.stringify(env.args || []) !== JSON.stringify(args)
      ) stale.add(proc.name);
    }
    console.log([...stale].join(" "));
  ' "$ROOT/ecosystem.config.js")
  for app in $stale; do
    log "Recreating $app (its PM2 definition changed)"
    "${PM2[@]}" delete "$app" >/dev/null
  done
}

reload_services() {
  recreate_stale_apps
  "${PM2[@]}" startOrReload "$ROOT/ecosystem.config.js" --update-env || return 1
  "${PM2[@]}" save >/dev/null 2>&1 || true
}

# wait_for NAME URL [PID]: polls URL until it answers 2xx; gives up early if PID exits.
wait_for() {
  local name=$1 url=$2 pid=${3:-} deadline=$(($(date +%s) + HEALTH_TIMEOUT))
  until curl -fs -o /dev/null --max-time 10 "$url"; do
    if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
      log "$name exited before becoming healthy"
      return 1
    fi
    if [ "$(date +%s)" -ge "$deadline" ]; then
      log "$name did not become healthy at $url within ${HEALTH_TIMEOUT}s"
      return 1
    fi
    sleep 2
  done
  log "$name healthy ($url)"
}

free_port() {
  node -e 'const s = require("net").createServer().listen(0, "127.0.0.1", () => { console.log(s.address().port); s.close(); })'
}

SMOKE_API_PID=""
SMOKE_SITE_PID=""
SMOKE_ADMIN_PID=""
stop_smoke() {
  local pid
  for pid in $SMOKE_API_PID $SMOKE_SITE_PID $SMOKE_ADMIN_PID; do
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  done
  SMOKE_API_PID=""
  SMOKE_SITE_PID=""
  SMOKE_ADMIN_PID=""
}

# Reports any failure not already explained by fail() (set -e exits, including in subshells).
on_exit() {
  local status=$?
  stop_smoke
  if [ "$status" -ne 0 ] && [ -z "$REPORTED" ]; then
    printf '\n!! Deploy stopped during: %s (the live site is unchanged unless noted above)\n' "$CURRENT_STEP" >&2
    record "failed: $CURRENT_STEP"
  fi
}
trap on_exit EXIT

# Boots the staged builds on spare ports, next to the live ones. PM2 replaces the old instances
# during a reload even when the new ones never come up, so a broken release must be caught here.
smoke_test() {
  local api_port site_port admin_port
  api_port=$(free_port)
  site_port=$(free_port)
  while [ "$site_port" = "$api_port" ]; do site_port=$(free_port); done
  admin_port=$(free_port)
  while [ "$admin_port" = "$api_port" ] || [ "$admin_port" = "$site_port" ]; do admin_port=$(free_port); done

  (cd "$BACKEND" && exec env NODE_ENV=production PORT="$api_port" DISABLE_JOBS=1 node dist-build/server.js) \
    >"$ROOT/logs/smoke-backend.log" 2>&1 &
  SMOKE_API_PID=$!
  (cd "$FRONTEND" && exec env NODE_ENV=production NEXT_DIST_DIR=.next-build node node_modules/next/dist/bin/next start -p "$site_port") \
    >"$ROOT/logs/smoke-frontend.log" 2>&1 &
  SMOKE_SITE_PID=$!
  (cd "$ADMIN" && exec env NODE_ENV=production NEXT_DIST_DIR=.next-build node node_modules/next/dist/bin/next start -p "$admin_port") \
    >"$ROOT/logs/smoke-admin.log" 2>&1 &
  SMOKE_ADMIN_PID=$!

  if wait_for "New API" "http://127.0.0.1:$api_port/readyz" "$SMOKE_API_PID" &&
    wait_for "New site" "http://127.0.0.1:$site_port/" "$SMOKE_SITE_PID" &&
    wait_for "New admin" "http://127.0.0.1:$admin_port/login" "$SMOKE_ADMIN_PID"; then
    stop_smoke
    return 0
  fi
  stop_smoke
  tail -n 30 "$ROOT/logs/smoke-backend.log" "$ROOT/logs/smoke-frontend.log" "$ROOT/logs/smoke-admin.log" >&2 || true
  return 1
}

healthy() {
  wait_for "API" "http://127.0.0.1:$BACKEND_PORT/readyz" &&
    wait_for "Site" "http://127.0.0.1:$FRONTEND_PORT/" &&
    wait_for "Admin" "http://127.0.0.1:$ADMIN_PORT/login"
}

show_logs() {
  local app
  for app in eightblock-backend eightblock-frontend eightblock-admin; do
    "${PM2[@]}" logs --nostream --lines 40 "$app" 2>/dev/null || true
  done
}

rollback() {
  step "Rolling back to the previous build"
  swap_back "$BACKEND/dist" "$BACKEND/dist-prev" || fail "No previous backend build to roll back to"
  swap_back "$FRONTEND/.next" "$FRONTEND/.next-prev" || fail "No previous frontend build to roll back to"
  # The admin app is newer than the other two, so the first release with it has nothing to go back to.
  swap_back "$ADMIN/.next" "$ADMIN/.next-prev" || log "No previous admin build; keeping the current one"
  if reload_services && healthy; then
    log "Previous build is live again"
    log "Database migrations are not reverted; backups are in ${DB_BACKUP_DIR:-\$HOME/backups/eightblock}"
  else
    show_logs
    fail "The previous build is not healthy either; check the logs above"
  fi
}

if [ "${1:-}" = "rollback" ]; then
  rollback
  record "rolled back"
  exit 0
fi

step "Preflight"
for cmd in node curl git; do
  command -v "$cmd" >/dev/null || fail "$cmd is not installed"
done
command -v pnpm >/dev/null || fail "pnpm is not installed (corepack enable, or npm i -g pnpm@9)"
"${PM2[@]}" --version >/dev/null 2>&1 || fail "pm2 is not installed (npm i -g pm2)"
node -e 'const [a, b] = process.versions.node.split(".").map(Number); process.exit(a > 20 || (a === 20 && b >= 9) ? 0 : 1)' ||
  fail "Node.js >= 20.9 is required, found $(node -v)"
[ -f "$BACKEND/.env" ] || fail "backend/.env is missing (copy the backend section of .env.example)"

for app in frontend admin; do
  for key in NEXT_PUBLIC_API_URL NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_ADMIN_URL; do
    [ -n "$(next_env "$ROOT/$app" "$key")" ] || fail "$key is not set; add it to $app/.env.production"
  done
done
API_PUBLIC="$(next_env "$FRONTEND" NEXT_PUBLIC_API_URL)"
SITE_PUBLIC="$(next_env "$FRONTEND" NEXT_PUBLIC_SITE_URL)"
ADMIN_PUBLIC="$(next_env "$ADMIN" NEXT_PUBLIC_ADMIN_URL)"
log "Node $(node -v), pnpm $(pnpm -v), commit $(git rev-parse --short HEAD)"
log "Site $SITE_PUBLIC, admin $ADMIN_PUBLIC, API $API_PUBLIC"
log "Ports: backend :$BACKEND_PORT, frontend :$FRONTEND_PORT, admin :$ADMIN_PORT"
mkdir -p "$BACKEND/uploads/avatars" "$BACKEND/uploads/articles"

if command -v flock >/dev/null; then
  exec 9>"$ROOT/logs/.deploy.lock"
  flock -n 9 || fail "Another deploy is already running"
fi

step "Installing dependencies"
pnpm install --frozen-lockfile --config.confirmModulesPurge=false

step "Generating Prisma client"
(cd "$BACKEND" && npx --no-install prisma generate)

step "Building backend"
rm -rf "$BACKEND/dist-build"
(cd "$BACKEND" && npx --no-install tsc -p tsconfig.build.json --outDir dist-build)

step "Checking backend configuration"
(cd "$BACKEND" && node --input-type=module -e '
  import "dotenv/config";
  const { checkEnv } = await import("./dist-build/config/env.js");
  const { errors, warnings } = checkEnv({ ...process.env, NODE_ENV: "production" });
  warnings.forEach((w) => console.log(`    warning: ${w}`));
  errors.forEach((e) => console.error(`    error: ${e}`));
  process.exit(errors.length ? 1 : 0);
')

# build_next DIR: builds a Next.js app into DIR/.next-build, next to the live DIR/.next.
build_next() {
  local dir=$1
  # The live build's generated route types are only used for type checking; left in place they
  # break the new build's check whenever a route was removed.
  rm -rf "$dir/.next-build" "$dir/.next/types"
  if [ -d "$dir/.next/cache" ]; then
    mkdir -p "$dir/.next-build"
    cp -R "$dir/.next/cache" "$dir/.next-build/cache"
  fi
  (cd "$dir" && NODE_ENV=production NEXT_DIST_DIR=.next-build npx --no-install next build)
  # Pages already open in browsers keep requesting the previous build's hashed chunks, so carry
  # them over (without overwriting the new build) and drop carried-over files after a week.
  if [ -d "$dir/.next/static" ]; then
    node -e 'require("fs").cpSync(process.argv[1], process.argv[2], { recursive: true, force: false, errorOnExist: false, preserveTimestamps: true })' \
      "$dir/.next/static" "$dir/.next-build/static"
    find "$dir/.next-build/static" -type f -mtime +7 -delete
  fi
}

step "Building frontend"
build_next "$FRONTEND"

step "Building admin app"
build_next "$ADMIN"

step "Starting the new build next to the live one"
smoke_test || fail "The new build does not start (logs above); the live site and database are unchanged"

step "Migrating the database"
bash "$BACKEND/scripts/migrate.sh"

step "Switching to the new build"
activate "$BACKEND/dist" "$BACKEND/dist-build" "$BACKEND/dist-prev"
activate "$FRONTEND/.next" "$FRONTEND/.next-build" "$FRONTEND/.next-prev"
activate "$ADMIN/.next" "$ADMIN/.next-build" "$ADMIN/.next-prev"
RELOADED=1
reload_services || RELOADED=""

step "Verifying"
if [ -z "$RELOADED" ] || ! healthy; then
  show_logs
  REPORTED=1
  if [ -d "$BACKEND/dist-prev" ] && [ -d "$FRONTEND/.next-prev" ]; then
    rollback
    record "failed health check, rolled back"
    printf '\n!! The new build failed its health check and was rolled back.\n' >&2
  else
    record "failed health check, nothing to roll back to"
    printf '\n!! The new build failed its health check and there is no previous build.\n' >&2
  fi
  exit 1
fi

"${PM2[@]}" status
record "deployed"
printf '\n==> Deployed %s in %ss\n' "$(git rev-parse --short HEAD)" "$(($(date +%s) - STARTED_AT))"
