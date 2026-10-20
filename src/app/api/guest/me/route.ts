import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { bookingItems, bookings, guests, inventoryUnits, sessions, unitTypes } from "@/db/schema";
import { getCurrentGuest } from "@/server/guest-session";
import { json } from "@/server/http";
import { guestAuthConfigured } from "@/server/guest-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Who am I + what did I book last ("welcome back", usual seat first). */
export async function GET() {
  const me = await getCurrentGuest();
  if (!me) return json({ signedIn: false, authEnabled: guestAuthConfigured() }, { headers: { "Cache-Control": "no-store" } });
  const [last] = await db.select({ ref: bookings.ref, date: sessions.date, slot: sessions.slot, unitTypeId: inventoryUnits.unitTypeId, unitName: unitTypes.nameEn, unitNameAr: unitTypes.nameAr })
    .from(bookings).innerJoin(bookingItems, eq(bookingItems.bookingId, bookings.id)).innerJoin(sessions, eq(sessions.id, bookingItems.sessionId))
    .innerJoin(inventoryUnits, eq(inventoryUnits.id, bookingItems.unitId)).innerJoin(unitTypes, eq(unitTypes.id, inventoryUnits.unitTypeId))
    .where(eq(bookings.guestId, me.id)).orderBy(desc(bookings.createdAt)).limit(1);
  const [g] = await db.select().from(guests).where(eq(guests.id, me.id));
  return json({ signedIn: true, authEnabled: true, guest: { name: g?.name ?? null, email: g?.email, phone: g?.phone ?? null, tier: me.tier }, lastBooking: last ?? null }, { headers: { "Cache-Control": "no-store" } });
}
