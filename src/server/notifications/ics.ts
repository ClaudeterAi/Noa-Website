/** Minimal RFC 5545 calendar invite for a NOA session (Asia/Dubai, UTC+4, no DST). */
const SLOT_TIMES = { morning: ["09:30", "14:00"], afternoon: ["14:00", "21:30"] } as const;

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const stampUtc = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const localStamp = (date: string, hm: string) => `${date.replace(/-/g, "")}T${hm.replace(":", "")}00`;

export function buildIcs(opts: { uid: string; date: string; slot: "morning" | "afternoon"; summary: string; description: string; location: string; url?: string }): string {
  const [start, end] = SLOT_TIMES[opts.slot];
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NOA Dubai//Reservations//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE", "TZID:Asia/Dubai", "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:+0400", "TZOFFSETTO:+0400", "TZNAME:GST", "END:STANDARD", "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@noa-dubai.com`,
    `DTSTAMP:${stampUtc(new Date())}`,
    `DTSTART;TZID=Asia/Dubai:${localStamp(opts.date, start)}`,
    `DTEND;TZID=Asia/Dubai:${localStamp(opts.date, end)}`,
    `SUMMARY:${esc(opts.summary)}`,
    `DESCRIPTION:${esc(opts.description)}`,
    `LOCATION:${esc(opts.location)}`,
    ...(opts.url ? [`URL:${opts.url}`] : []),
    "STATUS:CONFIRMED",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n") + "\r\n";
}
