"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { closeSignIn, loadMe, openSignIn, setMe, useGuest, type GuestMe } from "./store";

/**
 * Sign-in card. Opens from the nav icon or the phone menu, or by itself ~6 seconds into a first visit:
 *   never on booking / account pages, never for a signed-in guest, never while the chat, voice concierge or phone
 *   menu is open, and not again for 14 days after "Not now". Signing in turns it off for good on this browser.
 * Desktop: centred glass card. Phone: bottom sheet. Email one-time code (Cognito EMAIL_OTP, the existing flow).
 * Google and phone sign-in are added above the email form in their own PRs, each with its backend.
 */
const AUTO_DELAY_MS = 6000;
const SNOOZE_DAYS = 14;
const KEY_SNOOZE = "noa_signin_snooze", KEY_DONE = "noa_signin_done";
const NO_AUTO = ["/booking", "/account"];
const BUSY = ".cc-panel.open, .vc-fab.connecting, .vc-fab.live, .vc-fab.listening, .vc-fab.speaking, #nav.menu-open";

const read = (k: string) => { try { return window.localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch { /* private mode */ } };

export default function SignInDialog() {
  const locale = useLocale() as "en" | "ar"; const ar = locale === "ar";
  const pathname = usePathname();
  const { me, dialog } = useGuest();
  const [step, setStep] = useState<"start" | "code" | "done">("start");
  const [email, setEmail] = useState(""); const [code, setCode] = useState(""); const [session, setSession] = useState<string | null>(null);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const autoFired = useRef(false);

  const T = ar ? {
    title: "أهلاً بك على متن نوا", sub: "سجّل الدخول برمز يصلك — بلا كلمة مرور.",
    perks: ["أولوية الأعضاء على أفضل المقاعد", "دفع أسرع في كل حجز", "كل حجوزاتك وأساورك في مكان واحد"],
    email: "البريد الإلكتروني", send: "أرسل الرمز", code: "الرمز المكوّن من 6 أرقام", verify: "تأكيد", back: "تغيير البريد", resend: "إعادة إرسال الرمز",
    sentTo: "أرسلنا رمزاً إلى", marketing: "أرسلوا لي الفعاليات والعروض والليالي الجديدة", fine: "يمكنك تغيير ذلك في أي وقت من حسابك.",
    later: "ليس الآن", close: "إغلاق", done: "تم تسجيل دخولك", welcome: "مرحباً", account: "عرض حسابي", cont: "متابعة التصفح",
    off: "تسجيل الدخول غير مفعّل بعد.", bad: "لم يُقبل الرمز. اطلب رمزاً جديداً.", label: "تسجيل الدخول",
  } : {
    title: "Welcome aboard NOA", sub: "Sign in with a one-time code. No password.",
    perks: ["Members' priority on the best seats", "Faster checkout every time", "All your bookings and wristbands in one place"],
    email: "Email address", send: "Send code", code: "6-digit code", verify: "Verify", back: "Change email", resend: "Resend code",
    sentTo: "We sent a code to", marketing: "Send me events, offers and new nights", fine: "You can change this any time in your account.",
    later: "Not now", close: "Close", done: "You're signed in", welcome: "Welcome", account: "View my account", cont: "Keep browsing",
    off: "Sign-in isn't enabled on this preview yet.", bad: "That code was not accepted. Request a new one.", label: "Sign in",
  };

  useEffect(() => { void loadMe(); }, []);

  // the automatic open, once per page load, only when nothing argues against it
  useEffect(() => {
    if (autoFired.current || !me || me.signedIn || !me.authEnabled) return;
    if (NO_AUTO.some((p) => pathname === p || pathname.startsWith(p + "/"))) return;
    if (read(KEY_DONE)) return;
    const snooze = Number(read(KEY_SNOOZE) ?? 0);
    if (snooze && Date.now() - snooze < SNOOZE_DAYS * 86_400_000) return;
    autoFired.current = true;
    const t = window.setTimeout(() => {
      if (document.hidden || document.querySelector(BUSY)) return;
      openSignIn("auto");
    }, AUTO_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [me, pathname]);

  const open = dialog !== null;
  const dismiss = () => { if (step !== "done") write(KEY_SNOOZE, String(Date.now())); closeSignIn(); };

  // reset the flow each time it opens; lock page scroll; Escape closes; Tab stays inside
  useEffect(() => {
    if (!open) return;
    setStep(me?.signedIn ? "done" : "start"); setErr(null); setCode(""); setSession(null);
    const root = document.documentElement, prev = root.style.overflow; root.style.overflow = "hidden";
    const back = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => cardRef.current?.querySelector<HTMLElement>("input, button:not(.sid-x)")?.focus({ preventScroll: true }), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { dismiss(); return; }
      if (e.key !== "Tab" || !cardRef.current) return;
      const f = Array.from(cardRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled])"));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1], at = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (at === first || !f.includes(at!))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (at === last || !f.includes(at!))) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { root.style.overflow = prev; window.removeEventListener("keydown", onKey); clearTimeout(t); back?.focus?.({ preventScroll: true }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const start = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/guest/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error?.code === "NOT_CONFIGURED" ? T.off : d.error?.message);
      setSession(d.session); setStep("code");
    } catch (e) { setErr(e instanceof Error ? e.message : "failed"); } finally { setBusy(false); }
  };
  const verify = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/guest/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code, session, marketing, source: "popup" }) });
      if (!r.ok) throw new Error(T.bad);
      const fresh = (await (await fetch("/api/guest/me", { cache: "no-store" })).json()) as GuestMe;
      setMe(fresh); write(KEY_DONE, "1"); setStep("done");
    } catch (e) { setErr(e instanceof Error ? e.message : "failed"); } finally { setBusy(false); }
  };

  if (!open) return null;
  const who = me?.guest?.name?.split(/\s+/)[0] ?? me?.guest?.email ?? "";
  return (
    <div className="sid" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <div className="sid-card" ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="sid-title" data-auto={dialog === "auto" ? "" : undefined}>
        <button type="button" className="sid-x" aria-label={T.close} onClick={dismiss}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <span className="sid-grab" aria-hidden="true" />
        {step === "done" ? (
          <div className="sid-done">
            <span className="sid-badge" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
            <h2 id="sid-title" className="sid-title">{T.done}</h2>
            {who && <p className="sid-sub">{T.welcome}, {who}.</p>}
            <Link href="/account" className="sid-primary" onClick={() => closeSignIn()}>{T.account}</Link>
            <button type="button" className="sid-ghost" onClick={() => closeSignIn()}>{T.cont}</button>
          </div>
        ) : (
          <>
            <p className="sid-kicker">NOA</p>
            <h2 id="sid-title" className="sid-title">{T.title}</h2>
            <p className="sid-sub">{T.sub}</p>
            <ul className="sid-perks">
              {T.perks.map((p, i) => (
                <li key={p}>
                  <span aria-hidden="true">{[
                    <svg key="a" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" /></svg>,
                    <svg key="b" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>,
                    <svg key="c" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
                  ][i]}</span>{p}
                </li>
              ))}
            </ul>
            {step === "start" ? (
              <>
                <form className="sid-form" onSubmit={(e) => { e.preventDefault(); void start(); }}>
                  <label className="sid-field"><span className="sr-only">{T.email}</span>
                    <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.email} required />
                  </label>
                  <label className="sid-check"><input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /><span>{T.marketing}</span></label>
                  <button type="submit" className="sid-primary" disabled={busy || !email}>{busy ? "…" : T.send}</button>
                </form>
              </>
            ) : (
              <form className="sid-form" onSubmit={(e) => { e.preventDefault(); void verify(); }}>
                <p className="sid-sent">{T.sentTo} <b dir="ltr">{email}</b></p>
                <label className="sid-field"><span className="sr-only">{T.code}</span>
                  <input className="sid-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder={T.code} required />
                </label>
                <button type="submit" className="sid-primary" disabled={busy || code.length < 6}>{busy ? "…" : T.verify}</button>
                <div className="sid-row">
                  <button type="button" className="sid-link" disabled={busy} onClick={() => { setStep("start"); setCode(""); setSession(null); }}>{T.back}</button>
                  <button type="button" className="sid-link" disabled={busy} onClick={() => void start()}>{T.resend}</button>
                </div>
              </form>
            )}
            {err && <p className="sid-err" role="alert">{err}</p>}
            <p className="sid-fine">{T.fine}</p>
            {dialog === "auto" && step === "start" && <button type="button" className="sid-ghost" onClick={dismiss}>{T.later}</button>}
          </>
        )}
      </div>
    </div>
  );
}
