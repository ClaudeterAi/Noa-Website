"use client";

import { useState, useTransition } from "react";
import { saveVenueAction } from "../actions";
import { venueText, type Venue, type VenueSlot } from "@/lib/venue";

/**
 * Venue facts form. One save updates the website, the booking flow, tickets, emails, calendar invites, WhatsApp and
 * the chat and voice concierge. Nothing is saved unless every field is valid.
 */
export default function VenueForm({ initial }: { initial: Venue }) {
  const [v, setV] = useState<Venue>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof Venue>(k: K, val: Venue[K]) => setV({ ...v, [k]: val });
  const pair = (k: "pier" | "landmark" | "dressCode" | "cancellation", lang: "en" | "ar", val: string) => set(k, { ...v[k], [lang]: val });
  const ses = (s: VenueSlot, f: keyof Venue["sessions"]["afternoon"], val: string) =>
    setV({ ...v, sessions: { ...v.sessions, [s]: { ...v.sessions[s], [f]: f === "minAge" ? Number(val) : val } } });
  const num = (k: "crossingMinutes" | "boatEveryMinutes" | "arriveBeforeMinutes" | "boardingClosesMinutes", val: string) => set(k, Number(val) as Venue[typeof k]);
  const en = venueText(v, "en");
  const save = () => start(async () => { setMsg(null); const r = await saveVenueAction(v); setMsg(r.ok ? { ok: true, text: "Saved. The website, tickets, emails and concierge now use these facts." } : { ok: false, text: r.error ?? "Not saved" }); });
  const row = { display: "grid", gridTemplateColumns: "180px 1fr 1fr", gap: 10, alignItems: "center", marginBottom: 8 } as const;
  const sessions: VenueSlot[] = ["afternoon", "night", "morning"];
  return (
    <section className="card" style={{ marginBottom: 24 }}>
      <h2 style={{ marginTop: 0 }}>Venue, hours and rules</h2>
      <p className="note">One place for the facts guests rely on. Saving updates every page, the booking flow, the ticket, the emails, the calendar invite, WhatsApp and the concierge. Times are 24-hour (14:00). Arabic is required for every text.</p>

      <h3>Address and contact</h3>
      <div style={row}><label>Pier</label><input value={v.pier.en} onChange={(e) => pair("pier", "en", e.target.value)} /><input dir="rtl" value={v.pier.ar} onChange={(e) => pair("pier", "ar", e.target.value)} /></div>
      <div style={row}><label>How to find the desk</label><input value={v.landmark.en} onChange={(e) => pair("landmark", "en", e.target.value)} /><input dir="rtl" value={v.landmark.ar} onChange={(e) => pair("landmark", "ar", e.target.value)} /></div>
      <div style={row}><label>Map link</label><input value={v.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} style={{ gridColumn: "span 2" }} /></div>
      <div style={row}><label>Phone · Email</label><input value={v.phone} onChange={(e) => set("phone", e.target.value)} /><input value={v.email} onChange={(e) => set("email", e.target.value)} /></div>
      <div style={row}><label>Berth</label><input value={v.berth} onChange={(e) => set("berth", e.target.value)} /><input dir="rtl" value={v.berthAr} onChange={(e) => set("berthAr", e.target.value)} /></div>
      <p className="note">In "How to find the desk", write {"{{berth}}"} (English) or {"{{berthAr}}"} (Arabic) instead of the berth number, so it follows the field above.</p>

      <h3>Boats</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        <label>Crossing (min)<input type="number" value={v.crossingMinutes} onChange={(e) => num("crossingMinutes", e.target.value)} /></label>
        <label>A boat every (min)<input type="number" value={v.boatEveryMinutes} onChange={(e) => num("boatEveryMinutes", e.target.value)} /></label>
        <label>Arrive before (min)<input type="number" value={v.arriveBeforeMinutes} onChange={(e) => num("arriveBeforeMinutes", e.target.value)} /></label>
        <label>Boarding closes (min)<input type="number" value={v.boardingClosesMinutes} onChange={(e) => num("boardingClosesMinutes", e.target.value)} /></label>
      </div>

      <h3>Sessions</h3>
      <table><thead><tr><th>Session</th><th>Starts</th><th>Ends</th><th>First boat</th><th>Last boat back</th><th>Minimum age</th><th>Shows as</th></tr></thead>
        <tbody>{sessions.map((s) => (
          <tr key={s}><td style={{ textTransform: "capitalize" }}>{s}{s === "morning" ? " (hidden)" : ""}</td>
            {(["start", "end", "firstBoat", "lastBoat"] as const).map((f) => <td key={f}><input value={v.sessions[s][f]} onChange={(e) => ses(s, f, e.target.value)} style={{ width: 70 }} /></td>)}
            <td><input type="number" value={v.sessions[s].minAge} onChange={(e) => ses(s, "minAge", e.target.value)} style={{ width: 60 }} /></td>
            <td className="note">{en.session(s)} · last boat {en.lastBoat(s)} · {en.age(s)}</td></tr>
        ))}</tbody></table>

      <h3>Rules on the ticket</h3>
      <div style={row}><label>Dress code</label><input value={v.dressCode.en} onChange={(e) => pair("dressCode", "en", e.target.value)} /><input dir="rtl" value={v.dressCode.ar} onChange={(e) => pair("dressCode", "ar", e.target.value)} /></div>
      <div style={row}><label>Cancellation</label><textarea rows={4} value={v.cancellation.en} onChange={(e) => pair("cancellation", "en", e.target.value)} /><textarea dir="rtl" rows={4} value={v.cancellation.ar} onChange={(e) => pair("cancellation", "ar", e.target.value)} /></div>
      <div style={row}><label>Extra rules (one per line)</label>
        <textarea rows={3} value={v.extraRules.en.join("\n")} onChange={(e) => set("extraRules", { ...v.extraRules, en: e.target.value.split("\n") })} />
        <textarea dir="rtl" rows={3} value={v.extraRules.ar.join("\n")} onChange={(e) => set("extraRules", { ...v.extraRules, ar: e.target.value.split("\n") })} /></div>
      <p className="note">In the cancellation text, {"{{email}}"} and {"{{phone}}"} are replaced with the contact above. An event can override its own times, age rule, dress code and check-in notes in the event form.</p>

      <div className="row" style={{ marginTop: 14 }}>
        <button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save venue facts"}</button>
        {msg && <span className={msg.ok ? "ok-text" : "err"}>{msg.text}</span>}
      </div>
    </section>
  );
}
