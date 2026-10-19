import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { bookingItems, bookings, guests, inventoryUnits, sessions, unitTypes } from "@/db/schema";
import { getSetting } from "@/server/booking";

/** One-paragraph staff summary of a confirmed booking for the ops inbox. */
export async function staffBookingSummary(bookingId: string) {
  const [b] = await db.select({ booking: bookings, guest: guests }).from(bookings).innerJoin(guests, eq(guests.id, bookings.guestId)).where(eq(bookings.id, bookingId));
  if (!b) return null;
  const items = await db.select({ date: sessions.date, slot: sessions.slot, guests: bookingItems.guests, arrival: bookingItems.arrivalTime, name: unitTypes.nameEn, label: inventoryUnits.label, price: bookingItems.price })
    .from(bookingItems).innerJoin(sessions, eq(sessions.id, bookingItems.sessionId)).innerJoin(inventoryUnits, eq(inventoryUnits.id, bookingItems.unitId)).innerJoin(unitTypes, eq(unitTypes.id, inventoryUnits.unitTypeId)).where(eq(bookingItems.bookingId, bookingId));
  const to = await getSetting("ops_email");
  const subject = `New booking ${b.booking.ref} · ${items[0]?.date ?? ""} ${items[0]?.slot ?? ""} · AED ${b.booking.total.toLocaleString("en-US")}`;
  const text = [
    `Guest: ${b.guest.name ?? "—"} · ${b.guest.email} · ${b.guest.phone ?? "—"} · tier ${b.guest.tier}`,
    ...items.map((i) => `• ${i.name} ${i.label} — ${i.date} ${i.slot} — arrive ${i.arrival} — ${i.guests} guests — AED ${i.price.toLocaleString("en-US")}`),
    `Subtotal AED ${b.booking.subtotal.toLocaleString("en-US")} · VAT AED ${b.booking.vat.toLocaleString("en-US")} · Total AED ${b.booking.total.toLocaleString("en-US")}`,
    `Source: ${b.booking.source} · ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/bookings/${b.booking.id}`,
  ].join("\n");
  return { to, subject, text };
}
