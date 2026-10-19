import { and, eq, gt, inArray, isNull, lt, sql } from "drizzle-orm";
import { db, type Db, type Tx } from "@/db/client";
import {
  bookingItems, bookings, guests, holds, inventoryUnits, sessions, settings, unitTypes,
} from "@/db/schema";
import { canBookPriority, getVipReleaseHours, type Tier } from "./vip";
import { broadcastSafely } from "./realtime";
import { basePrice, CapacityReachedError, eventForSession, eventPrice, saleState, SaleNotOpenError, sessionCommitted, typeOnSale, TypeNotOnSaleError } from "@/server/events/ticketing";

export type Slot = "morning" | "afternoon" | "night" | "full";
type DbOrTx = Db | Tx;

/* ------------------------------------------------------------------ settings */

const DEFAULTS = { hold_minutes: 7, hold_extension_minutes: 3, vat_rate: 0.05, max_holds_per_cart: 6 } as const;
type SettingKey = keyof typeof DEFAULTS;

export async function getSetting<K extends SettingKey>(key: K, conn: DbOrTx = db): Promise<(typeof DEFAULTS)[K]> {
  const row = await conn.select({ value: settings.value }).from(settings).where(eq(settings.key, key)).limit(1);
  return (row[0]?.value as (typeof DEFAULTS)[K] | undefined) ?? DEFAULTS[key];
}

/* ------------------------------------------------------------------ sessions */

export async function getOrCreateSession(date: string, slot: Slot, conn: DbOrTx = db) {
  const found = await conn.select().from(sessions).where(and(eq(sessions.date, date), eq(sessions.slot, slot))).limit(1);
  if (found[0]) return found[0];
  const hours = await getVipReleaseHours(conn);
  const start = { morning: "09:30", afternoon: "14:00", night: "21:30", full: "09:30" }[slot];
  const inserted = await conn.insert(sessions).values({
    date, slot,
    vipReleaseAt: sql`(${date}::date + ${start}::time) AT TIME ZONE 'Asia/Dubai' - make_interval(hours => ${hours})`,
  }).onConflictDoNothing({ target: [sessions.date, sessions.slot] }).returning();
  if (inserted[0]) return inserted[0];
  const again = await conn.select().from(sessions).where(and(eq(sessions.date, date), eq(sessions.slot, slot))).limit(1);
  return again[0];
}

/* --------------------------------------------------------------- unit types */

export interface UnitTypeInfo { id: string; nameEn: string; nameAr: string; descEn: string; descAr: string; pax: number; perPerson: boolean; tier: number; imageSlot: string | null; priceMorning: number; priceAfternoon: number }

export async function listUnitTypes(conn: DbOrTx = db): Promise<Record<string, UnitTypeInfo>> {
  const rows = await conn.select({ id: unitTypes.id, nameEn: unitTypes.nameEn, nameAr: unitTypes.nameAr, descEn: unitTypes.descEn, descAr: unitTypes.descAr, pax: unitTypes.pax, perPerson: unitTypes.perPerson, tier: unitTypes.tier, imageSlot: unitTypes.imageSlot, priceMorning: unitTypes.priceMorning, priceAfternoon: unitTypes.priceAfternoon })
    .from(unitTypes).where(eq(unitTypes.active, true));
  return Object.fromEntries(rows.map((r) => [r.id, r]));
}

/* --------------------------------------------------------------- availability */

export interface UnitAvailability {
  unitId: string;
  unitTypeId: string;
  price: number;
  pax: number;
  state: "free" | "held" | "booked" | "yours" | "reserved" | "closed";
  heldUntil?: string;
  vipPriority: boolean;
  /** when a VIP-priority unit opens to everyone */
  releaseAt?: string;
}

/**
 * Availability for one session. `cartToken` marks the caller's own holds as "yours".
 * Expired holds count as free even before the sweeper runs.
 */
export async function getAvailability(date: string, slot: Slot, cartToken?: string, tier: Tier = "guest"): Promise<UnitAvailability[]> {
  const session = await getOrCreateSession(date, slot);
  const reservedNow = !!session.vipReleaseAt && session.vipReleaseAt.getTime() > Date.now() && !canBookPriority(tier);
  const ev = await eventForSession(date, slot);
  const sale = saleState(ev, tier);
  const rows = await db.execute<{
    unit_id: string; unit_type_id: string; pax: number; price_morning: number; price_afternoon: number;
    vip_priority: boolean; hold_token: string | null; hold_expires: string | null; booked: boolean;
  }>(sql`
    SELECT u.id AS unit_id, u.unit_type_id, t.pax, t.price_morning, t.price_afternoon, u.vip_priority,
           h.cart_token AS hold_token, h.expires_at AS hold_expires,
           EXISTS (SELECT 1 FROM booking_items bi WHERE bi.session_id = ${session.id} AND bi.unit_id = u.id AND bi.active) AS booked
    FROM inventory_units u
    JOIN unit_types t ON t.id = u.unit_type_id
    LEFT JOIN holds h ON h.session_id = ${session.id} AND h.unit_id = u.id AND h.released_at IS NULL AND h.expires_at > now()
    WHERE u.active AND t.active
    ORDER BY u.deck, u.sort, u.id
  `);
  return rows.rows.map((r) => ({
    unitId: r.unit_id,
    unitTypeId: r.unit_type_id,
    pax: r.pax,
    price: eventPrice(ev, r.unit_type_id, basePrice(slot, r.price_morning, r.price_afternoon)),
    vipPriority: r.vip_priority,
    state: r.booked ? "booked" : r.hold_token ? (cartToken && r.hold_token === cartToken ? "yours" : "held")
      : !typeOnSale(ev, r.unit_type_id) || sale === "closed" ? "closed"
      : sale === "not_yet" ? "reserved"
      : r.vip_priority && reservedNow ? "reserved" : "free",
    heldUntil: r.hold_expires ? new Date(r.hold_expires).toISOString() : undefined,
    releaseAt: r.vip_priority && session.vipReleaseAt ? session.vipReleaseAt.toISOString() : undefined,
  }));
}

/* ------------------------------------------------------------------- holds */

export class UnitUnavailableError extends Error {
  constructor(public unitId: string) { super(`Unit ${unitId} is no longer available`); }
}
export class CartLimitError extends Error {
  constructor(public limit: number) { super(`A cart can hold at most ${limit} seats at a time`); }
}
export class UnitReservedError extends Error {
  constructor(public unitId: string, public releaseAt: Date) { super(`Unit ${unitId} is reserved for members until ${releaseAt.toISOString()}`); }
}

export interface HoldResult { holdId: string; sessionId: string; unitId: string; expiresAt: string }

/**
 * Place a hold. Runs in one transaction:
 *   1. release any EXPIRED live hold on this unit (so the partial unique index can accept ours)
 *   2. refuse if an active booking item exists
 *   3. insert — the unique index `holds_live_unit_uq` is the real lock: two guests racing for the
 *      same unit produce exactly one row; the loser gets UnitUnavailableError.
 */
export async function createHold(input: { date: string; slot: Slot; unitId: string; cartToken: string; guestId?: string; tier?: Tier }): Promise<HoldResult> {
  const r = await createHoldTx(input);
  broadcastSafely(input.date, input.slot, [{ unitId: input.unitId, state: "held", heldUntil: r.expiresAt }]);
  return r;
}

async function createHoldTx(input: { date: string; slot: Slot; unitId: string; cartToken: string; guestId?: string; tier?: Tier }): Promise<HoldResult> {
  const holdMinutes = await getSetting("hold_minutes");
  const maxPerCart = await getSetting("max_holds_per_cart");
  return db.transaction(async (tx) => {
    const session = await getOrCreateSession(input.date, input.slot, tx);
    if (session.status !== "open") throw new UnitUnavailableError(input.unitId);

    const [unit] = await tx.select({ vipPriority: inventoryUnits.vipPriority, active: inventoryUnits.active, unitTypeId: inventoryUnits.unitTypeId }).from(inventoryUnits).where(eq(inventoryUnits.id, input.unitId));
    if (!unit || !unit.active) throw new UnitUnavailableError(input.unitId);
    if (unit.vipPriority && session.vipReleaseAt && session.vipReleaseAt.getTime() > Date.now() && !canBookPriority(input.tier ?? "guest")) {
      throw new UnitReservedError(input.unitId, session.vipReleaseAt);
    }
    // event ticketing: sales window (members presale), seat types on sale, capacity cap
    const ev = await eventForSession(input.date, input.slot, tx);
    if (ev) {
      const st = saleState(ev, input.tier ?? "guest");
      if (st === "closed" || st === "not_yet") throw new SaleNotOpenError(st, ev.ticketing.salesOpenAt);
      if (!typeOnSale(ev, unit.unitTypeId)) throw new TypeNotOnSaleError(unit.unitTypeId);
      if (ev.ticketing.capacityCap && (await sessionCommitted(session.id, tx)) >= ev.ticketing.capacityCap) throw new CapacityReachedError(ev.ticketing.capacityCap);
    }

    await tx.update(holds)
      .set({ releasedAt: sql`now()`, releaseReason: "expired" })
      .where(and(eq(holds.sessionId, session.id), eq(holds.unitId, input.unitId), isNull(holds.releasedAt), lt(holds.expiresAt, sql`now()`)));

    const booked = await tx.select({ id: bookingItems.id }).from(bookingItems)
      .where(and(eq(bookingItems.sessionId, session.id), eq(bookingItems.unitId, input.unitId), eq(bookingItems.active, true))).limit(1);
    if (booked[0]) throw new UnitUnavailableError(input.unitId);

    // same cart re-tapping its own seat: return the existing hold rather than erroring
    const mine = await tx.select().from(holds)
      .where(and(eq(holds.sessionId, session.id), eq(holds.unitId, input.unitId), isNull(holds.releasedAt), eq(holds.cartToken, input.cartToken))).limit(1);
    if (mine[0]) return { holdId: mine[0].id, sessionId: session.id, unitId: input.unitId, expiresAt: mine[0].expiresAt.toISOString() };

    // cinema rule: a cart may hold at most N live seats
    const live = await tx.select({ n: sql<number>`count(*)::int` }).from(holds)
      .where(and(eq(holds.cartToken, input.cartToken), isNull(holds.releasedAt), gt(holds.expiresAt, sql`now()`), isNull(holds.bookingId)));
    if (live[0].n >= maxPerCart) throw new CartLimitError(maxPerCart);

    try {
      const [row] = await tx.insert(holds).values({
        sessionId: session.id, unitId: input.unitId, cartToken: input.cartToken, guestId: input.guestId,
        expiresAt: sql`now() + make_interval(mins => ${holdMinutes})`,
      }).returning();
      return { holdId: row.id, sessionId: session.id, unitId: input.unitId, expiresAt: row.expiresAt.toISOString() };
    } catch (e) {
      if (isUniqueViolation(e)) throw new UnitUnavailableError(input.unitId);
      throw e;
    }
  });
}

export async function releaseHold(holdId: string, cartToken: string, reason = "cart"): Promise<boolean> {
  const res = await db.update(holds).set({ releasedAt: sql`now()`, releaseReason: reason })
    .where(and(eq(holds.id, holdId), eq(holds.cartToken, cartToken), isNull(holds.releasedAt), isNull(holds.bookingId))).returning({ id: holds.id, unitId: holds.unitId, sessionId: holds.sessionId });
  if (res[0]) {
    const [s] = await db.select({ date: sessions.date, slot: sessions.slot }).from(sessions).where(eq(sessions.id, res[0].sessionId));
    if (s) broadcastSafely(s.date, s.slot, [{ unitId: res[0].unitId, state: "free" }]);
  }
  return res.length > 0;
}

/** Cron: release expired holds and expire pending bookings whose holds are gone. */
export async function sweepExpired(conn: DbOrTx = db): Promise<{ holds: number; bookings: number }> {
  const released = await conn.update(holds).set({ releasedAt: sql`now()`, releaseReason: "expired" })
    .where(and(isNull(holds.releasedAt), lt(holds.expiresAt, sql`now()`))).returning({ bookingId: holds.bookingId, unitId: holds.unitId, sessionId: holds.sessionId });
  if (released.length) {
    const sess = await conn.select({ id: sessions.id, date: sessions.date, slot: sessions.slot }).from(sessions).where(inArray(sessions.id, [...new Set(released.map((r) => r.sessionId))]));
    for (const se of sess) broadcastSafely(se.date, se.slot, released.filter((r) => r.sessionId === se.id && !r.bookingId).map((r) => ({ unitId: r.unitId, state: "free" as const })));
  }
  const bookingIds = [...new Set(released.map((r) => r.bookingId).filter((x): x is string => !!x))];
  let expiredBookings = 0;
  if (bookingIds.length) {
    const expired = await conn.update(bookings).set({ status: "expired", cancelledAt: sql`now()` })
      .where(and(inArray(bookings.id, bookingIds), eq(bookings.status, "pending"))).returning({ id: bookings.id });
    if (expired.length) {
      await conn.update(bookingItems).set({ active: false }).where(inArray(bookingItems.bookingId, expired.map((b) => b.id)));
      expiredBookings = expired.length;
    }
  }
  return { holds: released.length, bookings: expiredBookings };
}

/* ------------------------------------------------------------------ bookings */

export interface CartLine { holdId: string; guests: number; arrivalTime: string }
export interface GuestDetails { name: string; email: string; phone: string; locale?: string; marketingOptIn?: boolean }

export interface PendingBooking {
  bookingId: string; ref: string; total: number; subtotal: number; vat: number; currency: "AED"; holdsExtendedUntil: string;
}

/**
 * Turn a cart of live holds into a pending booking (one transaction):
 *   - every hold must be live, unattached, and owned by this cart
 *   - prices are read from the database, never from the client
 *   - holds are attached to the booking and extended ONCE by hold_extension_minutes
 *     so a 3-D Secure challenge cannot time the guest out
 *   - booking_items are inserted as active → the second DB-level exclusivity guard
 * The caller then creates the Stripe PaymentIntent and stores its id with attachPaymentIntent().
 */
export async function createPendingBooking(cartToken: string, lines: CartLine[], guest: GuestDetails, source = "web"): Promise<PendingBooking> {
  if (!lines.length) throw new Error("Cart is empty");
  const vatRate = await getSetting("vat_rate");
  const extension = await getSetting("hold_extension_minutes");

  return db.transaction(async (tx) => {
    const holdRows = await tx.select({
      hold: holds, slot: sessions.slot, date: sessions.date, unitTypeId: inventoryUnits.unitTypeId, priceMorning: unitTypes.priceMorning, priceAfternoon: unitTypes.priceAfternoon,
      perPerson: unitTypes.perPerson, pax: unitTypes.pax,
    }).from(holds)
      .innerJoin(sessions, eq(sessions.id, holds.sessionId))
      .innerJoin(inventoryUnits, eq(inventoryUnits.id, holds.unitId))
      .innerJoin(unitTypes, eq(unitTypes.id, inventoryUnits.unitTypeId))
      .where(and(inArray(holds.id, lines.map((l) => l.holdId)), eq(holds.cartToken, cartToken), isNull(holds.releasedAt), isNull(holds.bookingId), gt(holds.expiresAt, sql`now()`)))
      .for("update");
    if (holdRows.length !== lines.length) {
      const have = new Set(holdRows.map((h) => h.hold.id));
      throw new UnitUnavailableError(lines.find((l) => !have.has(l.holdId))?.holdId ?? "unknown");
    }

    const guestRow = await upsertGuest(guest, tx);

    const evCache = new Map<string, Awaited<ReturnType<typeof eventForSession>>>();
    for (const h of holdRows) { const k = `${h.date}#${h.slot}`; if (!evCache.has(k)) evCache.set(k, await eventForSession(h.date, h.slot, tx)); }
    const items = lines.map((l) => {
      const h = holdRows.find((r) => r.hold.id === l.holdId)!;
      const unit = eventPrice(evCache.get(`${h.date}#${h.slot}`) ?? null, h.unitTypeId, basePrice(h.slot, h.priceMorning, h.priceAfternoon));
      const guestsN = Math.min(Math.max(1, l.guests), h.pax);
      return { h, guests: guestsN, arrivalTime: l.arrivalTime, price: h.perPerson ? unit * guestsN : unit };
    });
    const subtotal = items.reduce((s, i) => s + i.price, 0);
    const vat = Math.round(subtotal * vatRate);
    const total = subtotal + vat;

    const [booking] = await tx.insert(bookings).values({
      ref: makeRef(), guestId: guestRow.id, status: "pending", subtotal, vat, total, locale: guest.locale ?? "en", cartToken, source,
    }).returning();

    try {
      await tx.insert(bookingItems).values(items.map((i) => ({
        bookingId: booking.id, sessionId: i.h.hold.sessionId, unitId: i.h.hold.unitId, guests: i.guests, arrivalTime: i.arrivalTime, price: i.price,
      })));
    } catch (e) {
      if (isUniqueViolation(e)) throw new UnitUnavailableError("one of the selected seats");
      throw e;
    }

    const [h0] = await tx.update(holds)
      .set({ bookingId: booking.id, guestId: guestRow.id, extendedAt: sql`now()`, expiresAt: sql`now() + make_interval(mins => ${extension})` })
      .where(inArray(holds.id, lines.map((l) => l.holdId))).returning({ expiresAt: holds.expiresAt });

    return { bookingId: booking.id, ref: booking.ref, subtotal, vat, total, currency: "AED", holdsExtendedUntil: h0.expiresAt.toISOString() };
  });
}

export async function attachPaymentIntent(bookingId: string, paymentIntentId: string) {
  await db.update(bookings).set({ stripePaymentIntentId: paymentIntentId }).where(eq(bookings.id, bookingId));
}

/**
 * Called from the Stripe webhook on payment_intent.succeeded (idempotent).
 * Returns "confirmed" when the seats were still ours, "late" when the holds had already expired and
 * the seats were taken by someone else — the caller refunds in that case.
 */
export async function confirmBookingByPaymentIntent(paymentIntentId: string): Promise<"confirmed" | "already" | "late" | "unknown"> {
  return db.transaction(async (tx) => {
    const [b] = await tx.select().from(bookings).where(eq(bookings.stripePaymentIntentId, paymentIntentId)).for("update");
    if (!b) return "unknown";
    if (b.status === "confirmed") return "already";
    if (b.status !== "pending") return "late";

    // Items are still active (the sweeper flips them when a pending booking expires), so if the
    // booking is still pending here the seats are still exclusively ours.
    const live = await tx.select({ id: bookingItems.id }).from(bookingItems).where(and(eq(bookingItems.bookingId, b.id), eq(bookingItems.active, true)));
    if (!live.length) return "late";

    await tx.update(bookings).set({ status: "confirmed", confirmedAt: sql`now()` }).where(eq(bookings.id, b.id));
    await tx.update(holds).set({ releasedAt: sql`now()`, releaseReason: "converted" }).where(and(eq(holds.bookingId, b.id), isNull(holds.releasedAt)));
    await tx.update(guests).set({ lastBookingAt: sql`now()` }).where(eq(guests.id, b.guestId));
    const items = await tx.select({ unitId: bookingItems.unitId, date: sessions.date, slot: sessions.slot }).from(bookingItems).innerJoin(sessions, eq(sessions.id, bookingItems.sessionId)).where(eq(bookingItems.bookingId, b.id));
    for (const key of new Set(items.map((i) => `${i.date}#${i.slot}`))) { const [d, sl] = key.split("#"); broadcastSafely(d, sl, items.filter((i) => `${i.date}#${i.slot}` === key).map((i) => ({ unitId: i.unitId, state: "booked" as const }))); }
    return "confirmed";
  });
}

export async function cancelBooking(bookingId: string, status: "cancelled" | "refunded" = "cancelled") {
  const freed = await db.transaction(async (tx) => {
    const items = await tx.select({ unitId: bookingItems.unitId, date: sessions.date, slot: sessions.slot }).from(bookingItems).innerJoin(sessions, eq(sessions.id, bookingItems.sessionId)).where(and(eq(bookingItems.bookingId, bookingId), eq(bookingItems.active, true)));
    await tx.update(bookings).set({ status, cancelledAt: sql`now()` }).where(eq(bookings.id, bookingId));
    await tx.update(bookingItems).set({ active: false }).where(eq(bookingItems.bookingId, bookingId));
    await tx.update(holds).set({ releasedAt: sql`now()`, releaseReason: "admin" }).where(and(eq(holds.bookingId, bookingId), isNull(holds.releasedAt)));
    return items;
  });
  for (const key of new Set(freed.map((i) => `${i.date}#${i.slot}`))) { const [d, sl] = key.split("#"); broadcastSafely(d, sl, freed.filter((i) => `${i.date}#${i.slot}` === key).map((i) => ({ unitId: i.unitId, state: "free" as const }))); }
}

/* ------------------------------------------------------------------- guests */

async function upsertGuest(g: GuestDetails, tx: Tx) {
  const email = g.email.trim().toLowerCase();
  const [row] = await tx.insert(guests).values({
    email, phone: g.phone, name: g.name, locale: g.locale ?? "en", marketingOptIn: g.marketingOptIn ?? false, consentAt: sql`now()`,
  }).onConflictDoUpdate({
    target: guests.email,
    set: { phone: g.phone, name: g.name, locale: g.locale ?? "en" },
  }).returning();
  return row;
}

/* ------------------------------------------------------------------ helpers */

function makeRef() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `NOA-${s}`;
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && ((e as { code?: string }).code === "23505" || (e as { cause?: { code?: string } }).cause?.code === "23505");
}
