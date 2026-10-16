import { sql } from "drizzle-orm";
import { db, pool } from "./client";
import { inventoryUnits, settings, unitTypes } from "./schema";
import { unitTypes as types, units } from "@/components/booking/inventory";

/** Seeds inventory from the Day 1 catalogue (same rows the admin will edit on Day 3). Idempotent. */
export async function seed() {
  await db.insert(unitTypes).values(Object.values(types).map((t) => ({
    id: t.id, cls: t.cls, nameEn: t.name.en, nameAr: t.name.ar, descEn: t.desc.en, descAr: t.desc.ar,
    pax: t.pax, priceMorning: t.mPrice, priceAfternoon: t.price, perPerson: !!t.perPerson, tier: t.tier, imageSlot: null,
  }))).onConflictDoUpdate({ target: unitTypes.id, set: { cls: sql`excluded.cls`, nameEn: sql`excluded.name_en`, nameAr: sql`excluded.name_ar`, descEn: sql`excluded.desc_en`, descAr: sql`excluded.desc_ar`, pax: sql`excluded.pax`, priceMorning: sql`excluded.price_morning`, priceAfternoon: sql`excluded.price_afternoon`, perPerson: sql`excluded.per_person`, tier: sql`excluded.tier` } });

  const upper = new Set(["sunbed", "jacuzzi", "vip-lounge", "balcony-sofa"]);
  const rows = Object.entries(units).map(([id, typeId], i) => ({
    id, unitTypeId: typeId, label: labelFor(id), deck: upper.has(typeId) ? "upper" : "main", sort: i,
    vipPriority: typeId === "front-cabana",   // default VIP-priority units; NOA changes in admin (Day 3)
  }));
  await db.insert(inventoryUnits).values(rows).onConflictDoUpdate({ target: inventoryUnits.id, set: { unitTypeId: sql`excluded.unit_type_id`, label: sql`excluded.label`, deck: sql`excluded.deck`, sort: sql`excluded.sort` } });

  await db.insert(settings).values([
    { key: "hold_minutes", value: 7 },
    { key: "max_holds_per_cart", value: 6 },
    { key: "hold_extension_minutes", value: 3 },
    { key: "vat_rate", value: 0.05 },
    { key: "vip_release_hours", value: 24 },
    { key: "tier_rules", value: { preferred: { visits12m: 2, minUnitTier: 4 }, vip: { lifetimeSpend: 25000, minUnitTier: 6 } } },
  ]).onConflictDoNothing();
}

function labelFor(id: string) {
  const m = id.match(/^([a-z-]+?)-(\w+)$/);
  if (!m) return id.toUpperCase();
  const [, kind, n] = m;
  const prefix: Record<string, string> = { sunbed: "S", jacuzzi: "J", "vip-lounge": "V", balcony: "B", cabana: "C", "front-cabana": "V", "daybed-t": "D", "daybed-b": "F", "lower-cabana": "LC", entry: "", "dj-lounge": "DJ" };
  return `${prefix[kind] ?? kind.toUpperCase()}${n.toUpperCase()}`;
}

if (require.main === module) {
  seed().then(() => { console.log("seeded"); return pool.end(); }).catch((e) => { console.error(e); process.exit(1); });
}
