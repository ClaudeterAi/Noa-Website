/** Staff alerts: call-back tool → row + ops email; new booking → ops email; shuttle alert 2 h before arrival, once. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { callbackRequests, notificationLog } from "@/db/schema";
import { seed } from "@/db/seed";
import { attachPaymentIntent, confirmBookingByPaymentIntent, createHold, createPendingBooking } from "@/server/booking";
import { enqueueShuttleAlerts, enqueueStaffEmail, processOutbox, type Providers } from "@/server/notifications/outbox";
import { staffBookingSummary } from "@/server/notifications/staff";
import { runTool } from "@/server/concierge/tools";

const sent: { to: string; subject: string }[] = [];
const fakes: Providers = { email: { async send(to, m) { sent.push({ to, subject: m.subject }); return { id: `e${sent.length}` }; } }, whatsapp: null };
const ctx = { cartToken: "44444444-4444-4444-8444-444444444444", locale: "en" as const, tier: "guest" as const, source: "voice" as const };

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed();
  await db.execute(sql`TRUNCATE holds, booking_items, payments, notification_log, bookings, guests, sessions, callback_requests CASCADE`);
});
afterAll(async () => { await pool.end(); });

describe("call-back hand-off", () => {
  it("records the request, emails ops, refuses without a phone", async () => {
    const bad = await runTool("request_callback", { name: "A", topic: "group" }, ctx) as { error?: string }; expect(bad.error).toMatch(/phone/);
    const r = await runTool("request_callback", { name: "Omar Haddad", phone: "+971 50 123 4567", topic: "private-hire", notes: "Birthday for 20 on a Friday night" }, ctx) as { recorded: boolean };
    expect(r.recorded).toBe(true);
    const [row] = await db.select().from(callbackRequests); expect(row).toMatchObject({ name: "Omar Haddad", topic: "private-hire", source: "voice", status: "open" });
    const out = await processOutbox(fakes); expect(out.sent).toBe(1); expect(sent.at(-1)).toMatchObject({ to: "hello@noa-dubai.com", subject: expect.stringContaining("Call-back request · private-hire · Omar Haddad") });
  });
});

describe("new-booking alert and shuttle alert", () => {
  it("ops gets one email per confirmed booking; shuttle alert queues only inside the window and only once", async () => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(new Date());
    const h = await createHold({ date: "2027-10-10", slot: "afternoon", unitId: "cabana-3", cartToken: "s1" });
    const p = await createPendingBooking("s1", [{ holdId: h.holdId, guests: 4, arrivalTime: "16:00" }], { name: "Shuttle Test", email: "shuttle@example.com", phone: "+971500000090" });
    await attachPaymentIntent(p.bookingId, "pi_staff"); expect(await confirmBookingByPaymentIntent("pi_staff")).toBe("confirmed");
    const st = await staffBookingSummary(p.bookingId); expect(st?.subject).toContain(`New booking ${p.ref}`);
    expect(await enqueueStaffEmail(st!.to, "staff_new_booking", st!.subject, st!.text, undefined, p.bookingId)).toBe(1);
    expect(await enqueueStaffEmail(st!.to, "staff_new_booking", st!.subject, st!.text, undefined, p.bookingId)).toBe(0);   // exactly once per booking
    // far-future arrival → not in the 2-hour window
    expect(await enqueueShuttleAlerts(2)).toBe(0);
    // move the session to today and the arrival to 90 minutes from now (Dubai) → inside the window
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" })); const arr = new Date(now.getTime() + 90 * 60_000);
    const hhmm = `${String(arr.getHours()).padStart(2, "0")}:${String(arr.getMinutes()).padStart(2, "0")}`;
    await db.execute(sql`UPDATE sessions SET date = ${today} WHERE id = (SELECT session_id FROM booking_items WHERE booking_id = ${p.bookingId})`);
    await db.execute(sql`UPDATE booking_items SET arrival_time = ${hhmm} WHERE booking_id = ${p.bookingId}`);
    expect(await enqueueShuttleAlerts(2)).toBe(2);   // email + WhatsApp rows
    expect(await enqueueShuttleAlerts(2)).toBe(0);
    const rows = await db.select().from(notificationLog).where(eq(notificationLog.bookingId, p.bookingId));
    expect(rows.map((r) => r.template).sort()).toEqual(["shuttle_alert", "shuttle_alert", "staff_new_booking"]);
  });
});
