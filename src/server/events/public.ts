import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import type { EventItem, L } from "@/content/types";

/** Published events for the public site, shaped like registry events so the existing sections render them. Safe without a DB (build time): returns []. */
export async function publishedEvents(): Promise<{ upcoming: EventItem[]; highlights: EventItem[] }> {
  if (!process.env.DATABASE_URL) return { upcoming: [], highlights: [] };
  try {
    const rows = await db.select().from(events).where(sql`${events.status} IN ('published','past')`).orderBy(events.date);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(new Date());
    const toItem = (e: typeof rows[number]): EventItem => {
      const d = new Date(`${e.date}T12:00:00+04:00`);
      const label = (loc: "en" | "ar") => new Intl.DateTimeFormat(loc === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { weekday: "short", day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Dubai" }).format(d);
      const short = (loc: "en" | "ar") => new Intl.DateTimeFormat(loc === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { weekday: "short", day: "2-digit", month: "short", timeZone: "Asia/Dubai" }).format(d);
      const head = e.lineup.find((a) => a.role === "headliner") ?? e.lineup[0];
      const artist = head ? `${head.name}${head.origin ? ` · ${head.origin}` : ""}` : (e.pitchEn ?? "");
      const l = (en: string, ar: string): L => ({ en, ar: ar || en, arStatus: e.arStatus === "reviewed" ? "reviewed" : "draft" });
      return { session: e.session, startsAt: e.startsAt, endsAt: e.endsAt, id: e.id, date: e.date, dateLabel: l(label("en"), label("ar")), shortDate: l(short("en"), short("ar")), name: l(e.titleEn, e.titleAr ?? ""), artist: l(artist, artist), media: e.media.poster, isPlaceholder: false, kind: e.kind, status: e.status };
    };
    return {
      upcoming: rows.filter((e) => e.status === "published" && e.date >= today).sort((a, b) => (b.kind === "main" ? 1 : 0) - (a.kind === "main" ? 1 : 0) || b.sortWeight - a.sortWeight || a.date.localeCompare(b.date)).map(toItem),
      highlights: rows.filter((e) => e.kind === "highlight").map(toItem),
    };
  } catch { return { upcoming: [], highlights: [] }; }
}
