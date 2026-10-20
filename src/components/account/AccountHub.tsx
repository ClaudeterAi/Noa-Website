"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { loadMe, openSignIn, signOut, useGuest } from "./store";

/**
 * /account as one page, a member hub rather than a settings form. The pier pass at the top is the one bold element
 * (name, level, next sailing with its wristband QR); everything below is quiet grouped rows that save in place.
 * Every change saves itself (a row, a switch, a chip) and confirms where it happened.
 */
type Item = { unitId: string; unitEn: string; unitAr: string; guests: number; arrival: string };
type Booking = { ref: string; status: string; total: number; currency: string; createdAt: string; checkedIn: boolean; date: string; slot: string; ticket: string | null; items: Item[] };
type Account = {
  profile: { name: string | null; email: string; phone: string | null; locale: string; preferredUnitType: string | null; birthdayMonth: number | null; tier: "guest" | "preferred" | "vip"; memberSince: string };
  consents: { email: boolean; whatsapp: boolean; sms: boolean };
  bookings: { upcoming: Booking[]; past: Booking[] };
  tierRules: { preferred: { visits12m: number; minUnitTier: number }; vip: { lifetimeSpend: number; minUnitTier: number } };
  units: { id: string; en: string; ar: string; tier: number }[];
};
type Channel = "email" | "whatsapp" | "sms";
type Field = "name" | "phone";

const EN = {
  loading: "Loading your account…", signedOutTitle: "Your NOA account", signedOut: "Sign in to see your sailings, wristbands and preferences.", signIn: "Sign in",
  pass: "Pier pass", level: "Level", since: "Member since", visits: "Visits", next: "Next sailing", noNext: "No sailing booked", reserve: "Reserve a seat", arrive: "Arrive", seat: "Seat", scan: "Show this at the pier",
  nav: { sailings: "Sailings", profile: "Profile", messages: "Messages", prefs: "Your preferences", privacy: "Privacy" },
  upcoming: "Upcoming", past: "Past sailings", nonePast: "Your past visits will appear here.", noneUp: "Nothing booked yet. Pick a date and a seat and it shows up here with its wristband.",
  wristband: "Wristband", manage: "Manage", again: "Book again", guests: (n: number) => `${n} ${n === 1 ? "guest" : "guests"}`,
  status: { confirmed: "Confirmed", cancelled: "Cancelled", refunded: "Refunded", done: "Completed", checked: "Checked in" } as Record<string, string>,
  slot: { morning: "Morning", afternoon: "Afternoon", night: "Night", full: "Full day" } as Record<string, string>,
  f: { name: "Name", email: "Email", phone: "Phone", lang: "Language" }, emailLock: "Used to sign in", empty: "Add",
  edit: "Edit", save: "Save", cancel: "Cancel", saved: "Saved", failed: "Not saved. Try again.",
  msgIntro: "Events, offers and new nights. Pick how you'd like to hear from us.",
  ch: { email: ["Email", "Event announcements and offers"], whatsapp: ["WhatsApp", "Last-minute tables and night line-ups"], sms: ["SMS", "Short reminders before your sailing"] } as Record<Channel, [string, string]>,
  needPhone: "Add a phone number first",
  usualSeat: "Usual seat", usualSeatSub: "We'll show it first when you book.", noPref: "No preference",
  bday: "Birthday month", bdaySub: "For a small surprise in your month. We don't store the day or year.", rather: "Rather not say",
  ladder: "Membership", tiers: { guest: "Guest", preferred: "Preferred", vip: "VIP" },
  perk: { guest: "Book in your own time, with every booking in one place.", preferred: "Priority on seats before general release.", vip: "Members' priority on every seat, the best ones first." },
  toPreferred: (n: number, u: string) => `Preferred after ${n} visits in 12 months, or when you book ${u}.`,
  toVip: (aed: string, u: string) => `VIP at AED ${aed} lifetime, or when you book ${u}.`, top: "You're at the top level.",
  download: "Download my data", downloadSub: "Profile, consent history and bookings as a file",
  del: "Delete my account", delSub: "Marketing stops at once. Our team confirms the deletion with you; booking and payment records the law requires may be kept.",
  delReason: "Anything we should know? (optional)", delGo: "Request deletion", out: "Sign out", or: "or",
};
const AR: typeof EN = {
  loading: "جارٍ تحميل حسابك…", signedOutTitle: "حسابك في نوا", signedOut: "سجّل الدخول لرؤية رحلاتك وأساورك وتفضيلاتك.", signIn: "تسجيل الدخول",
  pass: "تصريح الرصيف", level: "المستوى", since: "عضو منذ", visits: "الزيارات", next: "الرحلة القادمة", noNext: "لا رحلة محجوزة", reserve: "احجز مقعداً", arrive: "الوصول", seat: "المقعد", scan: "أظهر هذا عند الرصيف",
  nav: { sailings: "الرحلات", profile: "الملف الشخصي", messages: "الرسائل", prefs: "تفضيلاتك", privacy: "الخصوصية" },
  upcoming: "القادمة", past: "الرحلات السابقة", nonePast: "ستظهر زياراتك السابقة هنا.", noneUp: "لا حجوزات بعد. اختر تاريخاً ومقعداً وسيظهر هنا مع سوارك.",
  wristband: "السوار", manage: "إدارة", again: "احجز مجدداً", guests: (n: number) => `${n} ${n === 1 ? "ضيف" : "ضيوف"}`,
  status: { confirmed: "مؤكد", cancelled: "ملغى", refunded: "مسترد", done: "تمّ", checked: "تمّ تسجيل الحضور" },
  slot: { morning: "الصباح", afternoon: "بعد الظهر", night: "الليل", full: "يوم كامل" },
  f: { name: "الاسم", email: "البريد الإلكتروني", phone: "الهاتف", lang: "اللغة" }, emailLock: "تستخدمه لتسجيل الدخول", empty: "أضف",
  edit: "تعديل", save: "حفظ", cancel: "إلغاء", saved: "تم الحفظ", failed: "لم يُحفظ. حاول مجدداً.",
  msgIntro: "الفعاليات والعروض والليالي الجديدة. اختر كيف تحب أن نتواصل معك.",
  ch: { email: ["البريد الإلكتروني", "إعلانات الفعاليات والعروض"], whatsapp: ["واتساب", "طاولات اللحظة الأخيرة وبرامج الليالي"], sms: ["رسائل SMS", "تذكيرات قصيرة قبل رحلتك"] },
  needPhone: "أضف رقم هاتف أولاً",
  usualSeat: "مقعدك المعتاد", usualSeatSub: "سنعرضه أولاً عند الحجز.", noPref: "لا تفضيل",
  bday: "شهر الميلاد", bdaySub: "لمفاجأة صغيرة في شهرك. لا نحفظ اليوم أو السنة.", rather: "أفضّل عدم الإفصاح",
  ladder: "العضوية", tiers: { guest: "ضيف", preferred: "مفضّل", vip: "VIP" },
  perk: { guest: "احجز في وقتك، وكل حجوزاتك في مكان واحد.", preferred: "أولوية على المقاعد قبل الطرح العام.", vip: "أولوية الأعضاء على كل مقعد، والأفضل أولاً." },
  toPreferred: (n: number, u: string) => `«مفضّل» بعد ${n} زيارات خلال 12 شهراً، أو عند حجز ${u}.`,
  toVip: (aed: string, u: string) => `VIP عند إنفاق ${aed} درهم إجمالاً، أو عند حجز ${u}.`, top: "أنت في أعلى مستوى.",
  download: "تنزيل بياناتي", downloadSub: "الملف الشخصي وسجل الموافقات والحجوزات في ملف",
  del: "حذف حسابي", delSub: "تتوقف رسائل التسويق فوراً. يؤكد فريقنا الحذف معك؛ قد نحتفظ بسجلات الحجز والدفع التي يفرضها القانون.",
  delReason: "هل هناك ما يجب أن نعرفه؟ (اختياري)", delGo: "اطلب الحذف", out: "تسجيل الخروج", or: "أو",
};

const Check = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
const Chevron = () => <svg className="hub-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>;
const Lock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;

export default function AccountHub() {
  const locale = useLocale() as "en" | "ar"; const ar = locale === "ar"; const T = ar ? AR : EN;
  const router = useRouter();
  const { me } = useGuest();
  const [acc, setAcc] = useState<Account | null>(null);
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");
  const [flash, setFlash] = useState<string | null>(null);      // key of the row that just saved
  const [error, setError] = useState<string | null>(null);      // key of the row that failed
  const [busy, setBusy] = useState<string | null>(null);
  const [delOpen, setDelOpen] = useState(false); const [reason, setReason] = useState("");
  const flashT = useRef<number | undefined>(undefined);

  const dt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(ar ? "ar-AE" : "en-GB", { timeZone: "UTC", ...o });
  const day = (d: string) => new Date(d + "T12:00:00Z");
  const money = (n: number, c: string) => `${c} ${n.toLocaleString(ar ? "ar-AE" : "en-AE")}`;
  const MONTHS = Array.from({ length: 12 }, (_, i) => dt({ month: "short" }).format(new Date(Date.UTC(2026, i, 15))));

  const load = useCallback(async () => {
    const r = await fetch("/api/guest/account", { cache: "no-store" });
    setAcc(r.ok ? ((await r.json()) as Account) : null);
  }, []);
  useEffect(() => { void loadMe(); }, []);
  useEffect(() => { if (me?.signedIn) void load(); }, [me?.signedIn, load]);
  useEffect(() => () => window.clearTimeout(flashT.current), []);

  /** Save one change. Optimistic: the page updates first, then the server confirms (or the change is undone). */
  const save = async (key: string, fields: Record<string, unknown>, optimistic: (a: Account) => Account) => {
    if (!acc) return false;
    const before = acc; setAcc(optimistic(acc)); setBusy(key); setError(null);
    try {
      const r = await fetch("/api/guest/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) });
      if (!r.ok) throw new Error();
      setFlash(key); window.clearTimeout(flashT.current); flashT.current = window.setTimeout(() => setFlash(null), 2200);
      if ("name" in fields) void loadMe(true);   // the nav initials follow the name
      return true;
    } catch { setAcc(before); setError(key); return false; } finally { setBusy(null); }
  };

  if (!me || (me.signedIn && !acc)) return <main className="hub hub-wait" data-no-motion><p>{T.loading}</p></main>;
  if (!me.signedIn) return (
    <main className="hub hub-out" data-no-motion>
      <div className="hub-out-card">
        <h1>{T.signedOutTitle}</h1><p>{T.signedOut}</p>
        <button type="button" className="hub-btn" onClick={() => openSignIn("manual")}>{T.signIn}</button>
      </div>
    </main>
  );
  if (!acc) return null;

  const p = acc.profile, next = acc.bookings.upcoming[0];
  const visits = acc.bookings.past.filter((b) => b.status === "confirmed").length;
  const unitsFrom = (min: number) => { const u = acc.units.filter((x) => x.tier >= min).map((x) => (ar ? x.ar : x.en)); return u.length ? u.slice(0, 2).join(ar ? " أو " : " or ") : ar ? "مقعداً مميّزاً" : "a premium seat"; };
  const nextRule = p.tier === "guest" ? T.toPreferred(acc.tierRules.preferred.visits12m, unitsFrom(acc.tierRules.preferred.minUnitTier))
    : p.tier === "preferred" ? T.toVip(acc.tierRules.vip.lifetimeSpend.toLocaleString(ar ? "ar-AE" : "en-AE"), unitsFrom(acc.tierRules.vip.minUnitTier)) : T.top;
  const statusOf = (b: Booking, past: boolean) => b.status === "confirmed" ? (b.checkedIn ? T.status.checked : past ? T.status.done : T.status.confirmed) : T.status[b.status] ?? b.status;
  const seatLine = (b: Booking) => b.items.map((i) => `${ar ? i.unitAr : i.unitEn} ${i.unitId}`).join(", ");
  const guestsOf = (b: Booking) => b.items.reduce((n, i) => n + i.guests, 0);

  const saved = (k: string) => flash === k ? <span className="hub-saved" role="status"><Check />{T.saved}</span> : error === k ? <span className="hub-failed" role="alert">{T.failed}</span> : null;

  /** A profile row that edits in place: value + Edit → field + Save / Cancel; Enter saves, Escape cancels. */
  // render helpers are called as functions, not mounted as components, so the open text field keeps focus while typing
  const editRow = ({ field, label, value, type = "text", dir }: { field: Field; label: string; value: string | null; type?: string; dir?: "ltr" }) => {
    const open = editing === field;
    const commit = async () => {
      const v = draft.trim();
      if (field === "name" && !v) return;
      const ok = await save(field, { [field]: field === "phone" ? (v || null) : v }, (a) => ({ ...a, profile: { ...a.profile, [field]: field === "phone" ? (v || null) : v } }));
      if (ok) setEditing(null);
    };
    return (
      <li key={field} className={`hub-row${open ? " is-open" : ""}`}>
        <span className="hub-row-label">{label}</span>
        {open ? (
          <form className="hub-edit" onSubmit={(e) => { e.preventDefault(); void commit(); }}>
            <input autoFocus type={type} dir={dir} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setEditing(null); }}
              autoComplete={field === "name" ? "name" : "tel"} placeholder={field === "phone" ? "+971 50 000 0000" : undefined} aria-label={label} />
            <span className="hub-edit-acts">
              <button type="submit" className="hub-btn sm" disabled={busy === field}>{T.save}</button>
              <button type="button" className="hub-link" onClick={() => setEditing(null)}>{T.cancel}</button>
            </span>
          </form>
        ) : (
          <>
            <span className={`hub-row-value${value ? "" : " is-empty"}`} dir={dir}>{value || T.empty}</span>
            <span className="hub-row-end">{saved(field)}
              <button type="button" className="hub-link" onClick={() => { setEditing(field); setDraft(value ?? ""); setError(null); }} aria-label={`${T.edit} ${label}`}>{value ? T.edit : T.empty}</button>
            </span>
          </>
        )}
      </li>
    );
  };

  const section = (id: string, title: string, children: ReactNode, sub?: string) => (
    <section className="hub-sec" id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="hub-h2">{title}</h2>{sub && <p className="hub-sub">{sub}</p>}{children}
    </section>
  );

  const ticket = (b: Booking) => (
    <li key={b.ref} className="hub-tix">
      <div className="hub-tix-main">
        <p className="hub-tix-date">{dt({ weekday: "long", day: "numeric", month: "long" }).format(day(b.date))}</p>
        <p className="hub-tix-meta">{T.slot[b.slot] ?? b.slot} <span aria-hidden="true">/</span> <span dir="ltr">{b.ref}</span></p>
        <p className="hub-tix-seat">{seatLine(b)}</p>
        <p className="hub-tix-meta">{T.guests(guestsOf(b))} <span aria-hidden="true">/</span> {money(b.total, b.currency)}</p>
      </div>
      <div className="hub-tix-stub">
        <span className="hub-tix-k">{T.arrive}</span>
        <span className="hub-tix-time" dir="ltr">{b.items[0]?.arrival ?? ""}</span>
        <span className={`hub-chip${b.checkedIn ? " is-in" : ""}`}>{statusOf(b, false)}</span>
        <span className="hub-tix-acts">
          {b.ticket && <Link href={{ pathname: "/booking/ticket", query: { t: b.ticket } }} className="hub-btn sm">{T.wristband}</Link>}
          <Link href={{ pathname: "/booking/manage", query: { ref: b.ref } }} className="hub-link">{T.manage}</Link>
        </span>
      </div>
    </li>
  );

  return (
    <main className="hub" data-no-motion>
      {/* the pier pass: the one bold element on the page */}
      <article className="hub-pass" aria-label={T.pass}>
        <div className="hub-pass-main">
          <p className="hub-pass-brand"><span>NOA</span>{T.pass}</p>
          <h1 className="hub-pass-name">{p.name ?? p.email}</h1>
          <dl className="hub-pass-facts">
            <div><dt>{T.level}</dt><dd><span className={`hub-tier t-${p.tier}`}>{T.tiers[p.tier]}</span></dd></div>
            <div><dt>{T.since}</dt><dd>{dt({ month: "short", year: "numeric", timeZone: undefined }).format(new Date(p.memberSince))}</dd></div>
            <div><dt>{T.visits}</dt><dd>{visits.toLocaleString(ar ? "ar-AE" : "en-AE")}</dd></div>
          </dl>
        </div>
        <div className="hub-pass-stub">
          {next ? (
            <>
              <p className="hub-pass-k">{T.next}</p>
              <p className="hub-pass-when">{dt({ weekday: "short", day: "numeric", month: "short" }).format(day(next.date))}</p>
              <p className="hub-pass-det">{T.slot[next.slot] ?? next.slot}, {T.arrive.toLowerCase()} <span dir="ltr">{next.items[0]?.arrival}</span></p>
              {next.ticket && (
                <Link href={{ pathname: "/booking/ticket", query: { t: next.ticket } }} className="hub-pass-qr" aria-label={`${T.wristband} ${next.ref}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/bookings/qr/${next.ticket}`} alt="" width={112} height={112} />
                  <span>{T.scan}</span>
                </Link>
              )}
            </>
          ) : (
            <>
              <p className="hub-pass-k">{T.next}</p>
              <p className="hub-pass-when is-none">{T.noNext}</p>
              <Link href="/booking" className="hub-btn sand">{T.reserve}</Link>
            </>
          )}
        </div>
      </article>

      <div className="hub-body">
        <nav className="hub-rail" aria-label={ar ? "أقسام الحساب" : "Account sections"}>
          {(["sailings", "profile", "messages", "prefs", "privacy"] as const).map((k) => <a key={k} href={`#${k}`}>{T.nav[k]}</a>)}
          <button type="button" className="hub-rail-out" onClick={async () => { await signOut(); router.push("/"); }}>{T.out}</button>
        </nav>

        <div className="hub-main">
          {section("sailings", T.nav.sailings, (<>
            <h3 className="hub-h3">{T.upcoming}</h3>
            {acc.bookings.upcoming.length ? <ul className="hub-tixs">{acc.bookings.upcoming.map(ticket)}</ul>
              : <div className="hub-empty"><p>{T.noneUp}</p><Link href="/booking" className="hub-btn">{T.reserve}</Link></div>}
            <h3 className="hub-h3">{T.past}</h3>
            {acc.bookings.past.length ? (
              <ul className="hub-list">
                {acc.bookings.past.map((b) => (
                  <li key={b.ref} className="hub-row hub-past">
                    <span className="hub-past-date">{dt({ day: "numeric", month: "short", year: "numeric" }).format(day(b.date))}</span>
                    <span className="hub-past-what">{seatLine(b)}<small>{T.slot[b.slot] ?? b.slot}, {money(b.total, b.currency)}</small></span>
                    <span className="hub-row-end"><span className={`hub-chip${b.checkedIn ? " is-in" : ""}${b.status !== "confirmed" ? " is-off" : ""}`}>{statusOf(b, true)}</span>
                      <Link href="/booking" className="hub-link">{T.again}</Link></span>
                  </li>
                ))}
              </ul>
            ) : <p className="hub-sub">{T.nonePast}</p>}
          </>))}

          {section("profile", T.nav.profile, (<>
            <ul className="hub-list">
              {editRow({ field: "name", label: T.f.name, value: p.name })}
              <li className="hub-row">
                <span className="hub-row-label">{T.f.email}</span>
                <span className="hub-row-value" dir="ltr">{p.email}</span>
                <span className="hub-row-end hub-lock"><Lock />{T.emailLock}</span>
              </li>
              {editRow({ field: "phone", label: T.f.phone, value: p.phone, type: "tel", dir: "ltr" })}
              <li className="hub-row">
                <span className="hub-row-label">{T.f.lang}</span>
                <span className="hub-seg" role="radiogroup" aria-label={T.f.lang}>
                  {(["en", "ar"] as const).map((l) => (
                    <button key={l} type="button" role="radio" aria-checked={p.locale === l} lang={l}
                      onClick={() => p.locale !== l && void save("locale", { locale: l }, (a) => ({ ...a, profile: { ...a.profile, locale: l } }))}>{l === "en" ? "English" : "العربية"}</button>
                  ))}
                </span>
                <span className="hub-row-end">{saved("locale")}</span>
              </li>
            </ul>
          </>))}

          {section("messages", T.nav.messages, (<>
            <ul className="hub-list">
              {(["email", "whatsapp", "sms"] as const).map((c) => {
                const needs = c !== "email" && !p.phone, on = acc.consents[c];
                return (
                  <li key={c} className={`hub-row hub-toggle${needs ? " is-off" : ""}`}>
                    <span className="hub-row-label">{T.ch[c][0]}<small>{needs ? T.needPhone : T.ch[c][1]}</small></span>
                    <span className="hub-row-end">{saved(c)}
                      <button type="button" role="switch" aria-checked={on} aria-label={T.ch[c][0]} className="hub-switch" disabled={needs || busy === c}
                        onClick={() => void save(c, { consents: { [c]: !on } }, (a) => ({ ...a, consents: { ...a.consents, [c]: !on } }))}><i /></button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>), T.msgIntro)}

          {section("prefs", T.nav.prefs, (<>
            <div className="hub-pick">
              <div className="hub-pick-head"><h3 className="hub-h3">{T.usualSeat}</h3>{saved("seat")}</div>
              <p className="hub-sub">{T.usualSeatSub}</p>
              <div className="hub-chips" role="radiogroup" aria-label={T.usualSeat}>
                {[{ id: "", label: T.noPref }, ...acc.units.map((u) => ({ id: u.id, label: ar ? u.ar : u.en }))].map((o) => {
                  const on = (p.preferredUnitType ?? "") === o.id;
                  return <button key={o.id || "none"} type="button" role="radio" aria-checked={on} className="hub-pill"
                    onClick={() => !on && void save("seat", { preferredUnitType: o.id || null }, (a) => ({ ...a, profile: { ...a.profile, preferredUnitType: o.id || null } }))}>{on && <Check />}{o.label}</button>;
                })}
              </div>
            </div>
            <div className="hub-pick">
              <div className="hub-pick-head"><h3 className="hub-h3">{T.bday}</h3>{saved("bday")}</div>
              <p className="hub-sub">{T.bdaySub}</p>
              <div className="hub-months" role="radiogroup" aria-label={T.bday}>
                {MONTHS.map((m, i) => {
                  const on = p.birthdayMonth === i + 1;
                  return <button key={m} type="button" role="radio" aria-checked={on} className="hub-month"
                    onClick={() => void save("bday", { birthdayMonth: on ? null : i + 1 }, (a) => ({ ...a, profile: { ...a.profile, birthdayMonth: on ? null : i + 1 } }))}>{m}</button>;
                })}
              </div>
              {p.birthdayMonth && <button type="button" className="hub-link" onClick={() => void save("bday", { birthdayMonth: null }, (a) => ({ ...a, profile: { ...a.profile, birthdayMonth: null } }))}>{T.rather}</button>}
            </div>
            <div className="hub-pick">
              <h3 className="hub-h3">{T.ladder}</h3>
              <ol className="hub-ladder">
                {(["guest", "preferred", "vip"] as const).map((t) => (
                  <li key={t} className={t === p.tier ? "is-here" : (["guest", "preferred", "vip"].indexOf(t) < ["guest", "preferred", "vip"].indexOf(p.tier) ? "is-past" : undefined)}>
                    <span className="hub-ladder-dot" aria-hidden="true" /><b>{T.tiers[t]}</b><small>{T.perk[t]}</small>
                  </li>
                ))}
              </ol>
              <p className="hub-sub">{nextRule}</p>
            </div>
          </>))}

          {section("privacy", T.nav.privacy, (<>
            <ul className="hub-list">
              <li className="hub-row hub-action">
                <a href="/api/guest/account/export" download><span className="hub-row-label">{T.download}<small>{T.downloadSub}</small></span><Chevron /></a>
              </li>
              <li className={`hub-row hub-action is-danger${delOpen ? " is-open" : ""}`}>
                {!delOpen ? (
                  <button type="button" onClick={() => setDelOpen(true)}><span className="hub-row-label">{T.del}<small>{T.delSub}</small></span><Chevron /></button>
                ) : (
                  <div className="hub-del">
                    <p className="hub-row-label">{T.del}<small>{T.delSub}</small></p>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3} placeholder={T.delReason} aria-label={T.delReason} />
                    <span className="hub-edit-acts">
                      <button type="button" className="hub-btn danger" disabled={busy === "del"} onClick={async () => {
                        setBusy("del");
                        const r = await fetch("/api/guest/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: reason || undefined }) });
                        setBusy(null); if (r.ok) { await signOut(); router.push("/"); } else setError("del");
                      }}>{T.delGo}</button>
                      <button type="button" className="hub-link" onClick={() => setDelOpen(false)}>{T.cancel}</button>
                    </span>
                    {error === "del" && <span className="hub-failed" role="alert">{T.failed}</span>}
                  </div>
                )}
              </li>
            </ul>
            <button type="button" className="hub-btn ghost hub-out-mobile" onClick={async () => { await signOut(); router.push("/"); }}>{T.out}</button>
          </>))}
        </div>
      </div>
    </main>
  );
}
