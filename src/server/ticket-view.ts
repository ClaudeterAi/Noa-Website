import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, bookingItems, guests, inventoryUnits, sessions, unitTypes } from "@/db/schema";
import { eventForSession } from "@/server/events/ticketing";
import { events as registryEvents, media as registryMedia } from "@/content/entities";
import { ticketToken, ticketUrl } from "@/server/ticket";
import { loadVenue } from "@/server/venue";
import { clock, span, venueText, type Venue } from "@/lib/venue";

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

const SLOT_NAME = { en: { morning: "Morning", afternoon: "Afternoon", night: "Night", full: "Event" }, ar: { morning: "الصباح", afternoon: "بعد الظهر", night: "الليل", full: "فعالية" } } as const;

/** Rules on the ticket, built from the venue settings and the event's own overrides; nothing here is fixed text about times or places. */
function rules(L: Loc, slot: Slot, v: ReturnType<typeof venueText>, venue: Venue, age: string, dress: string, eventNotes: string[]): string[] {
  const ar = L === "ar";
  return [
    ar ? `اصل إلى الرصيف قبل جلستك بـ ${v.arriveBefore} دقيقة. يُغلق الصعود قبل انطلاق القارب بـ ${v.boardingCloses} دقائق.` : `Arrive at the pier ${v.arriveBefore} minutes before your session. Boarding closes ${v.boardingCloses} minutes before each boat leaves.`,
    ar ? "سوار لكل ضيف، يُسلَّم عند المكتب مقابل هذا الرمز. أبقِه على معصمك طوال الجلسة." : "One wristband per guest, issued at the desk against this code. Keep it on for the whole session.",
    ar ? `أحضر هوية سارية. ${age}.` : `Bring valid photo ID. ${age}.`,
    ar ? `قواعد اللباس: ${dress}.` : `Dress code: ${dress}.`,
    ...(slot === "night" ? [ar ? "المسبح مغلق ليلاً." : "The pool is closed at night."] : []),
    ...venue.extraRules[L],
    ...eventNotes,
    v.cancellation,
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
    : `NOA ${SLOT_NAME[L][slot]}`;
  const head = dbEvent?.lineup?.find((a) => a.role === "headliner") ?? dbEvent?.lineup?.[0];
  const subtitle = dbEvent ? (head?.name ?? (L === "ar" ? dbEvent.pitchAr : dbEvent.pitchEn) ?? null) : demo ? (L === "ar" ? demo.artist.ar : demo.artist.en) : null;
  const poster = dbEvent?.media?.poster ?? demo?.media ?? null;
  const image = abs(base, (poster && (poster.startsWith("/") || poster.startsWith("http")) ? poster : regImg(poster)) ?? regImg(slot === "night" ? "pkg-night" : "pkg-afternoon") ?? "/media/hero-placeholder.jpg");
  const venue = await loadVenue();
  const v = venueText(venue, L);
  const vs: "morning" | "afternoon" | "night" = slot === "full" ? "night" : slot;
  // the event's own times win; otherwise the session hours from Admin → Settings → Venue
  const time = dbEvent?.startsAt ? (dbEvent.endsAt ? span(dbEvent.startsAt, dbEvent.endsAt, L) : clock(dbEvent.startsAt, L)) : v.session(vs);
  const doors = dbEvent?.doorsAt ? (L === "ar" ? `الأبواب ${clock(dbEvent.doorsAt, L)}` : `Doors ${clock(dbEvent.doorsAt, L)}`) : null;
  const age = dbEvent?.ageRuleOverride || v.age(vs);
  const dress = dbEvent?.dressCodeOverride || v.dressCode;
  const eventNotes = [dbEvent?.ops?.checkinNotes, dbEvent?.ops?.shuttleNotes].filter((x): x is string => !!x && !!x.trim());
  const token = ticketToken(b.ref);
  return {
    ref: b.ref, status: b.status, checkedInAt: b.checkedInAt, locale: L, guestName: b.guestName ?? (L === "ar" ? "ضيف" : "Guest"),
    date, dateLabel: date ? fmt(date, L) : "", slot, slotLabel: SLOT_NAME[L][slot], timeLabel: doors ? `${time} · ${doors}` : time,
    boarding: L === "ar" ? `قوارب كل ${v.boatEvery} دقيقة من ${v.firstBoatOf(vs)}` : `Boats every ${v.boatEvery} minutes from ${v.firstBoatOf(vs)}`,
    lastBoat: L === "ar" ? `آخر قارب للعودة ${v.lastBoat(vs)}` : `Last boat back ${v.lastBoat(vs)}`,
    seats: items.map((i) => ({ name: L === "ar" ? i.nameAr : i.nameEn, label: i.label, guests: i.guests })), totalGuests: items.reduce((n, i) => n + (i.guests ?? 0), 0),
    title, subtitle, image,
    venue: { name: v.pier, line: L === "ar" ? `${v.landmark} العبور ${v.crossing} دقيقة.` : `${v.landmark} The crossing is ${v.crossing} minutes.`, mapUrl: v.mapUrl },
    rules: rules(L, slot, v, venue, age, dress, eventNotes),
    ticketUrl: ticketUrl(base, L, b.ref), qrSvg: `${base}/api/bookings/qr/${token}.svg`, qrPng: `${base}/api/bookings/qr/${token}.png`,
  };
}
