"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

export type Me = { signedIn: boolean; guest?: { name: string | null; email: string; phone: string | null; tier: "guest" | "preferred" | "vip" }; lastBooking?: { ref: string; date: string; slot: string; unitTypeId: string; unitName: string; unitNameAr: string } | null };

/** Email → one-time code → signed in. Compact, lives inside the booking flow and the concierge. */
export default function GuestSignIn({ onSignedIn, compact }: { onSignedIn: (me: Me) => void; compact?: boolean }) {
  const locale = useLocale() as "en" | "ar"; const ar = locale === "ar";
  const [email, setEmail] = useState(""); const [code, setCode] = useState(""); const [session, setSession] = useState<string | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null); const [open, setOpen] = useState(!compact);
  const T = ar ? { title: "ضيف عائد؟", sub: "سجّل دخولك برمز يُرسل إلى بريدك — بلا كلمة مرور.", email: "البريد الإلكتروني", send: "أرسل الرمز", code: "الرمز المكوّن من 6 أرقام", verify: "تأكيد", resend: "إعادة إرسال", off: "تسجيل الدخول غير مفعّل بعد.", bad: "لم يُقبل الرمز. اطلب رمزاً جديداً.", link: "ضيف عائد؟ سجّل الدخول" }
    : { title: "Returning guest?", sub: "Sign in with a code sent to your email — no password.", email: "Email", send: "Send code", code: "6-digit code", verify: "Verify", resend: "Resend", off: "Sign-in isn't enabled on this preview yet.", bad: "That code was not accepted. Request a new one.", link: "Returning guest? Sign in" };

  const start = async () => {
    setBusy(true); setErr(null);
    try { const r = await fetch("/api/guest/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error?.code === "NOT_CONFIGURED" ? T.off : d.error?.message); setSession(d.session); }
    catch (e) { setErr(e instanceof Error ? e.message : "failed"); } finally { setBusy(false); }
  };
  const verify = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/guest/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code, session }) }); const d = await r.json();
      if (!r.ok) throw new Error(T.bad);
      const me = await (await fetch("/api/guest/me", { cache: "no-store" })).json(); onSignedIn(me);
    } catch (e) { setErr(e instanceof Error ? e.message : "failed"); } finally { setBusy(false); }
  };
  if (compact && !open) return <button type="button" className="pkg-more" style={{ background: "none", border: 0, cursor: "pointer" }} onClick={() => setOpen(true)}>{T.link}</button>;
  return (
    <div className="bk-signin">
      <div className="bk-cart-name">{T.title}</div><p className="bk-cart-meta" style={{ margin: "6px 0 10px" }}>{T.sub}</p>
      {!session ? (
        <form className="bk-pay-form" onSubmit={(e) => { e.preventDefault(); void start(); }}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.email} required /><button type="submit" className="bk-confirm-btn" disabled={busy || !email}>{T.send}</button></form>
      ) : (
        <form className="bk-pay-form" onSubmit={(e) => { e.preventDefault(); void verify(); }}><input inputMode="numeric" pattern="[0-9]*" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder={T.code} required autoFocus /><div className="row" style={{ display: "flex", gap: 10 }}><button type="submit" className="bk-confirm-btn" disabled={busy || code.length < 6}>{T.verify}</button><button type="button" className="pkg-more" style={{ background: "none", border: 0, cursor: "pointer" }} disabled={busy} onClick={() => { setSession(null); setCode(""); }}>{T.resend}</button></div></form>
      )}
      {err && <p className="bk-notice" role="alert">{err}</p>}
    </div>
  );
}

/** Fetch the current guest once; components use it for prefill and "welcome back". */
export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { fetch("/api/guest/me", { cache: "no-store" }).then((r) => r.json()).then(setMe).catch(() => setMe({ signedIn: false })); }, []);
  return [me, setMe] as const;
}
