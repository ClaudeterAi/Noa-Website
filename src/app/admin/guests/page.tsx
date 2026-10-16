import { guard, Denied } from "../_guard";
import { listGuests } from "@/server/admin/actions";
import { TierSelect } from "../ui";

export default async function Guests({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const g = await guard(); if (g.denied) return <Denied />;
  const { q } = await searchParams;
  const rows = await listGuests(q);
  return (
    <main className="ad-main">
      <h1>Guests</h1>
      <form className="row" style={{ marginBottom: 16 }}><input name="q" placeholder="Email, name or phone" defaultValue={q} /><button type="submit" className="ghost">Search</button><a href="/admin/guests/export"><button type="button" className="ghost">Export CSV</button></a></form>
      <table><thead><tr><th>Guest</th><th>Phone</th><th>Tier</th><th>Confirmed bookings</th><th>Lifetime spend</th><th>Last booking</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}><td>{r.name}<br /><span className="note">{r.email}</span></td><td>{r.phone}</td>
            <td>{g.session.role === "frontdesk" ? `${r.tier}${r.tierManual ? " (manual)" : ""}` : <TierSelect guestId={r.id} tier={r.tier} manual={r.tierManual} />}</td>
            <td>{r.bookings}</td><td>AED {Number(r.spend).toLocaleString("en-US")}</td><td className="note">{r.lastBookingAt?.toISOString().slice(0, 10) ?? "—"}</td></tr>
        ))}</tbody></table>
    </main>
  );
}
