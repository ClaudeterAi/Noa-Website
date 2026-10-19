"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { registry } from "@/content/registry";

type Item = { date: string; slot: string; guests: number; arrivalTime: string; price: number; nameEn: string; nameAr: string; label: string; active: boolean };
type Result = { ref: string; status: string; guestName: string | null; subtotal: number; vat: number; total: number; confirmedAt: string | null; items: Item[]; ics: string | null };

/** View-only: reservations are final once paid; changes go through the manager. */
export default function ManageBooking({ initialRef }: { initialRef: string }) {
  const locale = useLocale() as "en" | "ar"; const ar = locale === "ar";
  const [ref, setRef] = useState(initialRef); const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null); const [err, setErr] = useState<string | null>(null);
  const T = ar
    ? { h: "حجزي", sub: "أدخل الرقم المرجعي والبريد الإلكتروني المستخدم في الحجز", ref: "الرقم المرجعي", email: "البريد الإلكتروني", find: "عرض الحجز", notFound: "لم نجد حجزاً بهذا الرقم والبريد.", status: "الحالة", total: "الإجمالي المدفوع", cal: "إضافة إلى التقويم", change: "تعديل الحجز", changeBody: "الحجوزات نهائية بعد الدفع ولا يمكن إلغاؤها عبر الإنترنت. لتغيير الموعد أو أي استفسار، تواصل مع مديرنا مباشرة:", arrive: "الوصول", guests: "ضيوف", dir: "الوصول إلى نوا" }
    : { h: "My reservation", sub: "Enter your reference and the email you booked with", ref: "Reference", email: "Email", find: "View reservation", notFound: "No reservation matches that reference and email.", status: "Status", total: "Total paid", cal: "Add to calendar", change: "Changing your reservation", changeBody: "Reservations are final once paid and cannot be cancelled online. For a date change or any question, speak to our manager directly:", arrive: "Arrive", guests: "guests", dir: "Getting to NOA" };
  const SLOT: Record<string, string> = ar ? { morning: "الصباح", afternoon: "بعد الظهر", night: "الليل", full: "يوم كامل" } : { morning: "Morning", afternoon: "Afternoon", night: "Night", full: "Full day" };
  const fmt = (d: string) => new Intl.DateTimeFormat(ar ? "ar-AE-u-nu-latn" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" }).format(new Date(`${d}T12:00:00+04:00`));
  const c = registry.settings.contact;

  const lookup = async () => {
    setBusy(true); setErr(null); setRes(null);
    try {
      const r = await fetch("/api/bookings/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref, email }) });
      if (!r.ok) { setErr(T.notFound); return; }
      setRes(await r.json());
    } catch { setErr(T.notFound); } finally { setBusy(false); }
  };
  const download = () => { if (!res?.ics) return; const url = URL.createObjectURL(new Blob([res.ics], { type: "text/calendar" })); const a = document.createElement("a"); a.href = url; a.download = `NOA-${res.ref}.ics`; a.click(); URL.revokeObjectURL(url); };

  return (
    <main className="bk-wrap" style={{ paddingTop: 140, maxWidth: 720, margin: "0 auto", minHeight: "70vh" }}>
      <div className="bk-step-pre">{ar ? "الحجوزات" : "Reservations"}</div>
      <h1 className="bk-step-h">{T.h}</h1>
      {!res && (
        <form className="bk-pay-form" onSubmit={(e) => { e.preventDefault(); void lookup(); }}>
          <p className="form-meta" style={{ marginBottom: 18 }}>{T.sub}</p>
          <input type="text" value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} placeholder={`${T.ref} · NOA-XXXXXX`} required aria-label={T.ref} />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.email} required aria-label={T.email} />
          {err && <p className="bk-notice" role="alert">{err}</p>}
          <button type="submit" className="bk-confirm-btn" disabled={busy}>{T.find}</button>
        </form>
      )}
      {res && (
        <div>
          <div className="bk-cart-item" style={{ display: "block" }}>
            <div className="bk-cart-name">{res.ref} · <span style={{ textTransform: "uppercase", fontSize: ".62rem", letterSpacing: ".2em" }}>{T.status}: {res.status}</span></div>
            {res.items.map((i, k) => (
              <div key={k} className="bk-cart-meta" style={{ marginTop: 10, opacity: i.active ? 1 : 0.5 }}>
                <strong>{ar ? i.nameAr : i.nameEn}</strong> · {i.label}<br />{fmt(i.date)} · {SLOT[i.slot]} · {T.arrive} {i.arrivalTime} · {i.guests} {T.guests} · AED {i.price.toLocaleString("en-US")}
              </div>
            ))}
            <div className="bk-cart-meta" style={{ marginTop: 14 }}><strong>{T.total}: AED {res.total.toLocaleString("en-US")}</strong> <span style={{ opacity: 0.6 }}>(VAT AED {res.vat.toLocaleString("en-US")})</span></div>
            <div className="row" style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              {res.ics && <button type="button" className="pkg-btn" onClick={download}>{T.cal}</button>}
              <a className="pkg-more" href={`/${locale}/location`}>{T.dir}</a>
            </div>
          </div>
          <div className="bk-cart-item" style={{ display: "block", marginTop: 18 }}>
            <div className="bk-cart-name">{T.change}</div>
            <p className="bk-cart-meta" style={{ marginTop: 8 }}>{T.changeBody}</p>
            <p className="bk-cart-meta" style={{ marginTop: 8 }}><a href={`mailto:${c.email}?subject=${encodeURIComponent(res.ref)}`} style={{ borderBottom: "1px solid" }}>{c.email}</a> · <a href={c.phoneHref} style={{ borderBottom: "1px solid" }}>{c.phoneDisplay}</a></p>
          </div>
        </div>
      )}
    </main>
  );
}
