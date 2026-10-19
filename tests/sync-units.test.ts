/** Layout-agnostic inventory: the drawing geometry (boat.ts) is the source of seat ids; a designer SVG can override it. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { inventoryUnits } from "@/db/schema";
import { seed } from "@/db/seed";
import { seatIdsFromSvg, syncUnits } from "@/db/sync-units";
import { BOAT_UNITS } from "@/components/booking/boat";
import { attachPaymentIntent, confirmBookingByPaymentIntent, createHold, createPendingBooking, getAvailability } from "@/server/booking";

const svgOf = (ids: string[]) => ids.map((id) => `<rect data-seat="${id}"/>`).join(" ");
const TOTAL = BOAT_UNITS.length;   // 10 sunbeds + 14 daybeds + 8 cabanas + 18 tables + 4 lounges + 8 upper cabanas + 1 VIP + 6 alfresco + 40 entry

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed();
  await db.execute(sql`TRUNCATE holds, booking_items, payments, notification_log, bookings, guests, sessions CASCADE`);
  await syncUnits();
});
afterAll(async () => { await pool.end(); });

describe("layout sync", () => {
  it("the geometry yields every seat of the EPJ drawing set and a second pass is a no-op", async () => {
    expect(TOTAL).toBe(109);
    expect(seatIdsFromSvg()).toHaveLength(TOTAL);
    const r = await syncUnits();
    expect(r).toMatchObject({ total: TOTAL, added: [], deactivated: [], unmapped: [] });
    const u = await db.select().from(inventoryUnits).where(eq(inventoryUnits.id, "vip-booth-1"));
    expect(u[0]).toMatchObject({ deck: "upper", label: "VIP", vipPriority: true });
  });

  it("a revised drawing: new seats appear with the right type; removed seats are deactivated, not deleted; bookings survive", async () => {
    const h = await createHold({ date: "2027-06-01", slot: "morning", unitId: "sunbed-6", cartToken: "L1" });
    const p = await createPendingBooking("L1", [{ holdId: h.holdId, guests: 1, arrivalTime: "10:00" }], { name: "Layout", email: "layout@example.com", phone: "+971500000030" });
    await attachPaymentIntent(p.bookingId, "pi_layout"); expect(await confirmBookingByPaymentIntent("pi_layout")).toBe("confirmed");

    // designer SVG: two more sunbeds, two more cocktail tables, no lounge cabanas 1–2, one unknown kind
    const ids = BOAT_UNITS.map((u) => u.id).filter((id) => id !== "lounge-1" && id !== "lounge-2").concat(["sunbed-11", "sunbed-12", "table-21", "table-22", "helipad-1"]);
    const r = await syncUnits(svgOf(ids));
    expect([...r.added, ...r.reactivated].sort()).toEqual(["sunbed-11", "sunbed-12", "table-21", "table-22"]);
    expect(r.deactivated.sort()).toEqual(["lounge-1", "lounge-2"]);
    expect(r.unmapped).toEqual(["helipad-1"]);
    expect((await db.select().from(inventoryUnits).where(eq(inventoryUnits.id, "table-22")))[0]).toMatchObject({ unitTypeId: "table", deck: "main" });
    expect((await db.select().from(inventoryUnits).where(eq(inventoryUnits.id, "lounge-1")))[0].active).toBe(false);

    const av = await getAvailability("2027-06-01", "morning");
    expect(av.find((u) => u.unitId === "lounge-1")).toBeUndefined();
    expect(av.find((u) => u.unitId === "sunbed-12")?.state).toBe("free");
    expect(av.find((u) => u.unitId === "sunbed-6")?.state).toBe("booked");
    expect(av).toHaveLength(TOTAL + 2);

    // the drawing set comes back → lounges reactivate, extras deactivate
    const back = await syncUnits();
    expect(back.reactivated.sort()).toEqual(["lounge-1", "lounge-2"]);
    expect(back.deactivated.sort()).toEqual(["sunbed-11", "sunbed-12", "table-21", "table-22"]);
  });
});
