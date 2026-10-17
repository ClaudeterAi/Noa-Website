"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { events } from "@/db/schema";
import { autofillEventAction, saveEventAction, setEventStatusAction } from "../actions";

type Row = typeof events.$inferSelect;
type Form = {
  titleEn: string; titleAr: string; slug: string; date: string; session: Row["session"]; kind: Row["kind"]; startsAt: string; endsAt: string; doorsAt: string; area: string;
  pitchEn: string; pitchAr: string; descriptionEn: string; descriptionAr: string; vibeTags: string; dressCodeOverride: string; ageRuleOverride: string;
  lineup: { name: string; role: string; origin: string; genre: string; setTime: string; bio: string }[];
  seatTypes: string[]; surchargeAed: string; minSpendCabanaAed: string; capacityCap: string; memberPresaleHours: string; salesOpenAt: string; salesCloseAt: string;
  talkingPoints: string; objections: string; doNotPromise: string;
  highlightsEn: string; highlightsAr: string; attendance: string; quotes: string;
  faqs: string; shuttleNotes: string; checkinNotes: string; sponsor: string; internalNotes: string;
  seoTitle: string; seoDescription: string; announceOnPublish: boolean; sortWeight: string; featuredUntil: string;
};

const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const qa = (s: string) => lines(s).map((l) => { const [q, ...a] = l.split("|"); return { q: q.trim(), a: a.join("|").trim() }; }).filter((x) => x.q && x.a);

function fromRow(e: Row | null): Form {
  return {
    titleEn: e?.titleEn ?? "", titleAr: e?.titleAr ?? "", slug: e?.slug ?? "", date: e?.date ?? "", session: e?.session ?? "afternoon", kind: e?.kind ?? "regular",
    startsAt: e?.startsAt ?? "", endsAt: e?.endsAt ?? "", doorsAt: e?.doorsAt ?? "", area: e?.area ?? "",
    pitchEn: e?.pitchEn ?? "", pitchAr: e?.pitchAr ?? "", descriptionEn: e?.descriptionEn ?? "", descriptionAr: e?.descriptionAr ?? "", vibeTags: (e?.vibeTags ?? []).join(", "),
    dressCodeOverride: e?.dressCodeOverride ?? "", ageRuleOverride: e?.ageRuleOverride ?? "",
    lineup: (e?.lineup ?? []).map((a) => ({ name: a.name, role: a.role ?? "headliner", origin: a.origin ?? "", genre: a.genre ?? "", setTime: a.setTime ?? "", bio: a.bio ?? "" })),
    seatTypes: e?.ticketing.seatTypes ?? [], surchargeAed: String(e?.ticketing.surchargeAed ?? ""), minSpendCabanaAed: String(e?.ticketing.minSpendCabanaAed ?? ""), capacityCap: String(e?.ticketing.capacityCap ?? ""), memberPresaleHours: String(e?.ticketing.memberPresaleHours ?? ""), salesOpenAt: e?.ticketing.salesOpenAt ?? "", salesCloseAt: e?.ticketing.salesCloseAt ?? "",
    talkingPoints: (e?.agentGuidance.talkingPoints ?? []).join("\n"), objections: (e?.agentGuidance.objections ?? []).map((o) => `${o.q} | ${o.a}`).join("\n"), doNotPromise: (e?.agentGuidance.doNotPromise ?? []).join("\n"),
    highlightsEn: e?.recap.highlightsEn ?? "", highlightsAr: e?.recap.highlightsAr ?? "", attendance: e?.recap.attendance ?? "", quotes: (e?.recap.quotes ?? []).join("\n"),
    faqs: (e?.ops.faqs ?? []).map((f) => `${f.q} | ${f.a}`).join("\n"), shuttleNotes: e?.ops.shuttleNotes ?? "", checkinNotes: e?.ops.checkinNotes ?? "", sponsor: e?.ops.sponsor ?? "", internalNotes: e?.ops.internalNotes ?? "",
    seoTitle: e?.seo.title ?? "", seoDescription: e?.seo.description ?? "", announceOnPublish: e?.announceOnPublish ?? false, sortWeight: String(e?.sortWeight ?? 0), featuredUntil: e?.featuredUntil ?? "",
  };
}

function toInput(f: Form, aiFilled: Record<string, { confidence: number; source: string }>) {
  const num = (s: string) => (s.trim() ? Number(s) : undefined);
  return {
    titleEn: f.titleEn.trim(), titleAr: f.titleAr || null, slug: f.slug || undefined, date: f.date, session: f.session, kind: f.kind,
    startsAt: f.startsAt || null, endsAt: f.endsAt || null, doorsAt: f.doorsAt || null, area: f.area || null,
    pitchEn: f.pitchEn || null, pitchAr: f.pitchAr || null, descriptionEn: f.descriptionEn || null, descriptionAr: f.descriptionAr || null,
    vibeTags: f.vibeTags.split(",").map((t) => t.trim()).filter(Boolean), dressCodeOverride: f.dressCodeOverride || null, ageRuleOverride: f.ageRuleOverride || null,
    lineup: f.lineup.filter((a) => a.name.trim()).map((a) => ({ ...a, role: a.role as "headliner" | "support" | "resident" })),
    ticketing: { seatTypes: f.seatTypes, surchargeAed: num(f.surchargeAed), minSpendCabanaAed: num(f.minSpendCabanaAed), capacityCap: num(f.capacityCap), memberPresaleHours: num(f.memberPresaleHours), salesOpenAt: f.salesOpenAt || undefined, salesCloseAt: f.salesCloseAt || undefined },
    agentGuidance: { talkingPoints: lines(f.talkingPoints), objections: qa(f.objections), doNotPromise: lines(f.doNotPromise) },
    recap: { highlightsEn: f.highlightsEn || undefined, highlightsAr: f.highlightsAr || undefined, attendance: f.attendance || undefined, quotes: lines(f.quotes) },
    ops: { faqs: qa(f.faqs), shuttleNotes: f.shuttleNotes || undefined, checkinNotes: f.checkinNotes || undefined, sponsor: f.sponsor || undefined, internalNotes: f.internalNotes || undefined },
    seo: { title: f.seoTitle || undefined, description: f.seoDescription || undefined }, announceOnPublish: f.announceOnPublish,
    sortWeight: Number(f.sortWeight) || 0, featuredUntil: f.featuredUntil || null, aiFilled,
  };
}

export default function EventForm({ event, seatTypes }: { event: Row | null; seatTypes: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState<Form>(fromRow(event));
  const [ai, setAi] = useState<Record<string, { confidence: number; source: string }>>(event?.aiFilled ?? {});
  const [notes, setNotes] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF((x) => ({ ...x, [k]: v })); if (ai[k as string]) setAi((a) => { const n = { ...a }; delete n[k as string]; return n; }); };
  const mark = (k: string) => ai[k] ? <span className="pill" title={`AI-filled · confidence ${Math.round(ai[k].confidence * 100)}% · ${ai[k].source}`}>AI {Math.round(ai[k].confidence * 100)}%</span> : null;

  const autofill = () => start(async () => {
    setMsg(null);
    const r = await autofillEventAction({ titleEn: f.titleEn, titleAr: f.titleAr || undefined, date: f.date, session: f.session, startsAt: f.startsAt || undefined, endsAt: f.endsAt || undefined, area: f.area || undefined, pitchEn: f.pitchEn || undefined, pitchAr: f.pitchAr || undefined, descriptionEn: f.descriptionEn || undefined, descriptionAr: f.descriptionAr || undefined, vibeTags: f.vibeTags ? f.vibeTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined, lineup: f.lineup.filter((a) => a.name.trim()).map((a) => ({ name: a.name, role: a.role as "headliner", origin: a.origin || undefined, genre: a.genre || undefined, setTime: a.setTime || undefined, bio: a.bio || undefined })), agentGuidance: f.talkingPoints ? { talkingPoints: lines(f.talkingPoints) } : undefined, seo: f.seoTitle ? { title: f.seoTitle, description: f.seoDescription } : undefined });
    if (!r.ok) { setMsg(r.error); return; }
    if (!r.data) { setMsg("Auto-fill returned nothing"); return; }
    const d = r.data.draft;
    setF((x) => ({ ...x, titleAr: d.titleAr ?? x.titleAr, pitchEn: d.pitchEn ?? x.pitchEn, pitchAr: d.pitchAr ?? x.pitchAr, descriptionEn: d.descriptionEn ?? x.descriptionEn, descriptionAr: d.descriptionAr ?? x.descriptionAr,
      vibeTags: d.vibeTags?.length ? d.vibeTags.join(", ") : x.vibeTags, startsAt: d.startsAt ?? x.startsAt, endsAt: d.endsAt ?? x.endsAt,
      lineup: d.lineup?.length ? d.lineup.map((a) => ({ name: a.name, role: a.role ?? "headliner", origin: a.origin ?? "", genre: a.genre ?? "", setTime: a.setTime ?? "", bio: a.bio ?? "" })) : x.lineup,
      talkingPoints: d.agentGuidance?.talkingPoints?.length ? d.agentGuidance.talkingPoints.join("\n") : x.talkingPoints, objections: d.agentGuidance?.objections?.length ? d.agentGuidance.objections.map((o) => `${o.q} | ${o.a}`).join("\n") : x.objections, doNotPromise: d.agentGuidance?.doNotPromise?.length ? d.agentGuidance.doNotPromise.join("\n") : x.doNotPromise,
      seoTitle: d.seo?.title ?? x.seoTitle, seoDescription: d.seo?.description ?? x.seoDescription }));
    const data = r.data; setAi((a) => ({ ...a, ...data.aiFilled })); setNotes(data.notes);
  });

  const save = (thenPublish = false) => start(async () => {
    setMsg(null);
    if (!f.titleEn.trim() || !f.date) { setMsg("Title and date are required"); return; }
    const r = await saveEventAction(event?.id ?? null, toInput(f, ai));
    if (!r.ok) { setMsg(r.error); return; }
    if (!r.data) { setMsg("Save returned nothing"); return; }
    const saved = r.data;
    if (thenPublish) { const p = await setEventStatusAction(saved.id, "published"); if (!p.ok) { setMsg(p.error); return; } }
    router.push(`/admin/events/${saved.id}`); router.refresh();
    setMsg(thenPublish ? "Published — website updated, voice agent syncing." : "Saved.");
  });

  const status = (s: "draft" | "published" | "past" | "cancelled") => start(async () => { if (!event) return; const r = await setEventStatusAction(event.id, s); setMsg(r.ok ? `Status: ${s}` : r.error); router.refresh(); });
  const T = (label: string, k: keyof Form, rows = 3, extra?: React.ReactNode) => (
    <label className="card" style={{ display: "block" }}><div className="l">{label} {mark(k as string)}</div>
      <textarea value={String(f[k])} onChange={(e) => set(k, e.target.value as never)} rows={rows} style={{ width: "100%", font: "inherit", fontSize: ".82rem", padding: 8, border: "1px solid #d6d1c8" }} />{extra}</label>
  );
  const I = (label: string, k: keyof Form, type = "text") => (
    <label className="card" style={{ display: "block" }}><div className="l">{label} {mark(k as string)}</div><input type={type} value={String(f[k])} onChange={(e) => set(k, e.target.value as never)} style={{ width: "100%" }} /></label>
  );

  return (
    <div>
      <div className="row" style={{ marginBottom: 14 }}>
        <button type="button" onClick={autofill} disabled={pending || !f.titleEn}>{pending ? "Working…" : "Auto-fill missing fields with AI"}</button>
        <button type="button" className="ghost" onClick={() => save(false)} disabled={pending}>Save draft</button>
        <button type="button" onClick={() => save(true)} disabled={pending}>Save & publish</button>
        {event && event.status === "published" && <button type="button" className="ghost" onClick={() => status("past")} disabled={pending}>Mark as past</button>}
        {event && event.status !== "cancelled" && <button type="button" className="ghost" onClick={() => { if (confirm("Cancel this event? It is removed from the site and the agents.")) status("cancelled"); }} disabled={pending}>Cancel event</button>}
        {msg && <span className={msg.includes("fail") || msg.includes("required") ? "err" : "note"}>{msg}</span>}
      </div>
      {!!notes.length && <div className="card" style={{ marginBottom: 14 }}><div className="l">AI notes — please verify</div><ul>{notes.map((n) => <li key={n} className="note">{n}</li>)}</ul></div>}
      {!!Object.keys(ai).length && <p className="note">Fields marked <span className="pill">AI</span> were generated — edit or confirm them. Editing a field clears its mark.</p>}

      <h2>Identity & timing</h2>
      <div className="cards">{I("Title (EN)", "titleEn")}{I("Title (AR)", "titleAr")}{I("Slug (auto if empty)", "slug")}{I("Date", "date", "date")}
        <label className="card" style={{ display: "block" }}><div className="l">Session</div><select value={f.session} onChange={(e) => set("session", e.target.value as Form["session"])}>{["morning", "afternoon", "night", "full"].map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="card" style={{ display: "block" }}><div className="l">Kind</div><select value={f.kind} onChange={(e) => set("kind", e.target.value as Form["kind"])}><option value="regular">regular</option><option value="main">main (featured upcoming)</option><option value="highlight">highlight (best past — social proof)</option></select></label>
        {I("Doors", "doorsAt", "time")}{I("Starts", "startsAt", "time")}{I("Ends", "endsAt", "time")}{I("Area / stage", "area")}{I("Featured until", "featuredUntil", "date")}{I("Sort weight", "sortWeight", "number")}</div>

      <h2>Line-up</h2>
      {f.lineup.map((a, i) => (
        <div className="cards" key={i} style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 3fr auto" }}>
          <input placeholder="Artist" value={a.name} onChange={(e) => { const l = [...f.lineup]; l[i] = { ...a, name: e.target.value }; set("lineup", l); }} />
          <select value={a.role} onChange={(e) => { const l = [...f.lineup]; l[i] = { ...a, role: e.target.value }; set("lineup", l); }}>{["headliner", "support", "resident"].map((r) => <option key={r}>{r}</option>)}</select>
          <input placeholder="Origin" value={a.origin} onChange={(e) => { const l = [...f.lineup]; l[i] = { ...a, origin: e.target.value }; set("lineup", l); }} />
          <input placeholder="Genre" value={a.genre} onChange={(e) => { const l = [...f.lineup]; l[i] = { ...a, genre: e.target.value }; set("lineup", l); }} />
          <input placeholder="Set time" value={a.setTime} onChange={(e) => { const l = [...f.lineup]; l[i] = { ...a, setTime: e.target.value }; set("lineup", l); }} />
          <input placeholder="Short bio" value={a.bio} onChange={(e) => { const l = [...f.lineup]; l[i] = { ...a, bio: e.target.value }; set("lineup", l); }} />
          <button type="button" className="ghost" onClick={() => set("lineup", f.lineup.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <div className="row"><button type="button" className="ghost" onClick={() => set("lineup", [...f.lineup, { name: "", role: "headliner", origin: "", genre: "", setTime: "", bio: "" }])}>+ Artist</button>{mark("lineup")}</div>

      <h2>The sell</h2>
      <div className="cards">{T("Pitch (EN) — one sentence the concierge says first", "pitchEn", 2)}{T("Pitch (AR)", "pitchAr", 2)}{T("Description (EN)", "descriptionEn", 6)}{T("Description (AR)", "descriptionAr", 6)}{I("Vibe tags (comma-separated)", "vibeTags")}{I("Dress code override", "dressCodeOverride")}{I("Age rule override", "ageRuleOverride")}</div>

      <h2>Tickets & seats</h2>
      <div className="cards">
        <div className="card"><div className="l">Seat types on sale</div>{seatTypes.map((t) => <label key={t.id} style={{ display: "block", fontSize: ".8rem" }}><input type="checkbox" checked={f.seatTypes.includes(t.id)} onChange={(e) => set("seatTypes", e.target.checked ? [...f.seatTypes, t.id] : f.seatTypes.filter((x) => x !== t.id))} /> {t.name}</label>)}</div>
        {I("Event surcharge (AED per seat)", "surchargeAed", "number")}{I("Cabana minimum spend (AED)", "minSpendCabanaAed", "number")}{I("Capacity cap", "capacityCap", "number")}{I("Members presale (hours before general sale)", "memberPresaleHours", "number")}{I("Sales open", "salesOpenAt", "datetime-local")}{I("Sales close", "salesCloseAt", "datetime-local")}</div>

      <h2>Agent guidance</h2>
      <div className="cards">{T("Talking points (one per line)", "talkingPoints", 4)}{T("Objections — question | answer (one per line)", "objections", 4)}{T("Do not promise (one per line)", "doNotPromise", 3)}</div>

      <h2>Recap (for past / highlight events)</h2>
      <div className="cards">{T("Highlights (EN)", "highlightsEn", 4)}{T("Highlights (AR)", "highlightsAr", 4)}{I("Attendance (e.g. sold out in 48 hours)", "attendance")}{T("Guest quotes (one per line)", "quotes", 3)}</div>

      <h2>Operations</h2>
      <div className="cards">{T("Event FAQs — question | answer (one per line)", "faqs", 4)}{I("Shuttle notes", "shuttleNotes")}{I("Check-in notes", "checkinNotes")}{I("Sponsor / partner", "sponsor")}{T("Internal notes (never published)", "internalNotes", 2)}</div>

      <h2>Growth</h2>
      <div className="cards">{I("SEO title", "seoTitle")}{T("SEO description", "seoDescription", 2)}
        <label className="card" style={{ display: "block" }}><div className="l">Announce on publish</div><input type="checkbox" checked={f.announceOnPublish} onChange={(e) => set("announceOnPublish", e.target.checked)} /> WhatsApp broadcast to opted-in guests (when templates are approved)</label></div>
    </div>
  );
}
