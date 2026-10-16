import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLog, bookingItems, bookings, guests, inventoryUnits, notificationLog, payments, sessions, settings, unitTypes } from "@/db/schema";
import { cancelBooking } from "@/server/booking";
import { clearManualTier, setManualTier, type Tier } from "@/server/vip";
import { stripe } from "@/server/stripe";
import { enqueueBookingMessages } from "@/server/notifications/outbox";

/**
 * Admin data layer. Every mutation writes an audit row (who, what, before, after).
 * Role checks happen in the callers (requireAdmin); these functions take the already-verified actor.
 */
export interface Actor { email: string; role: string }

async function audit(actor: Actor, action: string, entity: string, entityId: string, before: unknown, after: unknown) {
  await db.insert(auditLog).values({ actor: actor.email, role: actor.role, action, entity, entityId, before: before as Record<string, unknown>, after: after as Record<string, unknown> });
}

/* ---------- bookings ---------- */

export async function listBookings(opts: { from?: string; to?: string; status?: string; q?: string; limit?: number } = {}) {
  const where = [];
  if (opts.status) where.push(eq(bookings.status, opts.status as typeof bookings.status.enumValues[number]));
  if (opts.q) where.push(sql`(${bookings.ref} ILIKE ${"%" + opts.q + "%"} OR ${guests.email} ILIKE ${"%" + opts.q + "%"} OR ${guests.name} ILIKE ${"%" + opts.q + "%"})`);
  const rows = await db.select({
    id: bookings.id, ref: bookings.ref, status: bookings.status, total: bookings.total, createdAt: bookings.createdAt, source: bookings.source,
    guestName: guests.name, guestEmail: guests.email, guestPhone: guests.phone, tier: guests.tier,
    firstDate: sql<string>`(SELECT MIN(s.date) FROM booking_items bi JOIN sessions s ON s.id = bi.session_id WHERE bi.booking_id = ${bookings.id})`,
    units: sql<number>`(SELECT COUNT(*) FROM booking_items bi WHERE bi.booking_id = ${bookings.id})`,
  }).from(bookings).innerJoin(guests, eq(guests.id, bookings.guestId))
    .where(where.length ? and(...where) : undefined).orderBy(desc(bookings.createdAt)).limit(opts.limit ?? 100);
  if (!opts.from && !opts.to) return rows;
  return rows.filter((r) => (!opts.from || r.firstDate >= opts.from) && (!opts.to || r.firstDate <= opts.to));
}

export async function getBooking(id: string) {
  const [b] = await db.select({ booking: bookings, guest: guests }).from(bookings).innerJoin(guests, eq(guests.id, bookings.guestId)).where(eq(bookings.id, id));
  if (!b) return null;
  const items = await db.select({ item: bookingItems, date: sessions.date, slot: sessions.slot, unitName: unitTypes.nameEn, label: inventoryUnits.label })
    .from(bookingItems).innerJoin(sessions, eq(sessions.id, bookingItems.sessionId)).innerJoin(inventoryUnits, eq(inventoryUnits.id, bookingItems.unitId)).innerJoin(unitTypes, eq(unitTypes.id, inventoryUnits.unitTypeId))
    .where(eq(bookingItems.bookingId, id));
  const pays = await db.select().from(payments).where(eq(payments.bookingId, id)).orderBy(desc(payments.createdAt));
  const notes = await db.select().from(notificationLog).where(eq(notificationLog.bookingId, id)).orderBy(desc(notificationLog.createdAt));
  return { ...b, items, payments: pays, notifications: notes };
}

/** Refund a confirmed booking (full or partial, AED whole dirhams). Stripe first, then the booking state, then the guest message. */
export async function refundBooking(actor: Actor, bookingId: string, amountAed?: number, reason = "requested_by_customer") {
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!b) throw new Error("Booking not found");
  if (b.status !== "confirmed") throw new Error(`Cannot refund a ${b.status} booking`);
  if (!b.stripePaymentIntentId) throw new Error("No payment on this booking");
  const s = stripe();
  if (!s) throw new Error("Stripe is not configured");
  const amount = amountAed ?? b.total;
  if (amount <= 0 || amount > b.total) throw new Error("Refund amount out of range");
  const refund = await s.refunds.create({ payment_intent: b.stripePaymentIntentId, amount: amount * 100, reason: reason as "requested_by_customer" | "duplicate" | "fraudulent", metadata: { admin: actor.email } }, { idempotencyKey: `admin-refund-${bookingId}-${amount}` });
  await db.insert(payments).values({ bookingId, provider: "stripe", providerId: refund.id, kind: "refund", amount: refund.amount, status: amount === b.total ? "refunded" : "partially_refunded", raw: refund as unknown as Record<string, unknown> }).onConflictDoNothing();
  if (amount === b.total) { await cancelBooking(bookingId, "refunded"); await enqueueBookingMessages(bookingId, "booking_late_refunded"); }
  await audit(actor, "booking.refund", "bookings", bookingId, { status: b.status, total: b.total }, { refunded: amount, refundId: refund.id });
  return { refundId: refund.id, amount };
}

export async function cancelBookingAdmin(actor: Actor, bookingId: string) {
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!b) throw new Error("Booking not found");
  if (b.status !== "pending" && b.status !== "confirmed") throw new Error(`Cannot cancel a ${b.status} booking`);
  await cancelBooking(bookingId, "cancelled");
  await audit(actor, "booking.cancel", "bookings", bookingId, { status: b.status }, { status: "cancelled" });
}

/* ---------- guests ---------- */

export async function listGuests(q?: string, limit = 200) {
  return db.select({
    id: guests.id, email: guests.email, name: guests.name, phone: guests.phone, tier: guests.tier, tierManual: guests.tierManual, locale: guests.locale, createdAt: guests.createdAt, lastBookingAt: guests.lastBookingAt,
    bookings: sql<number>`(SELECT COUNT(*) FROM bookings b WHERE b.guest_id = ${guests.id} AND b.status = 'confirmed')`,
    spend: sql<number>`COALESCE((SELECT SUM(b.total) FROM bookings b WHERE b.guest_id = ${guests.id} AND b.status = 'confirmed'), 0)`,
  }).from(guests).where(q ? sql`(${guests.email} ILIKE ${"%" + q + "%"} OR ${guests.name} ILIKE ${"%" + q + "%"} OR ${guests.phone} ILIKE ${"%" + q + "%"})` : undefined)
    .orderBy(desc(guests.lastBookingAt)).limit(limit);
}

export async function setGuestTier(actor: Actor, guestId: string, tier: Tier | "auto") {
  const [g] = await db.select({ tier: guests.tier, manual: guests.tierManual }).from(guests).where(eq(guests.id, guestId));
  if (!g) throw new Error("Guest not found");
  if (tier === "auto") await clearManualTier(guestId); else await setManualTier(guestId, tier);
  await audit(actor, "guest.tier.set", "guests", guestId, g, { tier, manual: tier !== "auto" });
}

export function guestsCsv(rows: Awaited<ReturnType<typeof listGuests>>): string {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["email", "name", "phone", "tier", "tier_manual", "locale", "confirmed_bookings", "lifetime_spend_aed", "last_booking_at", "created_at"];
  return [head.join(","), ...rows.map((r) => [r.email, r.name, r.phone, r.tier, r.tierManual, r.locale, r.bookings, r.spend, r.lastBookingAt?.toISOString(), r.createdAt.toISOString()].map(esc).join(","))].join("\n");
}

/* ---------- inventory ---------- */

export async function listInventory() {
  const types = await db.select().from(unitTypes).orderBy(desc(unitTypes.tier));
  const units = await db.select().from(inventoryUnits).orderBy(inventoryUnits.deck, inventoryUnits.sort);
  return { types, units };
}

export async function updateUnitType(actor: Actor, id: string, patch: Partial<{ priceMorning: number; priceAfternoon: number; pax: number; tier: number; active: boolean; nameEn: string; nameAr: string }>) {
  const [before] = await db.select().from(unitTypes).where(eq(unitTypes.id, id));
  if (!before) throw new Error("Unit type not found");
  for (const k of ["priceMorning", "priceAfternoon", "pax", "tier"] as const) if (patch[k] !== undefined && (!Number.isInteger(patch[k]) || (patch[k] as number) < 0)) throw new Error(`${k} must be a non-negative integer`);
  const [after] = await db.update(unitTypes).set(patch).where(eq(unitTypes.id, id)).returning();
  await audit(actor, "unit_type.update", "unit_types", id, before, after);
  return after;
}

export async function updateUnit(actor: Actor, id: string, patch: Partial<{ vipPriority: boolean; active: boolean; label: string }>) {
  const [before] = await db.select().from(inventoryUnits).where(eq(inventoryUnits.id, id));
  if (!before) throw new Error("Unit not found");
  const [after] = await db.update(inventoryUnits).set(patch).where(eq(inventoryUnits.id, id)).returning();
  await audit(actor, "unit.update", "inventory_units", id, before, after);
  return after;
}

/* ---------- sessions (close a day / slot) ---------- */

export async function setSessionStatus(actor: Actor, date: string, slot: "morning" | "afternoon", status: "open" | "closed") {
  const [before] = await db.select().from(sessions).where(and(eq(sessions.date, date), eq(sessions.slot, slot)));
  const [after] = before
    ? await db.update(sessions).set({ status }).where(eq(sessions.id, before.id)).returning()
    : await db.insert(sessions).values({ date, slot, status }).returning();
  await audit(actor, "session.status", "sessions", after.id, before ?? null, after);
  return after;
}

export async function listSessions(from: string, to: string) {
  return db.select({
    id: sessions.id, date: sessions.date, slot: sessions.slot, status: sessions.status, vipReleaseAt: sessions.vipReleaseAt,
    booked: sql<number>`(SELECT COUNT(*) FROM booking_items bi WHERE bi.session_id = ${sessions.id} AND bi.active)`,
    held: sql<number>`(SELECT COUNT(*) FROM holds h WHERE h.session_id = ${sessions.id} AND h.released_at IS NULL AND h.expires_at > now())`,
  }).from(sessions).where(and(gte(sessions.date, from), lte(sessions.date, to))).orderBy(sessions.date, sessions.slot);
}

/* ---------- settings ---------- */

const SETTING_KEYS = ["hold_minutes", "hold_extension_minutes", "vat_rate", "vip_release_hours", "tier_rules", "max_holds_per_cart"] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export async function listSettings() {
  const rows = await db.select().from(settings).where(inArray(settings.key, [...SETTING_KEYS]));
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<SettingKey, unknown>;
}

export async function updateSetting(actor: Actor, key: SettingKey, value: unknown) {
  if (!SETTING_KEYS.includes(key)) throw new Error("Unknown setting");
  if (["hold_minutes", "hold_extension_minutes", "vip_release_hours", "max_holds_per_cart"].includes(key) && (!Number.isInteger(value) || (value as number) < 1 || (value as number) > 1440)) throw new Error(`${key} must be 1–1440`);
  if (key === "vat_rate" && (typeof value !== "number" || value < 0 || value > 1)) throw new Error("vat_rate must be between 0 and 1");
  const [before] = await db.select().from(settings).where(eq(settings.key, key));
  const [after] = await db.insert(settings).values({ key, value: value as Record<string, unknown> }).onConflictDoUpdate({ target: settings.key, set: { value: value as Record<string, unknown>, updatedAt: sql`now()` } }).returning();
  await audit(actor, "settings.update", "settings", key, before?.value ?? null, after.value);
  return after;
}

/* ---------- notifications & audit ---------- */

export async function listNotifications(limit = 200) {
  return db.select().from(notificationLog).orderBy(desc(notificationLog.createdAt)).limit(limit);
}
export async function retryNotification(actor: Actor, id: string) {
  const [before] = await db.select().from(notificationLog).where(eq(notificationLog.id, id));
  if (!before) throw new Error("Not found");
  await db.update(notificationLog).set({ status: "queued", nextAttemptAt: sql`now()`, error: null }).where(eq(notificationLog.id, id));
  await audit(actor, "notification.retry", "notification_log", id, { status: before.status, attempts: before.attempts }, { status: "queued" });
}
export async function listAudit(limit = 200) {
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
}
