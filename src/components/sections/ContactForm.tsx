"use client";

import { venueSnapshot, venueText } from "@/lib/venue";
import { useState } from "react";
import MovingBorder from "@/components/ui/MovingBorder";

interface Props {
  labels: Record<string, string>;
  reasons: string[];
  countries: string[];
}

/** Day 1: same fields as the static form; submits nowhere yet (Day 3 wires Resend + admin inbox). */
export default function ContactForm({ labels, reasons, countries }: Props) {
  const [sent, setSent] = useState(false);
  if (sent) return <p className="form-meta" role="status">{labels.received}</p>;
  return (
    <form className="rv d2" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
      <div className="form-grid">
        <div className="form-field"><label htmlFor="cf-first">{labels.first}</label><input id="cf-first" type="text" name="first" required /></div>
        <div className="form-field"><label htmlFor="cf-last">{labels.last}</label><input id="cf-last" type="text" name="last" required /></div>
        <div className="form-field"><label htmlFor="cf-email">{labels.email}</label><input id="cf-email" type="email" name="email" required /></div>
        <div className="form-field"><label htmlFor="cf-phone">{labels.phone}</label><input id="cf-phone" type="tel" name="phone" /></div>
        <div className="form-field full"><label htmlFor="cf-dept">{labels.reason}</label>
          <select id="cf-dept" name="dept">{reasons.map((r) => <option key={r}>{r}</option>)}</select>
        </div>
        <div className="form-field full"><label htmlFor="cf-country">{labels.country}</label>
          <select id="cf-country" name="country">{countries.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="form-field full"><label htmlFor="cf-msg">{labels.message}</label><textarea id="cf-msg" name="message" placeholder={labels.messagePlaceholder} required /></div>
        <div className="form-field full" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><input type="checkbox" id="c1" style={{ width: "auto", flex: "none" }} required /><label htmlFor="c1" style={{ margin: 0 }}>{labels.consent}</label></div>
        <div className="form-field full" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><input type="checkbox" id="c2" style={{ width: "auto", flex: "none" }} /><label htmlFor="c2" style={{ margin: 0 }}>{labels.newsletter}</label></div>
      </div>
      <div className="form-actions"><MovingBorder><button type="submit" className="pkg-btn mb-btn">{labels.send}</button></MovingBorder></div>
      <p className="form-meta" style={{ marginTop: 24 }}>{labels.urgent} <a href={venueText(venueSnapshot(), "en").phoneHref} style={{ borderBottom: "1px solid", color: "#1a1a1a" }}>{venueSnapshot().phone}</a>.</p>
    </form>
  );
}
