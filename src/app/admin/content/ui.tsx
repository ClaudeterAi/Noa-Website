"use client";

import { useState, useTransition } from "react";
import { resetContentAction, saveContentAction } from "../actions";

type Pair = { en: string; ar: string };

export function ContentRow({ path, label, original, current }: { path: string; label: string; original: Pair; current: (Pair & { reviewed: boolean }) | null }) {
  const [en, setEn] = useState(current?.en ?? original.en);
  const [ar, setAr] = useState(current?.ar ?? original.ar);
  const [reviewed, setReviewed] = useState(current?.reviewed ?? false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const dirty = en !== (current?.en ?? original.en) || ar !== (current?.ar ?? original.ar) || (!!current && reviewed !== current.reviewed);
  const rows = (s: string) => Math.min(10, Math.max(2, Math.ceil(s.length / 70)));
  return (
    <section className="card" style={{ marginBottom: 10, padding: "12px 14px" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <code style={{ fontSize: ".72rem", color: "#777" }}>{label}</code>
        {current ? <span className="pill">edited</span> : <span className="note">original</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
        <textarea value={en} onChange={(e) => setEn(e.target.value)} rows={rows(en)} aria-label="English" />
        <textarea value={ar} onChange={(e) => setAr(e.target.value)} rows={rows(ar)} dir="rtl" aria-label="Arabic" />
      </div>
      <div className="row" style={{ marginTop: 6, gap: 10 }}>
        <label className="note"><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} /> Arabic reviewed</label>
        <button disabled={!dirty || pending} onClick={() => start(async () => { setMsg(null); const r = await saveContentAction({ path, en, ar, arReviewed: reviewed }); setMsg(r.ok ? { ok: true, t: "Saved, live on the site" } : { ok: false, t: r.error ?? "Not saved" }); })}>{pending ? "Saving…" : "Save"}</button>
        {current && <button className="ghost" disabled={pending} onClick={() => start(async () => { const r = await resetContentAction(path); if (r.ok) { setEn(original.en); setAr(original.ar); setReviewed(false); setMsg({ ok: true, t: "Back to the original" }); } else setMsg({ ok: false, t: r.error ?? "Not reset" }); })}>Reset to original</button>}
        {msg && <span className={msg.ok ? "ok-text" : "err"}>{msg.t}</span>}
      </div>
      {current && <details className="note" style={{ marginTop: 4 }}><summary>Original wording</summary><p>{original.en}</p><p dir="rtl">{original.ar}</p></details>}
    </section>
  );
}
