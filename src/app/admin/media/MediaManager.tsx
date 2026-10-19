"use client";

import { useRef, useState, useTransition } from "react";
import { assignMediaSlotAction } from "../actions";

type Slot = { id: string; kind: "image" | "video"; label: string; placeholderUrl: string | null; assetId: string | null; currentUrl: string | null; source: string };
type Asset = { id: string; key: string; kind: string; mime: string; bytes: number; url: string; altEn: string | null; createdAt: string; used: string[] };

/** Browser → presign → PUT to S3 → register → assign. Progress and errors shown inline. */
export default function MediaManager({ canEdit, slots, assets }: { canEdit: boolean; slots: Slot[]; assets: Asset[] }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File, slotId: string | null) => {
    setMsg(null); setProgress(`${file.name}: preparing…`);
    const pre = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "presign", filename: file.name, mime: file.type, bytes: file.size }) });
    if (!pre.ok) { setProgress(null); setMsg((await pre.json()).error?.message ?? "Presign failed"); return; }
    const { key, url, kind } = (await pre.json()) as { key: string; url: string; kind: string };
    // dimensions for images / duration for videos (helps the site and the agents' alt text later)
    const meta: { width?: number; height?: number; durationSec?: number } = {};
    try {
      if (kind === "image") { const bmp = await createImageBitmap(file); meta.width = bmp.width; meta.height = bmp.height; bmp.close(); }
      else { const v = document.createElement("video"); v.preload = "metadata"; v.src = URL.createObjectURL(file); await new Promise<void>((r) => { v.onloadedmetadata = () => r(); v.onerror = () => r(); }); meta.width = v.videoWidth || undefined; meta.height = v.videoHeight || undefined; meta.durationSec = Math.round(v.duration) || undefined; URL.revokeObjectURL(v.src); }
    } catch { /* optional */ }
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest(); xhr.open("PUT", url); xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(`${file.name}: ${Math.round((e.loaded / e.total) * 100)}%`); };
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed (${xhr.status})`))); xhr.onerror = () => reject(new Error("S3 upload failed")); xhr.send(file);
    }).catch((e) => { setProgress(null); setMsg(String(e.message)); throw e; });
    setProgress(`${file.name}: registering…`);
    const reg = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "register", key, mime: file.type, bytes: file.size, ...meta, altEn: file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ") }) });
    if (!reg.ok) { setProgress(null); setMsg((await reg.json()).error?.message ?? "Register failed"); return; }
    const asset = (await reg.json()) as { id: string };
    if (slotId) { const r = await assignMediaSlotAction(slotId, asset.id); if (!r.ok) { setMsg(r.error); } else setMsg(`Assigned to ${slotId}.`); }
    else setMsg("Uploaded to the library.");
    setProgress(null); window.location.reload();
  };

  const onPick = (slotId: string | null) => { setTarget(slotId); fileRef.current?.click(); };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) start(() => upload(f, target)); };
  const assign = (slotId: string, assetId: string | null) => start(async () => { const r = await assignMediaSlotAction(slotId, assetId); setMsg(r.ok ? (assetId ? `Assigned to ${slotId}.` : `${slotId} reset to placeholder.`) : r.error); if (r.ok) window.location.reload(); });

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" hidden onChange={onFile} />
      <div className="row" style={{ marginBottom: 12 }}>{canEdit && <button type="button" onClick={() => onPick(null)} disabled={pending}>Upload to library</button>}{progress && <span className="note">{progress}</span>}{msg && <span className={msg.includes("fail") || msg.includes("Unsupported") || msg.includes("large") ? "err" : "note"}>{msg}</span>}</div>

      <h2>Site slots</h2>
      <table><thead><tr><th>Preview</th><th>Slot</th><th>Kind</th><th>Source</th><th>Assign from library</th><th /></tr></thead>
        <tbody>{slots.map((s) => (
          <tr key={s.id}>
            <td style={{ width: 160 }}>{s.currentUrl ? (s.kind === "video" ? <video src={s.currentUrl} muted playsInline style={{ width: 150, height: 84, objectFit: "cover", background: "#000" }} /> : <div style={{ width: 150, height: 84, backgroundImage: `url('${s.currentUrl}')`, backgroundSize: "cover", backgroundPosition: "center" }} />) : <span className="note">empty</span>}</td>
            <td>{s.label}<br /><span className="note">{s.id}</span></td><td>{s.kind}</td><td><span className={`pill ${s.source === "uploaded" ? "ok" : "muted"}`}>{s.source}</span></td>
            <td>{canEdit && <select defaultValue={s.assetId ?? ""} disabled={pending} onChange={(e) => assign(s.id, e.target.value || null)}><option value="">— placeholder —</option>{assets.filter((a) => a.kind === s.kind).map((a) => <option key={a.id} value={a.id}>{a.key.split("/").pop()} ({Math.round(a.bytes / 1024)} KB)</option>)}</select>}</td>
            <td>{canEdit && <span className="row"><button type="button" className="ghost" disabled={pending} onClick={() => onPick(s.id)}>Upload & assign</button>{s.assetId && <button type="button" className="ghost" disabled={pending} onClick={() => assign(s.id, null)}>Reset</button>}</span>}</td>
          </tr>
        ))}</tbody></table>

      <h2>Library</h2>
      <table><thead><tr><th>Preview</th><th>File</th><th>Type</th><th>Size</th><th>Used in</th><th>Uploaded</th></tr></thead>
        <tbody>{assets.map((a) => (
          <tr key={a.id}><td style={{ width: 160 }}>{a.kind === "video" ? <video src={a.url} muted playsInline style={{ width: 150, height: 84, objectFit: "cover", background: "#000" }} /> : <div style={{ width: 150, height: 84, backgroundImage: `url('${a.url}')`, backgroundSize: "cover", backgroundPosition: "center" }} />}</td>
            <td>{a.key.split("/").pop()}<br /><span className="note">{a.altEn}</span></td><td>{a.mime}</td><td>{(a.bytes / 1024 / 1024).toFixed(1)} MB</td><td className="note">{a.used.join(", ") || "—"}</td><td className="note">{a.createdAt.slice(0, 10)}</td></tr>
        ))}{!assets.length && <tr><td colSpan={6} className="note">Nothing uploaded yet.</td></tr>}</tbody></table>
    </div>
  );
}
