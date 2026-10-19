/** Outbox tests on real Postgres with fake providers: exactly-once, rendering EN/AR, ICS, retries, reminders, skip when unconfigured. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { bookings, notificationLog, sessions } from "@/db/schema";
import { seed } from "@/db/seed";
import { attachPaymentIntent, confirmBookingByPaymentIntent, createHold, createPendingBooking } from "@/server/booking";
import { enqueueBookingMessages, enqueueReminders, processOutbox, type Providers } from "@/server/notifications/outbox";
import { renderEmail, renderWhatsApp } from "@/server/notifications/templates";
import { toE164 } from "@/server/notifications/providers/twilio";
import type { BookingContext } from "@/server/notifications/types";

const sentEmails: { to: string; subject: string; ics?: string }[] = [];
const sentWa: { to: string; sid: string; vars: Record<string, string> }[] = [];
let failNext = 0;
const fakes: Providers = {
  email: { async send(to, msg) { if (failNext > 0) { failNext--; throw new Error("smtp down"); } sentEmails.push({ to, subject: msg.subject, ics: msg.ics?.content }); return { id: `em_${sentEmails.length}` }; } },
  whatsapp: { async send(to, msg) { sentWa.push({ to, sid: msg.contentSid, vars: msg.variables }); return { id: `wa_${sentWa.length}` }; } },
};

async function confirmedBooking(unitId: string, locale: "en" | "ar", phone = "+971501234567", date = "2027-03-20") {
  const h = await createHold({ date, slot: "afternoon", unitId, cartToken: `cart-${unitId}` });
  const p = await createPendingBooking(`cart-${unitId}`, [{ holdId: h.holdId, guests: 2, arrivalTime: "15:00" }], { name: locale === "ar" ? "سارة" : "Sarah Test", email: `${unitId}@example.com`, phone, locale });
  await attachPaymentIntent(p.bookingId, `pi_${unitId}`);
  expect(await confirmBookingByPaymentIntent(`pi_${unitId}`)).toBe("confirmed");
  return p.bookingId;
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed();
  await db.execute(sql`TRUNCATE holds, booking_items, payments, notification_log, bookings, guests, sessions CASCADE`);
  process.env.WHATSAPP_CONTENT_SIDS = JSON.stringify({ "booking_confirmed:en": "HXen", "booking_confirmed:ar": "HXar", "booking_reminder_24h:en": "HXrem" });
});
afterAll(async () => { await pool.end(); });

describe("templates", () => {
  const ctx: BookingContext = { ref: "NOA-TEST01", guestName: "Sarah", email: "s@example.com", phone: "+971501234567", locale: "en", total: 2310, manageUrl: "https://noa-dubai.com/en/booking/confirmation?ref=NOA-TEST01", items: [{ unitName: "Pool Daybed", date: "2027-03-20", slot: "afternoon", guests: 2, arrivalTime: "15:00" }] };
  it("renders the confirmation with an ICS invite in Asia/Dubai", () => {
    const e = renderEmail("booking_confirmed", ctx);
    expect(e.subject).toContain("NOA-TEST01");
    expect(e.text).toContain("AED 2,310");
    expect(e.ics?.content).toContain("DTSTART;TZID=Asia/Dubai:20270320T140000");
    expect(e.ics?.content).toContain("DTEND;TZID=Asia/Dubai:20270320T213000");
    expect(e.html).toContain('dir="ltr"');
  });
  it("renders Arabic right-to-left", () => {
    const e = renderEmail("booking_reminder_24h", { ...ctx, locale: "ar", guestName: "سارة", items: [{ ...ctx.items[0], unitName: "سرير نهاري" }] });
    expect(e.html).toContain('dir="rtl"');
    expect(e.text).toContain("سرير نهاري");
  });
  it("WhatsApp uses the approved template SID for the locale and positional variables", () => {
    const w = renderWhatsApp("booking_confirmed", { ...ctx, locale: "ar" });
    expect(w?.contentSid).toBe("HXar");
    expect(w?.variables["2"]).toBe("NOA-TEST01");
    expect(renderWhatsApp("shuttle_alert", ctx)).toBeNull(); // no SID configured → not sent
  });
  it("normalises UAE phone numbers to E.164", () => {
    expect(toE164("050 123 4567")).toBe("+971501234567");
    expect(toE164("+971 50 123 4567")).toBe("+971501234567");
    expect(toE164("0044 7700 900123")).toBe("+447700900123");
    expect(toE164("abc")).toBeNull();
  });
});

describe("outbox", () => {
  it("confirmation queues email + WhatsApp exactly once, worker sends both", async () => {
    const id = await confirmedBooking("daybed-1", "en");
    expect(await enqueueBookingMessages(id, "booking_confirmed")).toBe(2);
    expect(await enqueueBookingMessages(id, "booking_confirmed")).toBe(0);   // replay → nothing new
    const r = await processOutbox(fakes);
    expect(r.sent).toBe(2);
    expect(sentEmails.at(-1)?.to).toBe("daybed-1@example.com");
    expect(sentEmails.at(-1)?.ics).toContain("BEGIN:VCALENDAR");
    expect(sentWa.at(-1)).toMatchObject({ to: "+971501234567", sid: "HXen" });
    const rows = await db.select().from(notificationLog).where(eq(notificationLog.bookingId, id));
    expect(rows.every((x) => x.status === "sent" && x.providerId)).toBe(true);
  });
  it("a failed send is retried with backoff, then succeeds", async () => {
    const id = await confirmedBooking("daybed-2", "ar", "0501112222");
    await enqueueBookingMessages(id, "booking_confirmed");
    failNext = 1;
    const r1 = await processOutbox(fakes);
    expect(r1.failed).toBe(1);
    const [row] = await db.select().from(notificationLog).where(sql`${notificationLog.bookingId} = ${id} AND ${notificationLog.channel} = 'email'`);
    expect(row.status).toBe("queued"); expect(row.attempts).toBe(1); expect(row.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
    await db.update(notificationLog).set({ nextAttemptAt: sql`now()` }).where(eq(notificationLog.id, row.id));   // fast-forward the clock
    const r2 = await processOutbox(fakes);
    expect(r2.sent).toBe(1);
    expect(sentEmails.at(-1)?.subject).toContain("تم تأكيد حجزك");
  });
  it("without providers configured, messages are marked skipped (never silently lost)", async () => {
    const id = await confirmedBooking("sunbed-1", "en");
    await enqueueBookingMessages(id, "booking_confirmed");
    const r = await processOutbox({ email: null, whatsapp: null });
    expect(r.skipped).toBe(2);
  });
  it("reminders queue once for tomorrow's confirmed bookings", async () => {
    const id = await confirmedBooking("sunbed-2", "en", "+971501234567", "2027-03-21"); // its own session, so only this booking moves to tomorrow
    const tomorrow = await db.execute<{ d: string }>(sql`SELECT ((now() AT TIME ZONE 'Asia/Dubai')::date + 1)::text AS d`);
    const [item] = await db.select({ sessionId: sql<string>`session_id` }).from(sql`booking_items`).where(sql`booking_id = ${id}`);
    await db.update(sessions).set({ date: tomorrow.rows[0].d }).where(eq(sessions.id, item.sessionId));
    const n1 = await enqueueReminders(); const n2 = await enqueueReminders();
    expect(n1).toBe(2); expect(n2).toBe(0);
    const r = await processOutbox(fakes);
    expect(r.sent).toBe(2);
    expect(sentWa.at(-1)?.sid).toBe("HXrem");
    const [b] = await db.select().from(bookings).where(eq(bookings.id, id)); expect(b.status).toBe("confirmed");
  });
});
