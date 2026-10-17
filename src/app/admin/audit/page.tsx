import { guard, Denied } from "../_guard";
import { listAudit } from "@/server/admin/actions";

export default async function Audit() {
  const g = await guard(); if (g.denied) return <Denied />;
  const rows = await listAudit();
  return (
    <main className="ad-main">
      <h1>Audit trail</h1>
      <table><thead><tr><th>At</th><th>Who</th><th>Action</th><th>Entity</th><th>Before → after</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}><td className="note">{r.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td><td>{r.actor}<br /><span className="note">{r.role}</span></td><td>{r.action}</td><td>{r.entity}<br /><span className="note">{r.entityId}</span></td><td><pre>{JSON.stringify(r.before)} → {JSON.stringify(r.after)}</pre></td></tr>
        ))}{!rows.length && <tr><td colSpan={5} className="note">Nothing yet.</td></tr>}</tbody></table>
    </main>
  );
}
