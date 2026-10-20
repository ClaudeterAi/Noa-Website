import Link from "next/link";
import { guard, Denied } from "../_guard";
import { calendarMonth } from "@/server/admin/actions";

const SLOT_LABEL: Record<string, string> = { morning: "Morning", afternoon: "Afternoon", night: "Night", full: "Event" };

/** Month view: every date with its sessions, confirmed bookings, seats sold, live holds and revenue. Click a day for its bookings. */
export default async function Calendar({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const g = await guard(); if (g.denied) return <Denied />;
  const sp = await searchParams;
  const now = new Date();
  const [year, month] = (sp.m && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`).split("-").map(Number);
  const rows = await calendarMonth(year, month);
  const byDate = new Map<string, typeof rows>();
  for (const r of rows) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);
  const first = new Date(Date.UTC(year, month - 1, 1)); const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;   // Monday first
  const prev = new Date(Date.UTC(year, month - 2, 1)), next = new Date(Date.UTC(year, month, 1));
  const ym = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const totals = rows.reduce((a, r) => ({ confirmed: a.confirmed + r.confirmed, seats: a.seats + r.seats, revenue: a.revenue + r.revenue, holds: a.holds + r.holds }), { confirmed: 0, seats: 0, revenue: 0, holds: 0 });
  return (
    <main className="ad-main">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h1>{first.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}</h1>
        <div className="row"><Link className="ghost" href={`/admin/calendar?m=${ym(prev)}`}>← {prev.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}</Link><Link className="ghost" href={`/admin/calendar?m=${ym(next)}`}>{next.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })} →</Link></div>
      </div>
      <p className="note">{totals.confirmed} confirmed bookings · {totals.seats} seats · AED {totals.revenue.toLocaleString("en-GB")} · {totals.holds} seats held right now</p>
      <div className="cal">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="cal-dow">{d}</div>)}
        {Array.from({ length: lead }).map((_, i) => <div key={`lead-${i}`} className="cal-cell empty" />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
          const list = byDate.get(d) ?? [];
          const today = d === now.toISOString().slice(0, 10);
          return (
            <Link key={d} href={`/admin/bookings?from=${d}&to=${d}`} className={`cal-cell${today ? " today" : ""}${list.length ? " has" : ""}`}>
              <div className="cal-day">{i + 1}</div>
              {list.map((r) => (
                <div key={r.slot} className="cal-slot">
                  <span className="cal-slot-name">{SLOT_LABEL[r.slot] ?? r.slot}</span>
                  <span>{r.seats} seats · {r.confirmed} bkg{r.pending ? ` · ${r.pending} pending` : ""}{r.holds ? ` · ${r.holds} held` : ""}</span>
                  {r.revenue > 0 && <span className="cal-rev">AED {r.revenue.toLocaleString("en-GB")}</span>}
                </div>
              ))}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
