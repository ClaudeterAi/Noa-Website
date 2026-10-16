import { eq, sql } from "drizzle-orm";
import { db, type Db, type Tx } from "@/db/client";
import { guests, settings } from "@/db/schema";

export type Tier = "guest" | "preferred" | "vip";
export const TIER_RANK: Record<Tier, number> = { guest: 0, preferred: 1, vip: 2 };

/** Defaults from the plan; NOA edits them in admin (settings.tier_rules). */
export interface TierRules {
  preferred: { visits12m: number; minUnitTier: number };   // 2 visits in 12 months OR any unit of tier ≥ 2 (daybed and up … see seed)
  vip: { lifetimeSpend: number; minUnitTier: number };     // AED 25,000 lifetime OR any front cabana (tier 6)
}
export const DEFAULT_TIER_RULES: TierRules = { preferred: { visits12m: 2, minUnitTier: 4 }, vip: { lifetimeSpend: 25000, minUnitTier: 6 } };
export const DEFAULT_VIP_RELEASE_HOURS = 24;

type DbOrTx = Db | Tx;

export async function getTierRules(conn: DbOrTx = db): Promise<TierRules> {
  const [row] = await conn.select({ value: settings.value }).from(settings).where(eq(settings.key, "tier_rules"));
  return { ...DEFAULT_TIER_RULES, ...((row?.value as Partial<TierRules> | undefined) ?? {}) };
}
export async function getVipReleaseHours(conn: DbOrTx = db): Promise<number> {
  const [row] = await conn.select({ value: settings.value }).from(settings).where(eq(settings.key, "vip_release_hours"));
  return (row?.value as number | undefined) ?? DEFAULT_VIP_RELEASE_HOURS;
}

interface GuestStats { guest_id: string; visits_12m: number; lifetime_spend: number; max_unit_tier: number; current: Tier; manual: boolean }
type StatsRow = GuestStats & Record<string, unknown>;

export function tierFor(s: Pick<GuestStats, "visits_12m" | "lifetime_spend" | "max_unit_tier">, rules: TierRules): Tier {
  if (s.lifetime_spend >= rules.vip.lifetimeSpend || s.max_unit_tier >= rules.vip.minUnitTier) return "vip";
  if (s.visits_12m >= rules.preferred.visits12m || s.max_unit_tier >= rules.preferred.minUnitTier) return "preferred";
  return "guest";
}

/**
 * Nightly job: recompute every guest's tier from confirmed bookings. Guests flagged by NOA
 * (tier_manual) are never changed by the job. Returns the number of guests whose tier changed.
 */
export async function recomputeTiers(conn: DbOrTx = db): Promise<{ changed: number; evaluated: number }> {
  const rules = await getTierRules(conn);
  const rows = await conn.execute<StatsRow>(sql`
    SELECT g.id AS guest_id, g.tier AS current, g.tier_manual AS manual,
      COALESCE((SELECT SUM(b.total) FROM bookings b WHERE b.guest_id = g.id AND b.status = 'confirmed'), 0)::int AS lifetime_spend,
      COALESCE((SELECT COUNT(DISTINCT s.id) FROM bookings b
                 JOIN booking_items bi ON bi.booking_id = b.id JOIN sessions s ON s.id = bi.session_id
                 WHERE b.guest_id = g.id AND b.status = 'confirmed'
                   AND s.date BETWEEN (now() AT TIME ZONE 'Asia/Dubai')::date - 365 AND (now() AT TIME ZONE 'Asia/Dubai')::date), 0)::int AS visits_12m,
      COALESCE((SELECT MAX(ut.tier) FROM bookings b
                 JOIN booking_items bi ON bi.booking_id = b.id JOIN inventory_units iu ON iu.id = bi.unit_id JOIN unit_types ut ON ut.id = iu.unit_type_id
                 WHERE b.guest_id = g.id AND b.status = 'confirmed'), 0)::int AS max_unit_tier
    FROM guests g`);
  let changed = 0;
  for (const r of rows.rows) {
    if (r.manual) continue;
    const next = tierFor(r, rules);
    if (next !== r.current) { await conn.update(guests).set({ tier: next }).where(eq(guests.id, r.guest_id)); changed++; }
  }
  return { changed, evaluated: rows.rows.length };
}

/** NOA flags a guest by hand; the nightly job will not override it. */
export async function setManualTier(guestId: string, tier: Tier, conn: DbOrTx = db) {
  await conn.update(guests).set({ tier, tierManual: true }).where(eq(guests.id, guestId));
}
export async function clearManualTier(guestId: string, conn: DbOrTx = db) {
  await conn.update(guests).set({ tierManual: false }).where(eq(guests.id, guestId));
}

/** Can this tier book a VIP-priority unit before the session's release time? */
export const canBookPriority = (tier: Tier) => TIER_RANK[tier] >= TIER_RANK.preferred;
