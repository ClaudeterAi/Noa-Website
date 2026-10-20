/**
 * The venue's facts in ONE place: address, contact, session hours, boats, ages, dress code, rules, cancellation.
 * Owners edit them in Admin → Settings → Venue. Every surface reads them from here: website copy (through tokens in
 * the content registry), the ticket page, confirmation and reminder emails, calendar invites, WhatsApp, the chat and
 * voice concierge, and the booking flow. Isomorphic (no database here): the server loads the saved values and hands
 * them to the browser, so server and client always render the same text.
 */
export type VenueSlot = "morning" | "afternoon" | "night";
export interface SessionHours { start: string; end: string; firstBoat: string; lastBoat: string; minAge: number }   // "14:00"
export interface Venue {
  pier: { en: string; ar: string };              // "Dubai Marina Pier, Berth 7"
  berth: string;                                 // "Berth 7" (used in short lines)
  berthAr: string;                               // "المرسى 7"
  landmark: { en: string; ar: string };          // how to find the desk
  mapUrl: string;
  phone: string;                                 // display form "+971 4 840 0000"
  email: string;
  crossingMinutes: number; boatEveryMinutes: number; arriveBeforeMinutes: number; boardingClosesMinutes: number;
  sessions: Record<VenueSlot, SessionHours>;
  dressCode: { en: string; ar: string };
  cancellation: { en: string; ar: string };
  extraRules: { en: string[]; ar: string[] };
}

export const VENUE_DEFAULTS: Venue = {
  pier: { en: "Dubai Marina Pier, Berth 7", ar: "رصيف مرسى دبي، المرسى 7" },
  berth: "Berth 7",
  berthAr: "المرسى 7",
  landmark: { en: "Dubai Marina Walk, beside the Marina Yacht Club. Look for the NOA desk at {{berth}}.", ar: "ممشى مرسى دبي، بجانب نادي مرسى اليخوت. ابحث عن مكتب نوا عند {{berthAr}}." },
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Dubai+Marina+Yacht+Club",
  phone: "+971 4 840 0000",
  email: "hello@noa-dubai.com",
  crossingMinutes: 11, boatEveryMinutes: 30, arriveBeforeMinutes: 20, boardingClosesMinutes: 10,
  sessions: {
    morning: { start: "09:30", end: "14:00", firstBoat: "09:00", lastBoat: "14:30", minAge: 4 },
    afternoon: { start: "14:00", end: "21:30", firstBoat: "13:30", lastBoat: "22:00", minAge: 18 },
    night: { start: "21:30", end: "02:00", firstBoat: "21:00", lastBoat: "02:30", minAge: 21 },
  },
  dressCode: { en: "smart beach casual", ar: "أنيق شاطئي" },
  cancellation: {
    en: "All reservations are final once paid and cannot be cancelled online. If your plans change, write to {{email}} or call {{phone}} and our manager will do their best to help with a date change, subject to availability.",
    ar: "جميع الحجوزات نهائية بعد الدفع ولا يمكن إلغاؤها عبر الإنترنت. إذا تغيّرت خططك، راسلنا على {{email}} أو اتصل على {{phone}} وسيبذل مديرنا قصارى جهده لمساعدتك في تغيير الموعد حسب التوفر.",
  },
  extraRules: { en: ["No outside food or drink."], ar: ["لا يُسمح بإحضار طعام أو شراب من الخارج."] },
};

/** Deep-merge saved values over the defaults, so a partly filled setting never leaves a blank on the site. */
export function mergeVenue(saved: unknown): Venue {
  const s = (saved && typeof saved === "object" ? saved : {}) as Partial<Venue>;
  const d = VENUE_DEFAULTS;
  const pair = (v: unknown, def: { en: string; ar: string }) => ({ en: (v as { en?: string })?.en?.trim() || def.en, ar: (v as { ar?: string })?.ar?.trim() || def.ar });
  const num = (v: unknown, def: number) => (Number.isFinite(v) && (v as number) >= 0 ? (v as number) : def);
  const ses = (k: VenueSlot) => { const x = (s.sessions?.[k] ?? {}) as Partial<SessionHours>; const y = d.sessions[k];
    return { start: x.start || y.start, end: x.end || y.end, firstBoat: x.firstBoat || y.firstBoat, lastBoat: x.lastBoat || y.lastBoat, minAge: num(x.minAge, y.minAge) }; };
  return {
    pier: pair(s.pier, d.pier), berth: s.berth?.trim() || d.berth, berthAr: s.berthAr?.trim() || d.berthAr, landmark: pair(s.landmark, d.landmark), mapUrl: s.mapUrl?.trim() || d.mapUrl,
    phone: s.phone?.trim() || d.phone, email: s.email?.trim() || d.email,
    crossingMinutes: num(s.crossingMinutes, d.crossingMinutes), boatEveryMinutes: num(s.boatEveryMinutes, d.boatEveryMinutes),
    arriveBeforeMinutes: num(s.arriveBeforeMinutes, d.arriveBeforeMinutes), boardingClosesMinutes: num(s.boardingClosesMinutes, d.boardingClosesMinutes),
    sessions: { morning: ses("morning"), afternoon: ses("afternoon"), night: ses("night") },
    dressCode: pair(s.dressCode, d.dressCode), cancellation: pair(s.cancellation, d.cancellation),
    extraRules: { en: Array.isArray(s.extraRules?.en) ? s.extraRules!.en.filter(Boolean) : d.extraRules.en, ar: Array.isArray(s.extraRules?.ar) ? s.extraRules!.ar.filter(Boolean) : d.extraRules.ar },
  };
}

/** Validation for the admin form. Returns a list of problems; empty means safe to save. */
export function validateVenue(v: Venue): string[] {
  const errs: string[] = [];
  const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
  for (const k of ["morning", "afternoon", "night"] as VenueSlot[]) for (const f of ["start", "end", "firstBoat", "lastBoat"] as const)
    if (!hhmm.test(v.sessions[k][f])) errs.push(`${k} ${f} must be a 24-hour time like 14:00`);
  for (const k of ["morning", "afternoon", "night"] as VenueSlot[]) if (!Number.isInteger(v.sessions[k].minAge) || v.sessions[k].minAge < 0 || v.sessions[k].minAge > 25) errs.push(`${k} minimum age must be 0 to 25`);
  for (const f of ["crossingMinutes", "boatEveryMinutes", "arriveBeforeMinutes", "boardingClosesMinutes"] as const) if (!Number.isInteger(v[f]) || v[f] < 1 || v[f] > 180) errs.push(`${f} must be 1 to 180 minutes`);
  if (!/^https:\/\//.test(v.mapUrl)) errs.push("map link must start with https://");
  if (!/^\+?[0-9 ()-]{7,20}$/.test(v.phone)) errs.push("phone must be digits, spaces and an optional +");
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v.email)) errs.push("email is not valid");
  for (const f of ["pier", "landmark", "dressCode", "cancellation"] as const) if (!v[f].en.trim() || !v[f].ar.trim()) errs.push(`${f} needs English and Arabic`);
  if (!v.berth.trim() || !v.berthAr.trim()) errs.push("berth needs English and Arabic");
  return errs;
}

/* ---------- formatting ---------- */
type Loc = "en" | "ar";
/** "14:00" → "2 PM" / "2 مساءً"; "21:30" → "9:30 PM"; "12:00" → "noon"-free plain "12 PM". */
export function clock(t: string, L: Loc): string {
  if (!/^\d{1,2}:\d{2}$/.test(t.trim())) return t.trim();   // free text from an event form ("9:30 PM", "late") is shown as typed
  const [h, m] = t.trim().split(":").map(Number); const h12 = ((h + 11) % 12) + 1; const mm = m ? `:${String(m).padStart(2, "0")}` : "";
  if (L === "en") return `${h12}${mm} ${h < 12 ? "AM" : "PM"}`;
  const part = h < 5 ? "فجراً" : h < 12 ? "صباحاً" : h < 15 ? "ظهراً" : "مساءً";
  return `${h12}${mm} ${part}`;
}
export const span = (a: string, b: string, L: Loc) => `${clock(a, L)} ${L === "ar" ? "إلى" : "to"} ${clock(b, L)}`;

/** All derived phrases the copy and the messages use. */
export function venueText(v: Venue, L: Loc) {
  const s = v.sessions;
  const ageLine = (n: number) => (n <= 4 ? (L === "ar" ? "جميع الأعمار" : "All ages") : L === "ar" ? `فوق ${n} عاماً` : `Over ${n}`);
  return {
    pier: v.pier[L], berth: L === "ar" ? v.berthAr : v.berth, landmark: v.landmark[L].replace(/\{\{berth\}\}/g, v.berth).replace(/\{\{berthAr\}\}/g, v.berthAr), phone: v.phone, phoneHref: `tel:${v.phone.replace(/[^+\d]/g, "")}`, email: v.email, mapUrl: v.mapUrl,
    crossing: String(v.crossingMinutes), boatEvery: String(v.boatEveryMinutes), arriveBefore: String(v.arriveBeforeMinutes), boardingCloses: String(v.boardingClosesMinutes),
    hours: span(s.afternoon.start, s.night.end, L),                       // opening hours of the day as sold (afternoon + night)
    firstBoat: clock(s.afternoon.firstBoat, L),
    session: (k: VenueSlot) => span(s[k].start, s[k].end, L),
    lastBoat: (k: VenueSlot) => clock(s[k].lastBoat, L),
    firstBoatOf: (k: VenueSlot) => clock(s[k].firstBoat, L),
    age: (k: VenueSlot) => ageLine(s[k].minAge),
    minAge: (k: VenueSlot) => String(s[k].minAge),
    dressCode: v.dressCode[L],
    cancellation: v.cancellation[L].replace(/\{\{email\}\}/g, v.email).replace(/\{\{phone\}\}/g, v.phone),
  };
}

/** Replace {{tokens}} in copy. Unknown tokens are left visible so a typo is noticed, never silently blank. */
export function resolveVenueTokens(text: string, v: Venue, L: Loc): string {
  if (!text.includes("{{")) return text;
  const t = venueText(v, L);
  return text.replace(/\{\{\s*([a-zA-Z]+)(?:\.([a-zA-Z]+))?\s*\}\}/g, (all, a: string, b?: string) => {
    if (b && (a === "morning" || a === "afternoon" || a === "night")) {
      const k = a as VenueSlot;
      if (b === "time") return t.session(k); if (b === "lastBoat") return t.lastBoat(k); if (b === "firstBoat") return t.firstBoatOf(k);
      if (b === "age") return t.age(k); if (b === "minAge") return t.minAge(k);
      return all;
    }
    const flat: Record<string, string> = { phoneHref: t.phoneHref, pier: t.pier, berth: t.berth, landmark: t.landmark, phone: t.phone, email: t.email, mapUrl: t.mapUrl, crossing: t.crossing, boatEvery: t.boatEvery,
      arriveBefore: t.arriveBefore, boardingCloses: t.boardingCloses, hours: t.hours, firstBoat: t.firstBoat, dressCode: t.dressCode, cancellation: t.cancellation };
    return flat[a] ?? all;
  });
}

/* ---------- the snapshot every renderer reads ---------- */
let snapshot: Venue = VENUE_DEFAULTS;
export const setVenueSnapshot = (v: Venue) => { snapshot = v; };
export const venueSnapshot = () => snapshot;
