import { guard, Denied } from "../_guard";
import { listCallbacks } from "@/server/admin/actions";
import { CallbackToggle } from "../ui";

export const dynamic = "force-dynamic";
export default async function Callbacks({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const g = await guard(); if (g.denied) return <Denied />;
  const { status } = await searchParams;
  const rows = await listCallbacks(status === "done" ? "done" : status === "all" ? undefined : "open");
  return (
    <main className="ad-main">
      <div className="row" style={{ justifyContent: "space-between" }}><h1>Call-back requests</h1><span className="row"><a href="?status=open">Open</a> · <a href="?status=done">Done</a> · <a href="?status=all">All</a></span></div>
      <p className="note">Guests the voice or chat concierge handed to a person. Call them during opening hours, then mark done.</p>
      <table><thead><tr><th>When</th><th>Guest</th><th>Topic</th><th>Notes</th><th>Via</th><th>Booking</th><th>Status</th><th /></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}><td className="note">{r.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td><td>{r.name}<br /><a href={`tel:${r.phone}`}>{r.phone}</a>{r.email && <><br /><span className="note">{r.email}</span></>}</td><td>{r.topic}</td><td style={{ whiteSpace: "normal", maxWidth: 320 }}>{r.notes}</td><td>{r.source} · {r.locale}</td><td>{r.bookingRef ?? "—"}</td>
            <td><span className={`pill ${r.status === "done" ? "muted" : "warn"}`}>{r.status}</span>{r.handledBy && <div className="note">{r.handledBy}</div>}</td><td><CallbackToggle id={r.id} status={r.status} /></td></tr>
        ))}{!rows.length && <tr><td colSpan={8} className="note">None.</td></tr>}</tbody></table>
    </main>
  );
}
