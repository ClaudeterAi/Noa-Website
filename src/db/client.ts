import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Lazy, per-instance Postgres pool (cached on globalThis across hot reloads) so the
 * module can be imported at build time without DATABASE_URL.
 * Production: RDS in me-central-1; Vercel functions pinned to dxb1 (same AWS region).
 */
declare global {
  // eslint-disable-next-line no-var
  var __noaPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __noaDb: NodePgDatabase<typeof schema> | undefined;
}

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new Pool({
    connectionString: url,
    max: Number(process.env.PG_POOL_MAX ?? 5),
    idleTimeoutMillis: 10_000,
    ssl: url.includes("rds.amazonaws.com") ? { rejectUnauthorized: true } : undefined,
  });
}

export function getPool(): Pool { return (globalThis.__noaPool ??= makePool()); }
export function getDb(): NodePgDatabase<typeof schema> { return (globalThis.__noaDb ??= drizzle(getPool(), { schema })); }

function lazy<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get(_t, prop) {
      const target = get();
      const v = Reflect.get(target, prop, target) as unknown;
      return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(target) : v;
    },
  });
}

export const db: NodePgDatabase<typeof schema> = lazy(getDb);
export const pool: Pool = lazy(getPool);
export type Db = NodePgDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
