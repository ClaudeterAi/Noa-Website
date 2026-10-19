import { and, eq, sql } from "drizzle-orm";
import { db, type Db, type Tx } from "@/db/client";
import { events } from "@/db/schema";
import { canBookPriority, type Tier } from "@/server/vip";

type DbOrTx = Db | Tx;
export type SessionSlot = "morning" | "afternoon" | "night" | "full";

/** The published event (if any) attached to a date + session. Sessions without an event use base pricing. */
export async function eventForSession(date: string, slot: SessionSlot, conn: DbOrTx = db) {
  const [e] = await conn.select().from(events).where(and(eq(events.date, date), eq(events.session, slot), eq(events.status, "published"))).limit(1);
  return e ?? null;
}
export type SessionEvent = NonNullable<Awaited<ReturnType<typeof eventForSession>>>;

/** Base price for a unit type in a session: night/full fall back to the afternoon rate unless the event prices them. */
export function basePrice(slot: SessionSlot, priceMorning: number, priceAfternoon: number) {
  return slot === "morning" ? priceMorning : priceAfternoon;
}

/** Event price for a unit type: explicit event price → base + surcharge → base. */
export function eventPrice(e: SessionEvent | null, typeId: string, base: number) {
  if (!e) return base;
  const t = e.ticketing;
  if (t.prices && typeof t.prices[typeId] === "number") return t.prices[typeId];
  return base + (t.surchargeAed ?? 0);
}

/** Is this unit type sold for the event? Empty list = everything is on sale. */
export const typeOnSale = (e: SessionEvent | null, typeId: string) => !e?.ticketing.seatTypes?.length || e.ticketing.seatTypes.includes(typeId);

export type SaleState = "open" | "presale" | "not_yet" | "closed";

/** Where the event is in its sales window for this guest tier. */
export function saleState(e: SessionEvent | null, tier: Tier, now = new Date()): SaleState {
  if (!e) return "open";
  const open = e.ticketing.salesOpenAt ? new Date(e.ticketing.salesOpenAt) : null;
  const close = e.ticketing.salesCloseAt ? new Date(e.ticketing.salesCloseAt) : null;
  if (close && now > close) return "closed";
  if (open && now < open) {
    const presaleStart = e.ticketing.memberPresaleHours ? new Date(open.getTime() - e.ticketing.memberPresaleHours * 3_600_000) : null;
    if (presaleStart && now >= presaleStart) return canBookPriority(tier) ? "presale" : "not_yet";
    return "not_yet";
  }
  return "open";
}

/** Seats sold + live holds for a session, for the capacity cap. */
export async function sessionCommitted(sessionId: string, conn: DbOrTx = db): Promise<number> {
  const r = await conn.execute<{ n: number }>(sql`
    SELECT (SELECT count(*) FROM booking_items bi WHERE bi.session_id = ${sessionId} AND bi.active)::int
         + (SELECT count(*) FROM holds h WHERE h.session_id = ${sessionId} AND h.released_at IS NULL AND h.expires_at > now() AND h.booking_id IS NULL)::int AS n`);
  return r.rows[0]?.n ?? 0;
}

export class SaleNotOpenError extends Error {
  constructor(public state: SaleState, public opensAt?: string) { super(state === "closed" ? "Sales for this event have closed" : "Sales for this event have not opened yet"); }
}
export class TypeNotOnSaleError extends Error { constructor(public typeId: string) { super(`${typeId} is not on sale for this event`); } }
export class CapacityReachedError extends Error { constructor(public cap: number) { super(`This event is sold out (capacity ${cap})`); } }
