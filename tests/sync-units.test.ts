/** A new boat layout = a new SVG. The sync must add, reactivate, deactivate (never delete) and leave bookings intact. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { inventoryUnits } from "@/db/schema";
import { seed } from "@/db/seed";
import { seatIdsFromSvg, syncUnits } from "@/db/sync-units";
import { attachPaymentIntent, confirmBookingByPaymentIntent, createHold, createPendingBooking, getAvailability } from "@/server/booking";

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed();
  await db.execute(sql`TRUNCATE holds, booking_items, payments, notification_log, bookings, guests, sessions CASCADE`);
});
afterAll(async () => { await pool.end(); });

const currentSvg = readFileSync("src/components/booking/YachtMap.tsx", "utf-8");

describe("layout sync", () => {
  it("reads 52 seat ids from the current drawing and is a no-op against the seed", async () => {
    expect(seatIdsFromSvg(currentSvg)).toHaveLength(52);
    await syncUnits(currentSvg);                 // normalise whatever a previous run left behind
    const r = await syncUnits(currentSvg);        // second pass must be a pure no-op
    expect(r).toMatchObject({ total: 52, added: [], deactivated: [], unmapped: [] });
  });

  it("a bigger boat: new seats appear with the right type; removed seats are deactivated, not deleted; bookings survive", async () => {
    // book sunbed-6 before the layout changes
    const h = await createHold({ date: "2027-06-01", slot: "morning", unitId: "sunbed-6", cartToken: "L1" });
    const p = await createPendingBooking("L1", [{ holdId: h.holdId, guests: 1, arrivalTime: "10:00" }], { name: "Layout", email: "layout@example.com", phone: "+971500000030" });
    await attachPaymentIntent(p.bookingId, "pi_layout"); expect(await confirmBookingByPaymentIntent("pi_layout")).toBe("confirmed");

    // new drawing: 8 sunbeds instead of 6, two more jacuzzis, no DJ lounges, one unknown kind
    const newSvg = currentSvg.replace('data-seat="dj-lounge-1"', 'data-seat="sunbed-7"').replace('data-seat="dj-lounge-2"', 'data-seat="sunbed-8"')
      + ' <rect data-seat="jacuzzi-2"/> <rect data-seat="jacuzzi-3"/> <rect data-seat="helipad-1"/>';
    const r = await syncUnits(newSvg);
    expect([...r.added, ...r.reactivated].sort()).toEqual(["jacuzzi-2", "jacuzzi-3", "sunbed-7", "sunbed-8"]); // added on a fresh DB, reactivated on re-runs
    expect(r.deactivated.sort()).toEqual(["dj-lounge-1", "dj-lounge-2"]);
    expect(r.unmapped).toEqual(["helipad-1"]);
    expect((await db.select().from(inventoryUnits).where(eq(inventoryUnits.id, "sunbed-8")))[0]).toMatchObject({ unitTypeId: "sunbed", deck: "upper", label: "S8" });
    expect((await db.select().from(inventoryUnits).where(eq(inventoryUnits.id, "dj-lounge-1")))[0].active).toBe(false);

    const av = await getAvailability("2027-06-01", "morning");
    expect(av.find((u) => u.unitId === "dj-lounge-1")).toBeUndefined();          // gone from the map
    expect(av.find((u) => u.unitId === "sunbed-8")?.state).toBe("free");          // new seat bookable
    expect(av.find((u) => u.unitId === "sunbed-6")?.state).toBe("booked");        // existing booking intact
    expect(av).toHaveLength(54);

    // the old layout comes back → DJ lounges reactivate, extra seats deactivate
    const back = await syncUnits(currentSvg);
    expect(back.reactivated.sort()).toEqual(["dj-lounge-1", "dj-lounge-2"]);
    expect(back.deactivated.sort()).toEqual(["jacuzzi-2", "jacuzzi-3", "sunbed-7", "sunbed-8"]);
  });
});
