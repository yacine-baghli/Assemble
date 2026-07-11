#!/usr/bin/env bash
# Route secrets from secrets.local.env to their proper homes.
#   NEXT_PUBLIC_*  -> .env.local (build-time, safe to expose)
#   everything else -> Convex env (npx convex env set), where actions run.
#
# Usage:  bash scripts/push-secrets.sh
# Requires: `npx convex dev` has been run once (so CONVEX_DEPLOYMENT is set).

set -euo pipefail
cd "$(dirname "$0")/.."

SRC="secrets.local.env"
[ -f "$SRC" ] || { echo "Missing $SRC — copy secrets.local.env.example and fill it."; exit 1; }

ENV_LOCAL=".env.local"
touch "$ENV_LOCAL"

set_public() {
  local key="$1" val="$2"
  # Replace or append in .env.local
  if grep -q "^${key}=" "$ENV_LOCAL"; then
    sed -i.bak "s|^${key}=.*|${key}=${val}|" "$ENV_LOCAL" && rm -f "${ENV_LOCAL}.bak"
  else
    echo "${key}=${val}" >> "$ENV_LOCAL"
  fi
  echo "  .env.local  <- ${key}"
}

while IFS='=' read -r key val; do
  # skip comments / blank / no value
  case "$key" in ''|\#*) continue ;; esac
  [ -n "${val:-}" ] || continue
  key="$(echo "$key" | tr -d '[:space:]')"
  if [ -z "$val" ]; then continue; fi
  if [[ "$key" == NEXT_PUBLIC_* ]]; then
    set_public "$key" "$val"
  else
    npx convex env set "$key" "$val" >/dev/null && echo "  convex      <- ${key}"
  fi
done < "$SRC"

echo "Done. Restart 'npm run dev' to pick up .env.local changes."
