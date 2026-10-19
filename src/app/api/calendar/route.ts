import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { error, json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Published events in a month, so the calendar can show event days and offer their session (night / full) for booking. */
export async function GET(req: Request) {
  const m = new URL(req.url).searchParams.get("month") ?? "";
  if (!/^\d{4}-\d{2}$/.test(m)) return error(422, "VALIDATION_ERROR", "month must be YYYY-MM");
  if (!process.env.DATABASE_URL) return json({ month: m, events: [] });
  const [y, mo] = m.split("-").map(Number); const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const rows = await db.select({ id: events.id, date: events.date, session: events.session, titleEn: events.titleEn, titleAr: events.titleAr, kind: events.kind, startsAt: events.startsAt, endsAt: events.endsAt, poster: events.media })
    .from(events).where(and(eq(events.status, "published"), gte(events.date, `${m}-01`), lte(events.date, `${m}-${String(last).padStart(2, "0")}`))).orderBy(events.date);
  return json({ month: m, events: rows.map((r) => ({ ...r, poster: r.poster.poster ?? null })) }, { headers: { "Cache-Control": "no-store" } });
}
