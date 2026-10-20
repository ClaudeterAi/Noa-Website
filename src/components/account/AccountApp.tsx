"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { loadMe, openSignIn, signOut, useGuest } from "./store";

type Item = { unitId: string; unitEn: string; unitAr: string; guests: number; arrival: string };
type Booking = { ref: string; status: string; total: number; currency: string; createdAt: string; checkedIn: boolean; date: string; slot: string; ticket: string | null; items: Item[] };
type Account = {
  profile: { name: string | null; email: string; phone: string | null; locale: string; preferredUnitType: string | null; birthdayMonth: number | null; tier: "guest" | "preferred" | "vip"; memberSince: string };
  consents: { email: boolean; whatsapp: boolean; sms: boolean };
  bookings: { upcoming: Booking[]; past: Booking[] };
  tierRules: { preferred: { visits12m: number; minUnitTier: number }; vip: { lifetimeSpend: number; minUnitTier: number } };
  units: { id: string; en: string; ar: string; tier: number }[];
};
type Tab = "bookings" | "details" | "preferences" | "membership";

/** /account: Bookings · Details · Preferences · Membership & privacy, for the signed-in guest. */
export default function AccountApp() {
  const locale = useLocale() as "en" | "ar"; const ar = locale === "ar";
  const router = useRouter();
  const { me } = useGuest();
  const [acc, setAcc] = useState<Account | null>(null);
  const [tab, setTab] = useState<Tab>("bookings");
  const [saving, setSaving] = useState(false); const [saved, setSaved] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", locale: "en" as "en" | "ar", preferredUnitType: "", birthdayMonth: "", email: false, whatsapp: false, sms: false });
  const [confirmDelete, setConfirmDelete] = useState(false); const [reason, setReason] = useState("");

  const T = ar ? {
    title: "حسابي", hello: "مرحباً", since: "عضو منذ", tabs: { bookings: "الحجوزات", details: "البيانات", preferences: "التفضيلات", membership: "العضوية والخصوصية" },
    upcoming: "القادمة", past: "السابقة", none: "لا حجوزات قادمة بعد.", noneCta: "احجز مقعداً", nonePast: "لا حجوزات سابقة.", wristband: "السوار", manage: "إدارة", again: "احجز مجدداً",
    guests: "ضيوف", arrive: "الوصول", status: { confirmed: "مؤكد", cancelled: "ملغى", refunded: "مسترد", done: "تمّ", checked: "تمّ تسجيل الحضور" },
    slot: { morning: "الصباح", afternoon: "بعد الظهر", night: "الليل", full: "يوم كامل" },
    name: "الاسم", email: "البريد الإلكتروني", emailNote: "تستخدمه لتسجيل الدخول.", phone: "الهاتف", lang: "اللغة", save: "حفظ", savedMsg: "تم الحفظ.",
    mk: "رسائل التسويق", mkSub: "الفعاليات والعروض والليالي الجديدة. اختر القنوات التي تناسبك.", ch: { email: "البريد الإلكتروني", whatsapp: "واتساب", sms: "رسائل SMS" },
    seat: "المقعد المفضّل", seatNone: "لا تفضيل", bday: "شهر الميلاد", bdayNote: "لمفاجأة صغيرة في شهرك. لا نحفظ تاريخاً كاملاً.", bdayNone: "لا أرغب",
    tier: "مستواك", tiers: { guest: "ضيف", preferred: "مفضّل", vip: "VIP" },
    next: { guest: (r: Account["tierRules"], u: string) => `تصبح «مفضّلاً» بعد ${r.preferred.visits12m} زيارات خلال 12 شهراً، أو عند حجز ${u}.`, preferred: (r: Account["tierRules"], u: string) => `تصبح VIP عند إنفاق ${r.vip.lifetimeSpend.toLocaleString("ar-AE")} درهم إجمالاً، أو عند حجز ${u}.`, vip: () => "أنت في أعلى مستوى. شكراً لك." },
    perks: { guest: "", preferred: "أولوية على المقاعد قبل الجميع.", vip: "أولوية أعضاء كاملة وأفضل المقاعد أولاً." },
    privacy: "الخصوصية", download: "تنزيل بياناتي", del: "حذف حسابي", delSure: "سنوقف رسائل التسويق فوراً ونسجّل خروجك. سيتواصل فريقنا لتأكيد الحذف؛ قد نحتفظ بسجلات الحجز والدفع التي يفرضها القانون.", delReason: "السبب (اختياري)", delGo: "أرسل طلب الحذف", cancel: "إلغاء", out: "تسجيل الخروج",
    signedOut: "سجّل الدخول لرؤية حجوزاتك وتفضيلاتك.", signIn: "تسجيل الدخول", loading: "جارٍ التحميل…",
  } : {
    title: "My account", hello: "Hello", since: "Member since", tabs: { bookings: "Bookings", details: "Details", preferences: "Preferences", membership: "Membership & privacy" },
    upcoming: "Upcoming", past: "Past", none: "No upcoming bookings yet.", noneCta: "Reserve a seat", nonePast: "No past bookings.", wristband: "Wristband", manage: "Manage", again: "Book again",
    guests: "guests", arrive: "Arrive", status: { confirmed: "Confirmed", cancelled: "Cancelled", refunded: "Refunded", done: "Completed", checked: "Checked in" },
    slot: { morning: "Morning", afternoon: "Afternoon", night: "Night", full: "Full day" },
    name: "Name", email: "Email", emailNote: "You sign in with this.", phone: "Phone", lang: "Language", save: "Save", savedMsg: "Saved.",
    mk: "Marketing messages", mkSub: "Events, offers and new nights. Choose the channels that suit you.", ch: { email: "Email", whatsapp: "WhatsApp", sms: "SMS" },
    seat: "Usual seat", seatNone: "No preference", bday: "Birthday month", bdayNote: "For a small surprise in your month. We don't store a full date.", bdayNone: "Rather not say",
    tier: "Your level", tiers: { guest: "Guest", preferred: "Preferred", vip: "VIP" },
    next: { guest: (r: Account["tierRules"], u: string) => `You become Preferred after ${r.preferred.visits12m} visits in 12 months, or when you book ${u}.`, preferred: (r: Account["tierRules"], u: string) => `You become VIP at AED ${r.vip.lifetimeSpend.toLocaleString("en-AE")} lifetime, or when you book ${u}.`, vip: () => "You're at the top level. Thank you." },
    perks: { guest: "", preferred: "Priority on seats before general release.", vip: "Full members' priority, the best seats first." },
    privacy: "Privacy", download: "Download my data", del: "Delete my account", delSure: "We'll stop marketing messages at once and sign you out. Our team will contact you to confirm the deletion; booking and payment records the law requires us to keep may be retained.", delReason: "Reason (optional)", delGo: "Send deletion request", cancel: "Cancel", out: "Sign out",
    signedOut: "Sign in to see your bookings and preferences.", signIn: "Sign in", loading: "Loading…",
  };
  const MONTHS = Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { month: "long" }).format(new Date(Date.UTC(2026, i, 15))));
  const fmtDate = (d: string) => new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z"));
  const money = (n: number, c: string) => `${c} ${n.toLocaleString(ar ? "ar-AE" : "en-AE")}`;

  const load = useCallback(async () => {
    const r = await fetch("/api/guest/account", { cache: "no-store" });
    if (!r.ok) { setAcc(null); return; }
    const a = (await r.json()) as Account; setAcc(a);
    setForm({ name: a.profile.name ?? "", phone: a.profile.phone ?? "", locale: (a.profile.locale as "en" | "ar") ?? "en", preferredUnitType: a.profile.preferredUnitType ?? "", birthdayMonth: a.profile.birthdayMonth ? String(a.profile.birthdayMonth) : "", ...a.consents });
  }, []);
  useEffect(() => { void loadMe(); }, []);
  useEffect(() => { if (me?.signedIn) void load(); }, [me?.signedIn, load]);

  const save = async (fields: Record<string, unknown>, label = T.savedMsg) => {
    setSaving(true); setErr(null); setSaved(null);
    try {
      const r = await fetch("/api/guest/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.message ?? "Failed");
      setSaved(label); await load(); void loadMe(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setSaving(false); }
  };

  if (!me) return <main className="acc"><p className="acc-note">{T.loading}</p></main>;
  if (!me.signedIn) return (
    <main className="acc acc-out">
      <h1 className="acc-h1">{T.title}</h1>
      <p className="acc-lead">{T.signedOut}</p>
      <button type="button" className="acc-btn" onClick={() => openSignIn("manual")}>{T.signIn}</button>
    </main>
  );
  if (!acc) return <main className="acc"><p className="acc-note">{T.loading}</p></main>;

  const p = acc.profile;
  const unitsFrom = (min: number) => { const u = acc.units.filter((x) => x.tier >= min).map((x) => (ar ? x.ar : x.en)); return u.length ? u.slice(0, 2).join(ar ? " أو " : " or ") : ar ? "مقعد مميّز" : "a premium seat"; };
  const nextText = p.tier === "guest" ? T.next.guest(acc.tierRules, unitsFrom(acc.tierRules.preferred.minUnitTier)) : p.tier === "preferred" ? T.next.preferred(acc.tierRules, unitsFrom(acc.tierRules.vip.minUnitTier)) : T.next.vip();
  const statusOf = (b: Booking, past: boolean) => b.status === "confirmed" ? (b.checkedIn ? T.status.checked : past ? T.status.done : T.status.confirmed) : (T.status as Record<string, string>)[b.status] ?? b.status;

  const card = (b: Booking, past: boolean) => (
    <li key={b.ref} className={`acc-bk${past ? " is-past" : ""}`}>
      <div className="acc-bk-top">
        <div><p className="acc-bk-date">{fmtDate(b.date)}</p><p className="acc-bk-slot">{(T.slot as Record<string, string>)[b.slot] ?? b.slot} · <span dir="ltr">{b.ref}</span></p></div>
        <span className={`acc-chip s-${b.status}${b.checkedIn ? " s-in" : ""}`}>{statusOf(b, past)}</span>
      </div>
      <ul className="acc-bk-items">
        {b.items.map((i) => <li key={i.unitId}><span>{ar ? i.unitAr : i.unitEn} <span className="acc-dim" dir="ltr">{i.unitId}</span></span><span className="acc-dim">{i.guests} {T.guests} · {T.arrive} <span dir="ltr">{i.arrival}</span></span></li>)}
      </ul>
      <div className="acc-bk-foot">
        <b>{money(b.total, b.currency)}</b>
        <span className="acc-bk-acts">
          {!past && b.ticket && <Link href={{ pathname: "/booking/ticket", query: { t: b.ticket } }} className="acc-btn sm">{T.wristband}</Link>}
          {!past && <Link href={{ pathname: "/booking/manage", query: { ref: b.ref } }} className="acc-btn sm ghost">{T.manage}</Link>}
          {past && <Link href="/booking" className="acc-btn sm ghost">{T.again}</Link>}
        </span>
      </div>
    </li>
  );

  return (
    <main className="acc">
      <header className="acc-head">
        <span className="acc-av" aria-hidden="true">{(p.name ?? p.email).split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}</span>
        <div><p className="acc-kicker">{T.hello}</p><h1 className="acc-h1">{p.name ?? p.email}</h1><p className="acc-note"><span className={`acc-tier t-${p.tier}`}>{T.tiers[p.tier]}</span> {T.since} {new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { month: "long", year: "numeric" }).format(new Date(p.memberSince))}</p></div>
      </header>

      <nav className="acc-tabs" role="tablist" aria-label={T.title}>
        {(Object.keys(T.tabs) as Tab[]).map((k) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : undefined} onClick={() => { setTab(k); setSaved(null); setErr(null); }}>{T.tabs[k]}</button>)}
      </nav>

      {tab === "bookings" && (
        <section className="acc-panel" role="tabpanel">
          <h2 className="acc-h2">{T.upcoming}</h2>
          {acc.bookings.upcoming.length ? <ul className="acc-list">{acc.bookings.upcoming.map((b) => card(b, false))}</ul>
            : <div className="acc-empty"><p>{T.none}</p><Link href="/booking" className="acc-btn">{T.noneCta}</Link></div>}
          <h2 className="acc-h2">{T.past}</h2>
          {acc.bookings.past.length ? <ul className="acc-list">{acc.bookings.past.map((b) => card(b, true))}</ul> : <p className="acc-note">{T.nonePast}</p>}
        </section>
      )}

      {tab === "details" && (
        <section className="acc-panel" role="tabpanel">
          <form className="acc-form" onSubmit={(e) => { e.preventDefault(); void save({ name: form.name, phone: form.phone || null, locale: form.locale }); }}>
            <label><span>{T.name}</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required /></label>
            <label><span>{T.email}</span><input value={p.email} readOnly dir="ltr" /><small>{T.emailNote}</small></label>
            <label><span>{T.phone}</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} type="tel" autoComplete="tel" dir="ltr" placeholder="+971 50 000 0000" /></label>
            <label><span>{T.lang}</span><select value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value as "en" | "ar" })}><option value="en">English</option><option value="ar">العربية</option></select></label>
            <button type="submit" className="acc-btn" disabled={saving}>{T.save}</button>
          </form>
        </section>
      )}

      {tab === "preferences" && (
        <section className="acc-panel" role="tabpanel">
          <form className="acc-form" onSubmit={(e) => { e.preventDefault(); void save({ consents: { email: form.email, whatsapp: form.whatsapp, sms: form.sms }, preferredUnitType: form.preferredUnitType || null, birthdayMonth: form.birthdayMonth ? Number(form.birthdayMonth) : null }); }}>
            <fieldset className="acc-fs"><legend>{T.mk}</legend><p className="acc-note">{T.mkSub}</p>
              {(["email", "whatsapp", "sms"] as const).map((c) => (
                <label key={c} className="acc-switch"><span>{T.ch[c]}</span><input type="checkbox" role="switch" checked={form[c]} onChange={(e) => setForm({ ...form, [c]: e.target.checked })} /><i aria-hidden="true" /></label>
              ))}
            </fieldset>
            <label><span>{T.seat}</span><select value={form.preferredUnitType} onChange={(e) => setForm({ ...form, preferredUnitType: e.target.value })}><option value="">{T.seatNone}</option>{acc.units.map((u) => <option key={u.id} value={u.id}>{ar ? u.ar : u.en}</option>)}</select></label>
            <label><span>{T.bday}</span><select value={form.birthdayMonth} onChange={(e) => setForm({ ...form, birthdayMonth: e.target.value })}><option value="">{T.bdayNone}</option>{MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}</select><small>{T.bdayNote}</small></label>
            <button type="submit" className="acc-btn" disabled={saving}>{T.save}</button>
          </form>
        </section>
      )}

      {tab === "membership" && (
        <section className="acc-panel" role="tabpanel">
          <div className="acc-tiercard">
            <p className="acc-kicker">{T.tier}</p>
            <p className={`acc-tier big t-${p.tier}`}>{T.tiers[p.tier]}</p>
            {T.perks[p.tier] && <p>{T.perks[p.tier]}</p>}
            <p className="acc-note">{nextText}</p>
          </div>
          <h2 className="acc-h2">{T.privacy}</h2>
          <div className="acc-privacy">
            <a href="/api/guest/account/export" className="acc-btn ghost" download>{T.download}</a>
            <button type="button" className="acc-btn ghost" onClick={async () => { await signOut(); router.push("/"); }}>{T.out}</button>
            {!confirmDelete ? <button type="button" className="acc-btn danger" onClick={() => setConfirmDelete(true)}>{T.del}</button> : (
              <div className="acc-del" role="group" aria-label={T.del}>
                <p>{T.delSure}</p>
                <label><span>{T.delReason}</span><textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3} /></label>
                <div className="acc-row">
                  <button type="button" className="acc-btn danger" disabled={saving} onClick={async () => {
                    setSaving(true);
                    const r = await fetch("/api/guest/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: reason || undefined }) });
                    setSaving(false); if (r.ok) { await signOut(); router.push("/"); } else setErr("Failed");
                  }}>{T.delGo}</button>
                  <button type="button" className="acc-btn ghost" onClick={() => setConfirmDelete(false)}>{T.cancel}</button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {(saved || err) && <p className={`acc-toast${err ? " is-err" : ""}`} role="status">{err ?? saved}</p>}
    </main>
  );
}
