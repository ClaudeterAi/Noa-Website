/**
 * Integration tests against a real Postgres (run via: python3 scripts/with-local-pg.py npx vitest run).
 * They prove the three guarantees the estimate promises:
 *   1. two guests racing for one seat → exactly one hold
 *   2. an expired hold frees the seat without waiting for the sweeper
 *   3. a pending booking confirms, and a late payment (after expiry) is detected as "late"
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { holds, settings } from "@/db/schema";
import { seed } from "@/db/seed";
import {
  attachPaymentIntent, confirmBookingByPaymentIntent, createHold, createPendingBooking, getAvailability, releaseHold, sweepExpired, UnitUnavailableError,
} from "@/server/booking";

const DATE = "2027-01-15";

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
  await seed();
  await db.execute(sql`TRUNCATE holds, booking_items, payments, notification_log, bookings, guests, sessions RESTART IDENTITY CASCADE`);
});
afterAll(async () => { await pool.end(); });

describe("holds", () => {
  it("one seat, two guests racing → exactly one wins", async () => {
    const results = await Promise.allSettled([
      createHold({ date: DATE, slot: "afternoon", unitId: "cabana-1", cartToken: "cart-A" }),
      createHold({ date: DATE, slot: "afternoon", unitId: "cabana-1", cartToken: "cart-B" }),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].reason).toBeInstanceOf(UnitUnavailableError);
  });

  it("re-tapping your own held seat returns the same hold", async () => {
    const a = await createHold({ date: DATE, slot: "afternoon", unitId: "daybed-t-1", cartToken: "cart-C" });
    const b = await createHold({ date: DATE, slot: "afternoon", unitId: "daybed-t-1", cartToken: "cart-C" });
    expect(b.holdId).toBe(a.holdId);
  });

  it("availability marks held/yours/free correctly and hold length follows settings (5 min)", async () => {
    const av = await getAvailability(DATE, "afternoon", "cart-C");
    expect(av.find((u) => u.unitId === "cabana-1")?.state).toBe("held");
    expect(av.find((u) => u.unitId === "daybed-t-1")?.state).toBe("yours");
    expect(av.find((u) => u.unitId === "daybed-t-2")?.state).toBe("free");
    const until = new Date(av.find((u) => u.unitId === "daybed-t-1")!.heldUntil!).getTime() - Date.now();
    expect(until).toBeGreaterThan(4 * 60_000);
    expect(until).toBeLessThanOrEqual(5 * 60_000 + 2000);
  });

  it("an expired hold frees the seat for the next guest, even before the sweeper runs", async () => {
    const h = await createHold({ date: DATE, slot: "morning", unitId: "sunbed-1", cartToken: "cart-D" });
    await db.update(holds).set({ expiresAt: sql`now() - interval '1 second'` }).where(sql`${holds.id} = ${h.holdId}`);
    const av = await getAvailability(DATE, "morning");
    expect(av.find((u) => u.unitId === "sunbed-1")?.state).toBe("free");
    const next = await createHold({ date: DATE, slot: "morning", unitId: "sunbed-1", cartToken: "cart-E" });
    expect(next.holdId).not.toBe(h.holdId);
  });

  it("releasing a hold requires the owning cart token", async () => {
    const h = await createHold({ date: DATE, slot: "morning", unitId: "sunbed-2", cartToken: "cart-F" });
    expect(await releaseHold(h.holdId, "someone-else")).toBe(false);
    expect(await releaseHold(h.holdId, "cart-F")).toBe(true);
    expect((await getAvailability(DATE, "morning")).find((u) => u.unitId === "sunbed-2")?.state).toBe("free");
  });
});

describe("bookings", () => {
  it("pending booking: prices from DB, VAT 5%, holds extended once by 3 min, then confirms on payment", async () => {
    const h1 = await createHold({ date: DATE, slot: "afternoon", unitId: "balcony-1", cartToken: "cart-G" });
    const h2 = await createHold({ date: DATE, slot: "afternoon", unitId: "entry-1", cartToken: "cart-G" });
    const pending = await createPendingBooking("cart-G", [
      { holdId: h1.holdId, guests: 6, arrivalTime: "15:00" },
      { holdId: h2.holdId, guests: 3, arrivalTime: "15:00" },   // general entry unit holds 1 person → clamped to pax (1 × 900)
    ], { name: "Test Guest", email: "Guest@Example.com", phone: "+971500000000" });
    expect(pending.subtotal).toBe(6500 + 900);
    expect(pending.vat).toBe(Math.round(pending.subtotal * 0.05));
    expect(pending.total).toBe(pending.subtotal + pending.vat);
    const ext = new Date(pending.holdsExtendedUntil).getTime() - Date.now();
    expect(ext).toBeGreaterThan(2 * 60_000);
    expect(ext).toBeLessThanOrEqual(3 * 60_000 + 2000);

    // someone else cannot take a seat that is in a pending booking
    await expect(createHold({ date: DATE, slot: "afternoon", unitId: "balcony-1", cartToken: "cart-H" })).rejects.toBeInstanceOf(UnitUnavailableError);

    await attachPaymentIntent(pending.bookingId, "pi_test_123");
    expect(await confirmBookingByPaymentIntent("pi_test_123")).toBe("confirmed");
    expect(await confirmBookingByPaymentIntent("pi_test_123")).toBe("already");   // webhook replay is harmless
    expect((await getAvailability(DATE, "afternoon")).find((u) => u.unitId === "balcony-1")?.state).toBe("booked");
  });

  it("a hold cannot be used twice and a foreign cart cannot book it", async () => {
    const h = await createHold({ date: DATE, slot: "afternoon", unitId: "cabana-2", cartToken: "cart-I" });
    await expect(createPendingBooking("cart-J", [{ holdId: h.holdId, guests: 2, arrivalTime: "14:00" }], { name: "X", email: "x@example.com", phone: "1" }))
      .rejects.toBeInstanceOf(UnitUnavailableError);
  });

  it("late payment: holds expired and swept → confirmation reports 'late' and the seat is free again", async () => {
    const h = await createHold({ date: DATE, slot: "morning", unitId: "jacuzzi-1", cartToken: "cart-K" });
    const pending = await createPendingBooking("cart-K", [{ holdId: h.holdId, guests: 4, arrivalTime: "10:00" }], { name: "Late", email: "late@example.com", phone: "2" });
    await attachPaymentIntent(pending.bookingId, "pi_late_1");
    await db.update(holds).set({ expiresAt: sql`now() - interval '1 second'` }).where(sql`${holds.bookingId} = ${pending.bookingId}`);
    const swept = await sweepExpired();
    expect(swept.bookings).toBe(1);
    expect(await confirmBookingByPaymentIntent("pi_late_1")).toBe("late");
    expect((await getAvailability(DATE, "morning")).find((u) => u.unitId === "jacuzzi-1")?.state).toBe("free");
  });

  it("settings drive the hold window", async () => {
    await db.update(settings).set({ value: 10 }).where(sql`${settings.key} = 'hold_minutes'`);
    const h = await createHold({ date: DATE, slot: "morning", unitId: "sunbed-3", cartToken: "cart-L" });
    expect(new Date(h.expiresAt).getTime() - Date.now()).toBeGreaterThan(9 * 60_000);
    await db.update(settings).set({ value: 5 }).where(sql`${settings.key} = 'hold_minutes'`);
  });
});
