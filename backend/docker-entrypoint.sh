#!/usr/bin/env bash
# First-boot setup for the Laravel API inside Docker. Idempotent: safe to run
# on every container start. Heavy steps are skipped when already done.
set -e

cd /var/www

# 1. Ensure a .env exists (copy from the example on first boot).
if [ ! -f .env ]; then
  echo "→ Creating .env from .env.example"
  cp .env.example .env
fi

# 1b. Sync the .env file with the values passed in by docker-compose. Laravel's
# Dotenv repository is immutable and loads the .env FILE first, so a stale
# DB_CONNECTION=sqlite in the file would win over the container env var. Writing
# the real values into the file keeps the file the single source of truth.
set_env() {
  local key="$1" value="$2"
  if grep -qE "^${key}=" .env; then
    # Escape & and / for sed, then replace the whole line.
    local escaped
    escaped=$(printf '%s' "$value" | sed -e 's/[&/\]/\\&/g')
    sed -i "s/^${key}=.*/${key}=${escaped}/" .env
  else
    echo "${key}=${value}" >> .env
  fi
}

echo "→ Syncing .env from container environment"
set_env DB_CONNECTION "${DB_CONNECTION:-mysql}"
set_env DB_HOST "${DB_HOST:-db}"
set_env DB_PORT "${DB_PORT:-3306}"
set_env DB_DATABASE "${DB_DATABASE:-home_anywhere}"
set_env DB_USERNAME "${DB_USERNAME:-root}"
set_env DB_PASSWORD "${DB_PASSWORD:-}"
set_env ADMIN_USERNAME "${ADMIN_USERNAME:-admin}"
set_env ADMIN_PASSWORD "${ADMIN_PASSWORD:-change-me}"
set_env NEXT_PUBLIC_APP_URL "${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
set_env STRIPE_SECRET_KEY "${STRIPE_SECRET_KEY:-}"
set_env STRIPE_WEBHOOK_SECRET "${STRIPE_WEBHOOK_SECRET:-}"

# 2. Install PHP deps if they aren't baked in / mounted away.
if [ ! -d vendor ]; then
  echo "→ Installing Composer dependencies"
  composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# 3. Generate an APP_KEY if the .env doesn't have one yet.
if ! grep -q '^APP_KEY=base64:' .env; then
  echo "→ Generating APP_KEY"
  php artisan key:generate --force
fi

# 4. Wait for MySQL to accept connections before migrating.
echo "→ Waiting for database ${DB_HOST}:${DB_PORT}..."
until php -r "exit(@fsockopen(getenv('DB_HOST'), (int)getenv('DB_PORT')) ? 0 : 1);" 2>/dev/null; do
  sleep 2
done
echo "→ Database is up"

# 5. Run migrations. Seed only once (when the services table is empty) so we
#    don't wipe a live catalogue on restart — the seeder truncates tables.
php artisan migrate --force
SERVICE_COUNT=$(php artisan tinker --execute="echo \App\Models\Service::count();" 2>/dev/null | tail -n1 | tr -dc '0-9')
if [ "${SERVICE_COUNT:-0}" = "0" ]; then
  echo "→ Empty catalogue — seeding demo data"
  php artisan db:seed --force
else
  echo "→ Catalogue already has ${SERVICE_COUNT} stay(s) — skipping seed"
fi

# 6. Make uploaded images publicly reachable.
php artisan storage:link || true

echo "→ Backend ready on :8000"
exec php artisan serve --host=0.0.0.0 --port=8000
