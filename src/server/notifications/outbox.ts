import { ticketToken, ticketUrl } from "@/server/ticket";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, type Db, type Tx } from "@/db/client";
import { bookingItems, bookings, guests, inventoryUnits, notificationLog, sessions, unitTypes } from "@/db/schema";
import type { BookingContext, Channel, EmailProvider, Locale, Template, WhatsAppProvider } from "./types";
import { renderEmail, renderWhatsApp } from "./templates";
import { resendProvider } from "./providers/resend";
import { toE164, twilioWhatsAppProvider } from "./providers/twilio";

type DbOrTx = Db | Tx;

/**
 * Outbox pattern: confirmation/refund/reminder messages are first written as `queued` rows
 * (inside the same transaction context as the booking change where possible), then a worker
 * sends them with retries. The partial unique index notification_once_uq makes every
 * booking × template × channel exactly-once, so replays and cron overlaps cannot double-send.
 */
export async function enqueueBookingMessages(bookingId: string, template: Template, conn: DbOrTx = db): Promise<number> {
  const ctx = await loadContext(bookingId, conn);
  if (!ctx) return 0;
  const rows: (typeof notificationLog.$inferInsert)[] = [
    { bookingId, channel: "email", template, to: ctx.email, locale: ctx.locale, status: "queued" },
  ];
  const phone = ctx.phone ? toE164(ctx.phone) : null;
  if (phone) rows.push({ bookingId, channel: "whatsapp", template, to: phone, locale: ctx.locale, status: "queued" });
  const inserted = await conn.insert(notificationLog).values(rows).onConflictDoNothing().returning({ id: notificationLog.id });
  return inserted.length;
}

export interface Providers { email: EmailProvider | null; whatsapp: WhatsAppProvider | null }
export const liveProviders = (): Providers => ({ email: resendProvider(), whatsapp: twilioWhatsAppProvider() });

const BACKOFF_MINUTES = [1, 5, 30, 120, 720]; // then give up

/** Worker: send due queued messages. Safe to run concurrently (SKIP LOCKED). */
export async function processOutbox(providers: Providers = liveProviders(), limit = 50): Promise<{ sent: number; failed: number; skipped: number }> {
  const result = { sent: 0, failed: 0, skipped: 0 };
  const due = await db.transaction(async (tx) => {
    const rows = await tx.execute<{ id: string }>(sql`
      SELECT id FROM notification_log WHERE status = 'queued' AND next_attempt_at <= now()
      ORDER BY next_attempt_at LIMIT ${limit} FOR UPDATE SKIP LOCKED`);
    const ids = rows.rows.map((r) => r.id);
    if (ids.length) await tx.update(notificationLog).set({ status: "sending" }).where(inArray(notificationLog.id, ids));
    return ids;
  });

  for (const id of due) {
    const [row] = await db.select().from(notificationLog).where(eq(notificationLog.id, id));
    if (!row) continue;
    const ctx = row.bookingId ? await loadContext(row.bookingId) : null;
    if (!ctx) { await db.update(notificationLog).set({ status: "failed", error: "booking context missing" }).where(eq(notificationLog.id, id)); result.failed++; continue; }
    try {
      const sent = await sendOne(row.channel as Channel, row.template as Template, row.to, ctx, providers);
      if (sent === "skipped") {
        await db.update(notificationLog).set({ status: "skipped", error: "provider not configured", payload: { template: row.template } }).where(eq(notificationLog.id, id));
        result.skipped++;
      } else {
        await db.update(notificationLog).set({ status: "sent", providerId: sent.id, payload: sent.payload, sentAt: sql`now()`, attempts: row.attempts + 1, error: null }).where(eq(notificationLog.id, id));
        result.sent++;
      }
    } catch (e) {
      const attempts = row.attempts + 1;
      const backoff = BACKOFF_MINUTES[attempts - 1];
      await db.update(notificationLog).set({
        status: backoff ? "queued" : "failed", attempts, error: String(e).slice(0, 500),
        nextAttemptAt: backoff ? sql`now() + make_interval(mins => ${backoff})` : row.nextAttemptAt,
      }).where(eq(notificationLog.id, id));
      result.failed++;
    }
  }
  return result;
}

async function sendOne(channel: Channel, template: Template, to: string, ctx: BookingContext, p: Providers): Promise<{ id: string; payload: unknown } | "skipped"> {
  if (channel === "email") {
    if (!p.email) return "skipped";
    const msg = renderEmail(template, ctx);
    const r = await p.email.send(to, msg);
    return { id: r.id, payload: { subject: msg.subject, text: msg.text, ics: !!msg.ics } };
  }
  if (!p.whatsapp) return "skipped";
  const msg = renderWhatsApp(template, ctx);
  if (!msg) return "skipped"; // no approved template SID for this template/locale yet
  const r = await p.whatsapp.send(to, msg);
  return { id: r.id, payload: { contentSid: msg.contentSid, variables: msg.variables } };
}

/** Reminders: queue the 24-hour message for every confirmed booking whose session is tomorrow (Dubai time). Idempotent. */
export async function enqueueReminders(conn: DbOrTx = db): Promise<number> {
  const rows = await conn.execute<{ booking_id: string }>(sql`
    SELECT DISTINCT b.id AS booking_id
    FROM bookings b JOIN booking_items bi ON bi.booking_id = b.id AND bi.active
    JOIN sessions s ON s.id = bi.session_id
    WHERE b.status = 'confirmed' AND s.date = (now() AT TIME ZONE 'Asia/Dubai')::date + 1`);
  let n = 0;
  for (const r of rows.rows) n += await enqueueBookingMessages(r.booking_id, "booking_reminder_24h", conn);
  return n;
}

async function loadContext(bookingId: string, conn: DbOrTx = db): Promise<BookingContext | null> {
  const [b] = await conn.select({ booking: bookings, guest: guests }).from(bookings).innerJoin(guests, eq(guests.id, bookings.guestId)).where(eq(bookings.id, bookingId));
  if (!b) return null;
  const locale = (b.booking.locale === "ar" ? "ar" : "en") as Locale;
  const items = await conn.select({ date: sessions.date, slot: sessions.slot, guests: bookingItems.guests, arrivalTime: bookingItems.arrivalTime, nameEn: unitTypes.nameEn, nameAr: unitTypes.nameAr })
    .from(bookingItems).innerJoin(sessions, eq(sessions.id, bookingItems.sessionId)).innerJoin(inventoryUnits, eq(inventoryUnits.id, bookingItems.unitId)).innerJoin(unitTypes, eq(unitTypes.id, inventoryUnits.unitTypeId))
    .where(and(eq(bookingItems.bookingId, bookingId), eq(bookingItems.active, true)));
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noa-dubai.com";
  return {
    ref: b.booking.ref, guestName: b.guest.name ?? "Guest", email: b.guest.email, phone: b.guest.phone, locale, total: b.booking.total,
    items: items.map((i) => ({ unitName: locale === "ar" ? i.nameAr : i.nameEn, date: i.date, slot: i.slot, guests: i.guests, arrivalTime: i.arrivalTime })),
    manageUrl: `${base}/${locale}/booking/manage?ref=${b.booking.ref}`,
    ticketUrl: ticketUrl(base, locale, b.booking.ref),
    qrImageUrl: `${base}/api/bookings/qr/${ticketToken(b.booking.ref)}.png`,
    ticketToken: ticketToken(b.booking.ref),
  };
}
