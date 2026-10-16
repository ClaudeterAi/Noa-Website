/** Admin data layer on real Postgres: audit rows on every mutation, validation, CSV export, role ranking. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { desc, eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { auditLog, guests, inventoryUnits, settings, unitTypes } from "@/db/schema";
import { seed } from "@/db/seed";
import { attachPaymentIntent, confirmBookingByPaymentIntent, createHold, createPendingBooking, getAvailability } from "@/server/booking";
import { cancelBookingAdmin, getBooking, guestsCsv, listBookings, listGuests, listSessions, setGuestTier, setSessionStatus, updateSetting, updateUnit, updateUnitType } from "@/server/admin/actions";
import { hasRole, roleFromGroups } from "@/server/admin/auth";

const actor = { email: "ops@noa-dubai.com", role: "owner" };
const D = "2027-05-05";

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed();
  await db.execute(sql`TRUNCATE holds, booking_items, payments, notification_log, bookings, guests, sessions, audit_log CASCADE`);
});
afterAll(async () => { await pool.end(); });

const lastAudit = async () => (await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(1))[0];

describe("roles", () => {
  it("maps Cognito groups to roles and ranks them", () => {
    expect(roleFromGroups(["frontdesk", "editor"])).toBe("editor");
    expect(roleFromGroups(["owner"])).toBe("owner");
    expect(roleFromGroups(["marketing"])).toBeNull();
    expect(hasRole("editor", "frontdesk")).toBe(true);
    expect(hasRole("frontdesk", "editor")).toBe(false);
    expect(hasRole(null, "frontdesk")).toBe(false);
  });
});

describe("bookings", () => {
  it("lists, reads detail, cancels with an audit row and frees the seat", async () => {
    const h = await createHold({ date: D, slot: "afternoon", unitId: "cabana-1", cartToken: "a1" });
    const p = await createPendingBooking("a1", [{ holdId: h.holdId, guests: 4, arrivalTime: "15:00" }], { name: "Admin Case", email: "case@example.com", phone: "+971500000020" });
    await attachPaymentIntent(p.bookingId, "pi_admin_1"); await confirmBookingByPaymentIntent("pi_admin_1");
    const list = await listBookings({ q: "case@" });
    expect(list[0]?.ref).toBe(p.ref); expect(list[0]?.firstDate).toBe(D);
    const detail = await getBooking(p.bookingId);
    expect(detail?.items[0].unitName).toBe("Cabana"); expect(detail?.items[0].label).toBe("C1");
    await cancelBookingAdmin(actor, p.bookingId);
    expect((await getBooking(p.bookingId))?.booking.status).toBe("cancelled");
    expect((await getAvailability(D, "afternoon")).find((u) => u.unitId === "cabana-1")?.state).toBe("free");
    const a = await lastAudit(); expect(a.action).toBe("booking.cancel"); expect(a.actor).toBe(actor.email);
    await expect(cancelBookingAdmin(actor, p.bookingId)).rejects.toThrow(/Cannot cancel/);
  });
});

describe("guests", () => {
  it("manual tier set/clear is audited; CSV export escapes quotes", async () => {
    const [g] = await db.select().from(guests).where(eq(guests.email, "case@example.com"));
    await setGuestTier(actor, g.id, "vip");
    expect((await db.select().from(guests).where(eq(guests.id, g.id)))[0]).toMatchObject({ tier: "vip", tierManual: true });
    await setGuestTier(actor, g.id, "auto");
    expect((await db.select().from(guests).where(eq(guests.id, g.id)))[0].tierManual).toBe(false);
    expect((await lastAudit()).action).toBe("guest.tier.set");
    await db.update(guests).set({ name: 'Ali "The Captain" Rashid' }).where(eq(guests.id, g.id));
    const csv = guestsCsv(await listGuests("case@"));
    expect(csv.split("\n")[0]).toContain("lifetime_spend_aed");
    expect(csv).toContain('"Ali ""The Captain"" Rashid"');
  });
});

describe("inventory, sessions, settings", () => {
  it("price change applies to new holds; invalid values rejected; vip toggle takes effect", async () => {
    await updateUnitType(actor, "sunbed", { priceAfternoon: 2000 });
    expect((await getAvailability(D, "afternoon")).find((u) => u.unitId === "sunbed-1")?.price).toBe(2000);
    await expect(updateUnitType(actor, "sunbed", { priceAfternoon: -5 })).rejects.toThrow(/non-negative/);
    await updateUnit(actor, "cabana-2", { vipPriority: true });
    expect((await db.select().from(inventoryUnits).where(eq(inventoryUnits.id, "cabana-2")))[0].vipPriority).toBe(true);
    expect((await getAvailability(D, "afternoon", undefined, "guest")).find((u) => u.unitId === "cabana-2")?.state).toBe("reserved");
    await updateUnit(actor, "cabana-2", { vipPriority: false });
  });
  it("closing a session blocks new holds; reopening restores", async () => {
    await setSessionStatus(actor, D, "morning", "closed");
    await expect(createHold({ date: D, slot: "morning", unitId: "daybed-t-1", cartToken: "a2" })).rejects.toThrow();
    const s = await listSessions(D, D); expect(s.find((x) => x.slot === "morning")?.status).toBe("closed");
    await setSessionStatus(actor, D, "morning", "open");
    expect((await createHold({ date: D, slot: "morning", unitId: "daybed-t-1", cartToken: "a2" })).holdId).toBeTruthy();
  });
  it("settings are validated and audited", async () => {
    await updateSetting(actor, "hold_minutes", 7);
    expect((await db.select().from(settings).where(eq(settings.key, "hold_minutes")))[0].value).toBe(7);
    await expect(updateSetting(actor, "hold_minutes", 0)).rejects.toThrow(/1–1440/);
    await expect(updateSetting(actor, "vat_rate", 5)).rejects.toThrow(/between 0 and 1/);
    expect((await lastAudit()).entityId).toBe("hold_minutes");
    await updateSetting(actor, "hold_minutes", 5);
    const [t] = await db.select().from(unitTypes).where(eq(unitTypes.id, "sunbed")); await updateUnitType(actor, "sunbed", { priceAfternoon: 1800 }); expect(t.priceAfternoon).toBe(2000);
  });
});
