/**
 * Runs at the start of every Vercel build (see package.json "build"):
 *   - applies pending migrations (idempotent; drizzle tracks what ran)
 *   - seeds inventory/settings ONLY on an empty database — later deploys never touch admin-edited rows
 * Skips cleanly when DATABASE_URL is absent (local builds, previews without a database).
 */
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/db/client";
import { seed } from "../src/db/seed";

(async () => {
  if (!process.env.DATABASE_URL) { console.log("deploy-db: DATABASE_URL not set, skipping"); return; }
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("deploy-db: migrations applied");
  await seed({ onlyIfEmpty: true });
  await pool.end();
})().catch((e) => { console.error("deploy-db failed:", e); process.exit(1); });
