import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLog, bookingItems, bookings, guestConsents, guests, inventoryUnits, sessions, unitTypes } from "@/db/schema";
import { currentConsents } from "./consent";
import { ticketToken } from "./ticket";
import { getTierRules } from "./vip";

/** Everything the /account page shows, for the signed-in guest only. Nothing here is reachable without the cookie. */
export async function getAccount(guestId: string) {
  const [g] = await db.select().from(guests).where(eq(guests.id, guestId));
  if (!g) return null;
  const rows = await db.select({
    id: bookings.id, ref: bookings.ref, status: bookings.status, total: bookings.total, currency: bookings.currency, createdAt: bookings.createdAt, checkedInAt: bookings.checkedInAt,
    date: sessions.date, slot: sessions.slot, unitId: bookingItems.unitId, guests: bookingItems.guests, arrival: bookingItems.arrivalTime,
    unitEn: unitTypes.nameEn, unitAr: unitTypes.nameAr,
  }).from(bookings)
    .innerJoin(bookingItems, eq(bookingItems.bookingId, bookings.id))
    .innerJoin(sessions, eq(sessions.id, bookingItems.sessionId))
    .innerJoin(inventoryUnits, eq(inventoryUnits.id, bookingItems.unitId))
    .innerJoin(unitTypes, eq(unitTypes.id, inventoryUnits.unitTypeId))
    .where(eq(bookings.guestId, guestId))
    .orderBy(desc(sessions.date), asc(bookingItems.arrivalTime));
  // group items under their booking
  const byId = new Map<string, { ref: string; status: string; total: number; currency: string; createdAt: Date; checkedIn: boolean; date: string; slot: string; ticket: string | null; items: { unitId: string; unitEn: string; unitAr: string; guests: number; arrival: string }[] }>();
  for (const r of rows) {
    const b = byId.get(r.id) ?? { ref: r.ref, status: r.status, total: r.total, currency: r.currency, createdAt: r.createdAt, checkedIn: !!r.checkedInAt, date: String(r.date), slot: r.slot, ticket: r.status === "confirmed" ? ticketToken(r.ref) : null, items: [] };
    b.items.push({ unitId: r.unitId, unitEn: r.unitEn, unitAr: r.unitAr, guests: r.guests, arrival: r.arrival });
    if (String(r.date) > b.date) b.date = String(r.date);
    byId.set(r.id, b);
  }
  const today = new Date().toISOString().slice(0, 10);
  // purchases only: an unpaid checkout (pending) or an abandoned one (expired) is not something the guest bought
  const all = [...byId.values()].filter((b) => b.status === "confirmed" || b.status === "cancelled" || b.status === "refunded");
  const upcoming = all.filter((b) => b.status === "confirmed" && b.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = all.filter((b) => !upcoming.includes(b));
  const units = await db.select({ id: unitTypes.id, en: unitTypes.nameEn, ar: unitTypes.nameAr, tier: unitTypes.tier }).from(unitTypes).where(eq(unitTypes.active, true)).orderBy(asc(unitTypes.tier));
  return {
    profile: { name: g.name, email: g.email, phone: g.phone, locale: g.locale, preferredUnitType: g.preferredUnitType, birthdayMonth: g.birthdayMonth, tier: g.tier, memberSince: g.createdAt },
    consents: await currentConsents(guestId),
    bookings: { upcoming, past },
    tierRules: await getTierRules(),
    units,
  };
}

/** The guest's own data as JSON: profile, consent history, bookings with their items. */
export async function exportAccount(guestId: string) {
  const [g] = await db.select().from(guests).where(eq(guests.id, guestId));
  if (!g) return null;
  const consents = await db.select().from(guestConsents).where(eq(guestConsents.guestId, guestId)).orderBy(asc(guestConsents.at));
  const bks = await db.select().from(bookings).where(eq(bookings.guestId, guestId)).orderBy(asc(bookings.createdAt));
  const items = bks.length ? await db.select().from(bookingItems).where(inArray(bookingItems.bookingId, bks.map((b) => b.id))) : [];
  const { cognitoSub: _sub, tierManual: _tm, ...profile } = g;   // internal fields stay out
  return {
    exportedAt: new Date().toISOString(), profile, consents: consents.map(({ guestId: _g, ...c }) => c),
    bookings: bks.map(({ guestId: _g, cartToken: _c, stripePaymentIntentId: _p, ...b }) => ({ ...b, items: items.filter((i) => i.bookingId === b.id).map(({ bookingId: _b, ...i }) => i) })),
  };
}

/** Deletion request: logged for staff in the admin audit log (action guest.delete_request); marketing stops at once. */
export async function requestDeletion(guestId: string, reason: string | null) {
  const [g] = await db.select({ email: guests.email }).from(guests).where(eq(guests.id, guestId));
  if (!g) return false;
  await db.insert(auditLog).values({ actor: g.email, role: "guest", action: "guest.delete_request", entity: "guests", entityId: guestId, before: null, after: { reason, requestedAt: new Date().toISOString() } });
  return true;
}
