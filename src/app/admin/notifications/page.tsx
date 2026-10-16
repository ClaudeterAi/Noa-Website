import { guard, Denied } from "../_guard";
import { listNotifications } from "@/server/admin/actions";
import { RetryButton } from "../ui";

export default async function Notifications() {
  const g = await guard(); if (g.denied) return <Denied />;
  const rows = await listNotifications();
  return (
    <main className="ad-main">
      <h1>Messages</h1>
      <table><thead><tr><th>At</th><th>Channel</th><th>Template</th><th>To</th><th>Locale</th><th>Status</th><th>Attempts</th><th>Error</th><th /></tr></thead>
        <tbody>{rows.map((n) => (
          <tr key={n.id}><td className="note">{n.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td><td>{n.channel}</td><td>{n.template}</td><td>{n.to}</td><td>{n.locale}</td>
            <td><span className={`pill ${n.status === "sent" ? "ok" : n.status === "failed" ? "warn" : "muted"}`}>{n.status}</span></td><td>{n.attempts}</td><td className="err">{n.error}</td>
            <td>{(n.status === "failed" || n.status === "skipped") && <RetryButton id={n.id} />}</td></tr>
        ))}{!rows.length && <tr><td colSpan={9} className="note">No messages yet.</td></tr>}</tbody></table>
    </main>
  );
}
