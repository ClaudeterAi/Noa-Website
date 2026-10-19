/**
 * Reconcile inventory_units with the seat ids present in the yacht SVG.
 *
 *   npx tsx src/db/sync-units.ts [path/to/YachtMap.tsx | deck.svg]   (default: src/components/booking/YachtMap.tsx)
 *
 * Rules (layout changes are expected — the boat is not final):
 *   - every data-seat="<id>" in the drawing becomes a unit; its type comes from `units` in inventory.ts
 *     (id prefix mapping) or from an existing row;
 *   - units no longer in the drawing are DEACTIVATED, never deleted, so bookings keep their history;
 *   - unit types themselves are admin-managed rows and are never touched here.
 */
import { readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "./client";
import { inventoryUnits, unitTypes } from "./schema";
import { units as typeMap } from "@/components/booking/inventory";
import { BOAT_UNITS } from "@/components/booking/boat";

/** Seat ids: from a designer SVG (data-seat="…") when one is given, otherwise from the drawing geometry in boat.ts. */
export function seatIdsFromSvg(source?: string): string[] {
  if (!source) return BOAT_UNITS.map((u) => u.id);
  const ids = [...source.matchAll(/data-seat="([^"]+)"/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

/** Map a seat id to a unit type: exact catalogue entry first, then by id prefix (e.g. "sunbed-7" → "sunbed"). */
export function typeForSeat(id: string, known: Set<string>): string | null {
  if (typeMap[id]) return typeMap[id];
  const prefixes: [RegExp, string][] = [
    [/^vip-booth-/, "vip-booth"], [/^upper-cabana-/, "upper-cabana"], [/^lounge-/, "lounge"], [/^cabana-/, "cabana"], [/^alfresco-/, "alfresco"],
    [/^daybed-/, "daybed"], [/^table-/, "table"], [/^sunbed-/, "sunbed"], [/^entry-/, "entry"],
  ];
  for (const [re, type] of prefixes) if (re.test(id) && known.has(type)) return type;
  return null;
}

export async function syncUnits(source?: string) {
  const ids = seatIdsFromSvg(source);
  const known = new Set((await db.select({ id: unitTypes.id }).from(unitTypes)).map((t) => t.id));
  const existing = await db.select().from(inventoryUnits);
  const byId = new Map(existing.map((u) => [u.id, u]));
  const upper = new Set(["upper-cabana", "vip-booth", "alfresco"]);   // decks per the EPJ drawings (boat.ts)
  const report = { added: [] as string[], reactivated: [] as string[], retyped: [] as string[], deactivated: [] as string[], unmapped: [] as string[], total: ids.length };

  for (const [i, id] of ids.entries()) {
    const cur = byId.get(id);
    const type = cur?.unitTypeId ?? typeForSeat(id, known);
    if (!type) { report.unmapped.push(id); continue; }
    const label = BOAT_UNITS.find((u) => u.id === id)?.label ?? id.toUpperCase();
    if (!cur) {
      await db.insert(inventoryUnits).values({ id, unitTypeId: type, label, deck: upper.has(type) ? "upper" : "main", sort: i, vipPriority: type === "vip-booth" });
      report.added.push(id);
    } else {
      const patch: Partial<typeof inventoryUnits.$inferInsert> = { sort: i };
      if (!cur.active) { patch.active = true; report.reactivated.push(id); }
      await db.update(inventoryUnits).set(patch).where(eq(inventoryUnits.id, id));
    }
  }
  const gone = existing.filter((u) => u.active && !ids.includes(u.id));
  if (gone.length) {
    await db.update(inventoryUnits).set({ active: false }).where(sql`${inventoryUnits.id} IN (${sql.join(gone.map((u) => sql`${u.id}`), sql`, `)})`);
    report.deactivated = gone.map((u) => u.id);
  }
  return report;
}

if (require.main === module) {
  const file = process.argv[2];
  syncUnits(file ? readFileSync(file, "utf-8") : undefined)
    .then((r) => { console.log(JSON.stringify(r, null, 2)); return pool.end(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
