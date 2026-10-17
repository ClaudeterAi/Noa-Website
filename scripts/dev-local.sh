#!/usr/bin/env bash
# Run the whole stack locally with a real Postgres (no AWS needed). First run installs the embedded server.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -c "import pgserver" 2>/dev/null || pip install --break-system-packages -q pgserver
python3 scripts/with-local-pg.py npx tsx src/db/migrate.ts
python3 scripts/with-local-pg.py npx tsx src/db/seed.ts
echo "Local Postgres ready. Add Stripe test keys to .env.local to test checkout (webhook: stripe listen --forward-to localhost:3000/api/stripe/webhook)."
exec python3 scripts/with-local-pg.py npm run dev
