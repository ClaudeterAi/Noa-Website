import Link from "next/link";
import { guard, Denied } from "./_guard";
import { listBookings, listSessions } from "@/server/admin/actions";
import { SessionToggle } from "./ui";
import { aiStatus } from "@/server/concierge/status";

const dubaiToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(new Date());
const plus = (d: string, n: number) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

export default async function Dashboard() {
  const g = await guard(); if (g.denied) return <Denied />;
  const today = dubaiToday();
  const [sess, recent, ai] = await Promise.all([listSessions(today, plus(today, 14)), listBookings({ limit: 15 }), aiStatus()]);
  const todays = sess.filter((s) => s.date === today);
  const stats = { booked: todays.reduce((a, s) => a + Number(s.booked), 0), held: todays.reduce((a, s) => a + Number(s.held), 0), pending: recent.filter((b) => b.status === "pending").length };
  return (
    <main className="ad-main">
      <h1>Today · {today}</h1>
      <div className="cards">
        <div className="card"><div className="n">{stats.booked}</div><div className="l">Seats booked today</div></div>
        <div className="card"><div className="n">{stats.held}</div><div className="l">Live holds today</div></div>
        <div className="card"><div className="n">{stats.pending}</div><div className="l">Pending payments (recent)</div></div>
        <div className="card"><div className="l">AI (Claude via Bedrock)</div><div style={{ margin: "6px 0" }}><span className={`pill ${ai.ok ? "ok" : "warn"}`}>{ai.ok ? "ready" : "waiting"}</span></div><div className="note">{ai.detail}</div>
          <div className="row" style={{ marginTop: 10 }}>{g.session.role !== "frontdesk" && <Link href="/admin/events/new"><button type="button">New event with AI auto-fill</button></Link>}</div></div>
      </div>
      <h2>Next 14 days</h2>
      <table><thead><tr><th>Date</th><th>Session</th><th>Booked</th><th>Held</th><th>Members release</th><th>Status</th><th /></tr></thead>
        <tbody>{sess.map((s) => (
          <tr key={s.id}><td>{s.date}</td><td>{s.slot}</td><td>{s.booked}</td><td>{s.held}</td><td>{s.vipReleaseAt ? new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", dateStyle: "short", timeStyle: "short" }).format(s.vipReleaseAt) : "—"}</td>
            <td><span className={`pill ${s.status === "open" ? "ok" : "warn"}`}>{s.status}</span></td>
            <td>{g.session.role !== "frontdesk" && <SessionToggle date={s.date} slot={s.slot} status={s.status} />}</td></tr>
        ))}{!sess.length && <tr><td colSpan={7} className="note">No sessions created yet — a session row appears the first time a guest opens that day's map.</td></tr>}</tbody></table>
      <h2>Recent bookings</h2>
      <table><thead><tr><th>Ref</th><th>Guest</th><th>Tier</th><th>Date</th><th>Units</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>{recent.map((b) => (
          <tr key={b.id}><td><Link href={`/admin/bookings/${b.id}`}>{b.ref}</Link></td><td>{b.guestName}<br /><span className="note">{b.guestEmail}</span></td><td>{b.tier}</td><td>{b.firstDate}</td><td>{b.units}</td><td>AED {b.total.toLocaleString("en-US")}</td><td><span className={`pill ${b.status === "confirmed" ? "ok" : b.status === "pending" ? "" : "muted"}`}>{b.status}</span></td></tr>
        ))}</tbody></table>
    </main>
  );
}
