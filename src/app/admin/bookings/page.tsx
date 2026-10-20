import Link from "next/link";
import { guard, Denied } from "../_guard";
import { listBookings } from "@/server/admin/actions";

export default async function Bookings({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string }> }) {
  const g = await guard(); if (g.denied) return <Denied />;
  const sp = await searchParams;
  const rows = await listBookings({ q: sp.q, status: sp.status, from: sp.from, to: sp.to, limit: 300 });
  return (
    <main className="ad-main">
      <h1>Bookings</h1>
      <form className="row" style={{ marginBottom: 16 }}>
        <input name="q" placeholder="Reference, name or email" defaultValue={sp.q} />
        <select name="status" defaultValue={sp.status ?? ""}><option value="">All statuses</option>{["pending", "confirmed", "cancelled", "refunded", "expired"].map((s) => <option key={s}>{s}</option>)}</select>
        <input type="date" name="from" defaultValue={sp.from} /> <input type="date" name="to" defaultValue={sp.to} />
        <button type="submit" className="ghost">Filter</button>
        <a className="ghost" href={`/admin/bookings/export?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), ...(sp.status ? { status: sp.status } : {}), ...(sp.from ? { from: sp.from } : {}), ...(sp.to ? { to: sp.to } : {}) }).toString()}`}>Download CSV</a>
      </form>
      <table><thead><tr><th>Ref</th><th>Guest</th><th>Tier</th><th>Session date</th><th>Units</th><th>Total</th><th>Source</th><th>Status</th><th>Created</th></tr></thead>
        <tbody>{rows.map((b) => (
          <tr key={b.id}><td><Link href={`/admin/bookings/${b.id}`}>{b.ref}</Link></td><td>{b.guestName}<br /><span className="note">{b.guestEmail} · {b.guestPhone}</span></td><td>{b.tier}</td><td>{b.firstDate}</td><td>{b.units}</td><td>AED {b.total.toLocaleString("en-US")}</td><td>{b.source}</td><td><span className={`pill ${b.status === "confirmed" ? "ok" : b.status === "pending" ? "" : "muted"}`}>{b.status}</span></td><td className="note">{b.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td></tr>
        ))}{!rows.length && <tr><td colSpan={9} className="note">No bookings match.</td></tr>}</tbody></table>
    </main>
  );
}
