/** VIP tiering + priority inventory on real Postgres. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { guests, sessions } from "@/db/schema";
import { seed } from "@/db/seed";
import { attachPaymentIntent, confirmBookingByPaymentIntent, createHold, createPendingBooking, getAvailability, getOrCreateSession, UnitReservedError } from "@/server/booking";
import { recomputeTiers, setManualTier, tierFor, DEFAULT_TIER_RULES } from "@/server/vip";
import { issueGuestSessionValue, verifyGuestSessionValue } from "@/server/guest-session";

const soon = "2027-04-10";     // session well inside the VIP window when the test runs? No — far future, so release time is far away → reserved now
const far = "2027-04-11";

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed();
  await db.execute(sql`TRUNCATE holds, booking_items, payments, notification_log, bookings, guests, sessions CASCADE`);
  process.env.GUEST_SESSION_SECRET = "test-secret-please-rotate";
});
afterAll(async () => { await pool.end(); });

describe("tier rules", () => {
  it("rank from history: spend or front cabana → vip; visits or a balcony-class seat → preferred", () => {
    expect(tierFor({ visits_12m: 0, lifetime_spend: 30000, max_unit_tier: 0 }, DEFAULT_TIER_RULES)).toBe("vip");
    expect(tierFor({ visits_12m: 0, lifetime_spend: 0, max_unit_tier: 6 }, DEFAULT_TIER_RULES)).toBe("vip");
    expect(tierFor({ visits_12m: 2, lifetime_spend: 0, max_unit_tier: 0 }, DEFAULT_TIER_RULES)).toBe("preferred");
    expect(tierFor({ visits_12m: 0, lifetime_spend: 0, max_unit_tier: 4 }, DEFAULT_TIER_RULES)).toBe("preferred");
    expect(tierFor({ visits_12m: 1, lifetime_spend: 900, max_unit_tier: 0 }, DEFAULT_TIER_RULES)).toBe("guest");
  });
});

describe("priority inventory", () => {
  it("front cabanas are 'reserved' for ordinary guests before the release time, free for preferred/vip", async () => {
    const s = await getOrCreateSession(soon, "afternoon");
    expect(s.vipReleaseAt).toBeTruthy();
    // release = session start (14:00 Dubai) − 24 h, i.e. 10:00 UTC the day before
    expect(s.vipReleaseAt!.toISOString()).toBe("2027-04-09T10:00:00.000Z");
    const asGuest = await getAvailability(soon, "afternoon", undefined, "guest");
    expect(asGuest.find((u) => u.unitId === "vip-booth-1")?.state).toBe("reserved");
    expect(asGuest.find((u) => u.unitId === "cabana-1")?.state).toBe("free");
    const asVip = await getAvailability(soon, "afternoon", undefined, "vip");
    expect(asVip.find((u) => u.unitId === "vip-booth-1")?.state).toBe("free");
  });
  it("holding a reserved unit is refused for a guest and allowed for a vip", async () => {
    await expect(createHold({ date: soon, slot: "afternoon", unitId: "vip-booth-1", cartToken: "c1" })).rejects.toBeInstanceOf(UnitReservedError);
    const h = await createHold({ date: soon, slot: "afternoon", unitId: "vip-booth-1", cartToken: "c2", tier: "vip" });
    expect(h.holdId).toBeTruthy();
  });
  it("after the release time the unit opens to everyone", async () => {
    const s = await getOrCreateSession(far, "afternoon");
    await db.update(sessions).set({ vipReleaseAt: sql`now() - interval '1 minute'` }).where(eq(sessions.id, s.id));
    expect((await getAvailability(far, "afternoon", undefined, "guest")).find((u) => u.unitId === "vip-booth-1")?.state).toBe("free");
    const h = await createHold({ date: far, slot: "afternoon", unitId: "vip-booth-1", cartToken: "c3" });
    expect(h.holdId).toBeTruthy();
  });
});

describe("tier job", () => {
  it("a guest who booked a front cabana becomes vip; a manual flag is never overridden", async () => {
    const h = await createHold({ date: far, slot: "morning", unitId: "vip-booth-1", cartToken: "c4", tier: "vip" });
    const p = await createPendingBooking("c4", [{ holdId: h.holdId, guests: 6, arrivalTime: "10:00" }], { name: "Big Spender", email: "vip@example.com", phone: "+971500000009" });
    await attachPaymentIntent(p.bookingId, "pi_vip"); expect(await confirmBookingByPaymentIntent("pi_vip")).toBe("confirmed");
    const h2 = await createHold({ date: far, slot: "morning", unitId: "entry-1", cartToken: "c5" });
    const p2 = await createPendingBooking("c5", [{ holdId: h2.holdId, guests: 1, arrivalTime: "10:00" }], { name: "First Timer", email: "new@example.com", phone: "+971500000010" });
    await attachPaymentIntent(p2.bookingId, "pi_new"); expect(await confirmBookingByPaymentIntent("pi_new")).toBe("confirmed");

    const r = await recomputeTiers();
    const [vip] = await db.select().from(guests).where(eq(guests.email, "vip@example.com"));
    const [newbie] = await db.select().from(guests).where(eq(guests.email, "new@example.com"));
    expect(vip.tier).toBe("vip"); expect(newbie.tier).toBe("guest"); expect(r.changed).toBe(1);

    await setManualTier(newbie.id, "vip");
    const r2 = await recomputeTiers();
    expect((await db.select().from(guests).where(eq(guests.id, newbie.id)))[0].tier).toBe("vip");
    expect(r2.changed).toBe(0);
  });
});

describe("guest session cookie", () => {
  it("round-trips, rejects tampering and expiry", () => {
    const id = "11111111-2222-4333-8444-555555555555";
    const v = issueGuestSessionValue(id)!;
    expect(verifyGuestSessionValue(v)).toBe(id);
    expect(verifyGuestSessionValue(v.slice(0, -1) + "x")).toBeNull();
    expect(verifyGuestSessionValue(issueGuestSessionValue(id, 1, Date.now() - 2 * 86_400_000)!)).toBeNull();
  });
});
