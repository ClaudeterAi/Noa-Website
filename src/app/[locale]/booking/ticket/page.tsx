import { setRequestLocale } from "next-intl/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, bookingItems, sessions, inventoryUnits, guests } from "@/db/schema";
import { verifyTicket, ticketToken } from "@/server/ticket";

const SLOT = { en: { morning: "Morning", afternoon: "Afternoon 2 PM to 9:30 PM", night: "Night 9:30 PM to 2 AM", full: "Event" }, ar: { morning: "الصباح", afternoon: "بعد الظهر 2 إلى 9:30 مساءً", night: "الليل 9:30 مساءً إلى 2 فجراً", full: "فعالية" } } as const;

/** The guest's wristband page: reference, seats, date and the QR to show at the pier desk. Reached from the confirmation email; no sign-in. */
export default async function Ticket({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const L = locale === "ar" ? "ar" : "en";
  const ref = verifyTicket((await searchParams).t);
  const [b] = ref ? await db.select({ id: bookings.id, ref: bookings.ref, status: bookings.status, checkedInAt: bookings.checkedInAt, guestName: guests.name }).from(bookings).innerJoin(guests, eq(guests.id, bookings.guestId)).where(eq(bookings.ref, ref)) : [];
  if (!b || b.status !== "confirmed") {
    return <main className="bk-result"><h1>{L === "ar" ? "لا توجد تذكرة" : "No ticket here"}</h1><p>{L === "ar" ? "هذا الرابط غير صالح أو الحجز غير مؤكد." : "This link is not valid or the reservation is not confirmed."}</p></main>;
  }
  const items = await db.select({ label: inventoryUnits.label, date: sessions.date, slot: sessions.slot }).from(bookingItems).innerJoin(sessions, eq(sessions.id, bookingItems.sessionId)).innerJoin(inventoryUnits, eq(inventoryUnits.id, bookingItems.unitId)).where(eq(bookingItems.bookingId, b.id));
  return (
    <main className="bk-result ticket" dir={L === "ar" ? "rtl" : "ltr"}>
      <div className="ticket-card">
        <div className="ticket-kicker">NOA · {L === "ar" ? "سوار الدخول" : "Wristband"}</div>
        <h1>{b.ref}</h1>
        <p>{b.guestName}</p>
        <ul>{items.map((i, k) => <li key={k}>{i.label} · {i.date} · {SLOT[L][i.slot as keyof typeof SLOT.en] ?? i.slot}</li>)}</ul>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ticket-qr" src={`/api/bookings/qr/${ticketToken(b.ref)}.svg`} alt={L === "ar" ? "رمز الدخول" : "Entry code"} width={240} height={240} />
        <p className="ticket-note">{b.checkedInAt ? (L === "ar" ? "تم تسجيل الوصول." : "Checked in.") : (L === "ar" ? "اعرض هذا الرمز عند مكتب الرصيف. المرسى 7، قبل جلستك بعشرين دقيقة." : "Show this code at the pier desk. Berth 7, twenty minutes before your session.")}</p>
      </div>
    </main>
  );
}
