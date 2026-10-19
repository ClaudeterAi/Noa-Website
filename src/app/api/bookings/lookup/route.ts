import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { bookingItems, bookings, guests, inventoryUnits, sessions, unitTypes } from "@/db/schema";
import { error, json, parseBody } from "@/server/http";
import { buildIcs } from "@/server/notifications/ics";

export const runtime = "nodejs";

const Body = z.object({ ref: z.string().trim().toUpperCase().regex(/^NOA-[A-Z0-9]{6}$/), email: z.string().trim().toLowerCase().email() });

/**
 * View-only lookup for "manage my booking": reference + the email it was booked with. No cancellation —
 * reservations are final once paid; the page points guests to the manager for changes.
 */
export async function POST(req: Request) {
  try {
    const { ref, email } = await parseBody(req, Body);
    const [row] = await db.select({ booking: bookings, guest: guests }).from(bookings).innerJoin(guests, eq(guests.id, bookings.guestId)).where(and(eq(bookings.ref, ref), eq(guests.email, email)));
    if (!row) return error(404, "NOT_FOUND", "No reservation matches that reference and email");
    const items = await db.select({ date: sessions.date, slot: sessions.slot, guests: bookingItems.guests, arrivalTime: bookingItems.arrivalTime, price: bookingItems.price, nameEn: unitTypes.nameEn, nameAr: unitTypes.nameAr, label: inventoryUnits.label, active: bookingItems.active })
      .from(bookingItems).innerJoin(sessions, eq(sessions.id, bookingItems.sessionId)).innerJoin(inventoryUnits, eq(inventoryUnits.id, bookingItems.unitId)).innerJoin(unitTypes, eq(unitTypes.id, inventoryUnits.unitTypeId))
      .where(eq(bookingItems.bookingId, row.booking.id));
    const first = items[0];
    const ics = first && row.booking.status === "confirmed" ? buildIcs({ uid: ref, date: first.date, slot: first.slot, summary: `NOA — ${ref}`, description: items.map((i) => `${i.nameEn} · ${i.date} · ${i.arrivalTime}`).join("\n"), location: "Dubai Marina Pier, Berth 7" }) : null;
    return json({ ref, status: row.booking.status, guestName: row.guest.name, subtotal: row.booking.subtotal, vat: row.booking.vat, total: row.booking.total, confirmedAt: row.booking.confirmedAt, items, ics }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return error(422, "VALIDATION_ERROR", e instanceof Error ? e.message : "Invalid request"); }
}
