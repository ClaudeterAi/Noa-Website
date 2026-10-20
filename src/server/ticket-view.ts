import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, bookingItems, guests, inventoryUnits, sessions, unitTypes } from "@/db/schema";
import { eventForSession } from "@/server/events/ticketing";
import { events as registryEvents, media as registryMedia } from "@/content/entities";
import { ticketToken, ticketUrl } from "@/server/ticket";

type Loc = "en" | "ar";
type Slot = "morning" | "afternoon" | "night" | "full";

/** Everything a ticket shows, in one shape, so the wristband page and the emails render the same ticket. */
export interface TicketView {
  ref: string; status: string; checkedInAt: Date | null; locale: Loc; guestName: string;
  date: string; dateLabel: string; slot: Slot; slotLabel: string; timeLabel: string; boarding: string; lastBoat: string;
  seats: { name: string; label: string; guests: number }[]; totalGuests: number;
  title: string; subtitle: string | null; image: string;           // event poster, or the session photograph
  venue: { name: string; line: string; mapUrl: string };
  rules: string[];
  ticketUrl: string; qrSvg: string; qrPng: string;
}

const T = {
  slot: { en: { morning: "Morning", afternoon: "Afternoon", night: "Night", full: "Event" }, ar: { morning: "الصباح", afternoon: "بعد الظهر", night: "الليل", full: "فعالية" } },
  time: { en: { morning: "9:30 AM to 2 PM", afternoon: "2 PM to 9:30 PM", night: "9:30 PM to 2 AM", full: "" }, ar: { morning: "9:30 صباحاً إلى 2 ظهراً", afternoon: "2 ظهراً إلى 9:30 مساءً", night: "9:30 مساءً إلى 2 فجراً", full: "" } },
  boarding: { en: { morning: "Boats every 30 minutes from 9 AM", afternoon: "Boats every 30 minutes from 1:30 PM", night: "Boats every 30 minutes through the night", full: "Boats every 30 minutes" }, ar: { morning: "قوارب كل 30 دقيقة من 9 صباحاً", afternoon: "قوارب كل 30 دقيقة من 1:30 ظهراً", night: "قوارب كل 30 دقيقة طوال الليل", full: "قوارب كل 30 دقيقة" } },
  lastBoat: { en: { morning: "Last boat back 2:30 PM", afternoon: "Last boat back 10 PM", night: "Last boat back 2:30 AM", full: "Last boat back 2:30 AM" }, ar: { morning: "آخر قارب للعودة 2:30 ظهراً", afternoon: "آخر قارب للعودة 10 مساءً", night: "آخر قارب للعودة 2:30 فجراً", full: "آخر قارب للعودة 2:30 فجراً" } },
  age: { en: { morning: "All ages", afternoon: "Over 18", night: "Over 21", full: "Over 21" }, ar: { morning: "جميع الأعمار", afternoon: "فوق 18 عاماً", night: "فوق 21 عاماً", full: "فوق 21 عاماً" } },
  venue: { en: { name: "Dubai Marina Pier, Berth 7", line: "Check in at the NOA desk on the pier. The crossing is eleven minutes." }, ar: { name: "رصيف مرسى دبي، المرسى 7", line: "سجّل وصولك عند مكتب نوا على الرصيف. العبور إحدى عشرة دقيقة." } },
} as const;

function rules(L: Loc, slot: Slot, age: string, dress: string): string[] {
  return L === "ar" ? [
    "اصل إلى الرصيف قبل جلستك بعشرين دقيقة. يُغلق الصعود قبل انطلاق القارب بعشر دقائق.",
    "سوار لكل ضيف، يُسلَّم عند المكتب مقابل هذا الرمز. أبقِه على معصمك طوال الجلسة.",
    `أحضر هوية سارية. ${age}.`,
    `قواعد اللباس: ${dress}.`,
    "لا يُسمح بإحضار طعام أو شراب من الخارج.",
    slot === "night" ? "المسبح مغلق ليلاً." : "المناشف متوفرة على المتن.",
    "الإلغاء قبل 72 ساعة: استرداد كامل ناقص 10%. خلال 72 ساعة: غير قابل للاسترداد.",
  ] : [
    "Arrive at the pier twenty minutes before your session. Boarding closes ten minutes before each boat leaves.",
    "One wristband per guest, issued at the desk against this code. Keep it on for the whole session.",
    `Bring valid photo ID. ${age}.`,
    `Dress code: ${dress}.`,
    "No outside food or drink.",
    slot === "night" ? "The pool is closed at night." : "Towels are on board.",
    "Cancel more than 72 hours ahead for a full refund less 10%. Within 72 hours the booking is non-refundable.",
  ];
}

const abs = (base: string, url: string) => (url.startsWith("http") ? url : `${base}${url.startsWith("/") ? "" : "/"}${url}`);
const regImg = (id?: string | null) => (id ? (registryMedia as Record<string, { url?: string }>)[id]?.url ?? null : null);
const fmt = (d: string, L: Loc) => new Intl.DateTimeFormat(L === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" }).format(new Date(`${d}T12:00:00+04:00`));

/** Load a ticket by booking reference. Returns null if the booking does not exist. */
export async function loadTicketView(ref: string, base: string, localeOverride?: Loc): Promise<TicketView | null> {
  const [b] = await db.select({ id: bookings.id, ref: bookings.ref, status: bookings.status, locale: bookings.locale, checkedInAt: bookings.checkedInAt, guestName: guests.name })
    .from(bookings).innerJoin(guests, eq(guests.id, bookings.guestId)).where(eq(bookings.ref, ref));
  if (!b) return null;
  const L: Loc = localeOverride ?? (b.locale === "ar" ? "ar" : "en");
  const items = await db.select({ label: inventoryUnits.label, nameEn: unitTypes.nameEn, nameAr: unitTypes.nameAr, guests: bookingItems.guests, date: sessions.date, slot: sessions.slot })
    .from(bookingItems).innerJoin(sessions, eq(sessions.id, bookingItems.sessionId)).innerJoin(inventoryUnits, eq(inventoryUnits.id, bookingItems.unitId)).innerJoin(unitTypes, eq(unitTypes.id, inventoryUnits.unitTypeId))
    .where(and(eq(bookingItems.bookingId, b.id), eq(bookingItems.active, true)))
    .orderBy(sessions.date);
  const first = items[0];
  const date = first?.date ?? ""; const slot = (first?.slot ?? "afternoon") as Slot;

  // event on this date and session: published event in the admin first, then the demo programme
  const dbEvent = date ? await eventForSession(date, slot).catch(() => null) : null;
  const demo = !dbEvent ? Object.values(registryEvents).find((e) => e.date === date && (e as { session?: string }).session === slot) : undefined;
  const title = dbEvent ? (L === "ar" ? dbEvent.titleAr || dbEvent.titleEn : dbEvent.titleEn)
    : demo ? (L === "ar" ? demo.name.ar : demo.name.en).replace(/\n/g, " ")
    : `NOA ${T.slot[L][slot]}`;
  const head = dbEvent?.lineup?.find((a) => a.role === "headliner") ?? dbEvent?.lineup?.[0];
  const subtitle = dbEvent ? (head?.name ?? (L === "ar" ? dbEvent.pitchAr : dbEvent.pitchEn) ?? null) : demo ? (L === "ar" ? demo.artist.ar : demo.artist.en) : null;
  const poster = dbEvent?.media?.poster ?? demo?.media ?? null;
  const image = abs(base, (poster && (poster.startsWith("/") || poster.startsWith("http")) ? poster : regImg(poster)) ?? regImg(slot === "night" ? "pkg-night" : "pkg-afternoon") ?? "/media/hero-placeholder.jpg");
  const time = dbEvent?.startsAt && dbEvent?.endsAt ? `${dbEvent.startsAt} to ${dbEvent.endsAt}` : T.time[L][slot];
  const age = dbEvent?.ageRuleOverride ?? T.age[L][slot];
  const dress = dbEvent?.dressCodeOverride ?? (L === "ar" ? "أنيق شاطئي" : "smart beach casual");
  const token = ticketToken(b.ref);
  return {
    ref: b.ref, status: b.status, checkedInAt: b.checkedInAt, locale: L, guestName: b.guestName ?? (L === "ar" ? "ضيف" : "Guest"),
    date, dateLabel: date ? fmt(date, L) : "", slot, slotLabel: T.slot[L][slot], timeLabel: time, boarding: T.boarding[L][slot], lastBoat: T.lastBoat[L][slot],
    seats: items.map((i) => ({ name: L === "ar" ? i.nameAr : i.nameEn, label: i.label, guests: i.guests })), totalGuests: items.reduce((n, i) => n + (i.guests ?? 0), 0),
    title, subtitle, image,
    venue: { ...T.venue[L], mapUrl: "https://www.google.com/maps/search/?api=1&query=Dubai+Marina+Yacht+Club" },
    rules: rules(L, slot, age, dress),
    ticketUrl: ticketUrl(base, L, b.ref), qrSvg: `${base}/api/bookings/qr/${token}.svg`, qrPng: `${base}/api/bookings/qr/${token}.png`,
  };
}
