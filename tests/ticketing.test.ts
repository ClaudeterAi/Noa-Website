/** Event ticketing on real Postgres: event prices, seat types on sale, members presale, sales close, capacity cap, night sessions. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { seed } from "@/db/seed";
import { saveEvent, setEventStatus } from "@/server/events/repo";
import { createHold, createPendingBooking, getAvailability, getOrCreateSession } from "@/server/booking";
import { CapacityReachedError, SaleNotOpenError, TypeNotOnSaleError, saleState } from "@/server/events/ticketing";

const actor = { email: "ops@noa-dubai.com", role: "editor" };
const D = "2027-08-14";
const hrs = (n: number) => new Date(Date.now() + n * 3_600_000).toISOString();

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed();
  await db.execute(sql`TRUNCATE holds, booking_items, payments, notification_log, bookings, guests, sessions, events, kb_sync_jobs, kb_documents CASCADE`);
});
afterAll(async () => { await pool.end(); });

describe("event night", () => {
  it("publishing creates the night session; prices come from the event; only listed seat types are on sale", async () => {
    const e = await saveEvent(actor, null, { titleEn: "Full Moon", date: D, session: "night", ticketing: { seatTypes: ["cabana", "daybed", "entry"], prices: { cabana: 12000 }, surchargeAed: 300 } });
    await setEventStatus(actor, e.id, "published");
    const s = await getOrCreateSession(D, "night"); expect(s.vipReleaseAt?.toISOString()).toBe("2027-08-13T17:30:00.000Z");  // 21:30 Dubai − 24 h
    const av = await getAvailability(D, "night");
    expect(av.find((u) => u.unitId === "cabana-1")?.price).toBe(12000);            // explicit event price
    expect(av.find((u) => u.unitId === "daybed-1")?.price).toBe(Math.round((2200 * 1.2) / 10) * 10 + 300);    // night base (afternoon × night_price_factor 1.2) + surcharge
    expect(av.find((u) => u.unitId === "sunbed-1")?.state).toBe("closed");         // not on sale tonight
    await expect(createHold({ date: D, slot: "night", unitId: "sunbed-1", cartToken: "c1" })).rejects.toBeInstanceOf(TypeNotOnSaleError);
  });
  it("the booking is priced at the event rate", async () => {
    const h = await createHold({ date: D, slot: "night", unitId: "entry-1", cartToken: "c2" });
    const p = await createPendingBooking("c2", [{ holdId: h.holdId, guests: 2, arrivalTime: "22:00" }], { name: "Night Guest", email: "n@example.com", phone: "+971500000050" });
    expect(p.subtotal).toBe(Math.round((900 * 1.2) / 10) * 10 + 300); // General Entry, pax 1: night base (afternoon × 1.2) + surcharge
    expect(p.vat).toBe(Math.round(p.subtotal * 0.05));
  });
  it("members presale: guests wait, members book; sales close is enforced", async () => {
    const e = await saveEvent(actor, null, { titleEn: "Presale Night", date: "2027-08-21", session: "night", ticketing: { salesOpenAt: hrs(10), memberPresaleHours: 24 } });
    await setEventStatus(actor, e.id, "published");
    expect(saleState(e, "guest")).toBe("not_yet"); expect(saleState(e, "vip")).toBe("presale");
    expect((await getAvailability("2027-08-21", "night", undefined, "guest")).find((u) => u.unitId === "entry-2")?.state).toBe("reserved");
    await expect(createHold({ date: "2027-08-21", slot: "night", unitId: "entry-2", cartToken: "c3" })).rejects.toBeInstanceOf(SaleNotOpenError);
    expect((await createHold({ date: "2027-08-21", slot: "night", unitId: "entry-2", cartToken: "c4", tier: "vip" })).holdId).toBeTruthy();
    const closed = await saveEvent(actor, null, { titleEn: "Closed", date: "2027-08-22", session: "night", ticketing: { salesCloseAt: hrs(-1) } });
    await setEventStatus(actor, closed.id, "published");
    await expect(createHold({ date: "2027-08-22", slot: "night", unitId: "entry-3", cartToken: "c5" })).rejects.toMatchObject({ state: "closed" });
  });
  it("capacity cap counts sold seats and live holds", async () => {
    const e = await saveEvent(actor, null, { titleEn: "Intimate", date: "2027-08-28", session: "full", ticketing: { capacityCap: 2 } });
    await setEventStatus(actor, e.id, "published");
    await createHold({ date: "2027-08-28", slot: "full", unitId: "entry-4", cartToken: "c6" });
    await createHold({ date: "2027-08-28", slot: "full", unitId: "entry-5", cartToken: "c7" });
    await expect(createHold({ date: "2027-08-28", slot: "full", unitId: "entry-6", cartToken: "c8" })).rejects.toBeInstanceOf(CapacityReachedError);
  });
  it("a session without an event keeps base prices and everything on sale", async () => {
    const av = await getAvailability("2027-08-30", "afternoon");
    expect(av.find((u) => u.unitId === "cabana-1")?.price).toBe(8500); expect(av.every((u) => u.state !== "closed")).toBe(true);
  });
});
