import Link from "next/link";
import { guard, Denied } from "../_guard";
import { listEvents } from "@/server/events/repo";

export default async function Events() {
  const g = await guard(); if (g.denied) return <Denied />;
  const rows = await listEvents();
  return (
    <main className="ad-main">
      <div className="row" style={{ justifyContent: "space-between" }}><h1>Events</h1>{g.session.role !== "frontdesk" && <Link href="/admin/events/new"><button type="button">New event</button></Link>}</div>
      <p className="note">Publishing an event updates the website, the chat concierge (instantly) and the voice agent's knowledge base (within a minute). Mark the best past events as <strong>highlight</strong> so the agents can use them as proof.</p>
      <table><thead><tr><th>Date</th><th>Title</th><th>Session</th><th>Kind</th><th>Line-up</th><th>Status</th><th>AI fields to review</th></tr></thead>
        <tbody>{rows.map((e) => (
          <tr key={e.id}><td>{e.date}</td><td><Link href={`/admin/events/${e.id}`}>{e.titleEn}</Link><br /><span className="note">{e.titleAr}</span></td><td>{e.session}</td><td>{e.kind}</td><td className="note">{e.lineup.map((a) => a.name).join(", ")}</td>
            <td><span className={`pill ${e.status === "published" ? "ok" : e.status === "cancelled" ? "warn" : "muted"}`}>{e.status}</span></td><td>{Object.keys(e.aiFilled).length || ""}</td></tr>
        ))}{!rows.length && <tr><td colSpan={7} className="note">No events yet.</td></tr>}</tbody></table>
    </main>
  );
}
