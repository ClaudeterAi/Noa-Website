"use client";

import { useState } from "react";
import MovingBorder from "@/components/ui/MovingBorder";

/** Email-only sign-up; stores consent on the guest record (no new tables). */
export default function NewsletterForm({ locale }: { locale: "en" | "ar" }) {
  const [email, setEmail] = useState(""); const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const T = locale === "ar" ? { ph: "بريدك الإلكتروني", go: "اشترك", ok: "شكراً — سنراسلك قريباً.", err: "تعذّر الاشتراك. حاول مرة أخرى." } : { ph: "Your email", go: "Subscribe", ok: "Thank you — we'll be in touch.", err: "Could not subscribe. Please try again." };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setState("busy");
    try { const r = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, locale }) }); setState(r.ok ? "done" : "error"); } catch { setState("error"); }
  };
  if (state === "done") return <p className="ed-news-ok">{T.ok}</p>;
  return (
    <form className="ed-news-form" onSubmit={submit}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T.ph} aria-label={T.ph} />
      <MovingBorder paused={state === "busy"}><button type="submit" className="ed-btn mb-btn" disabled={state === "busy"}>{T.go}</button></MovingBorder>
      {state === "error" && <p className="ed-news-err" role="alert">{T.err}</p>}
    </form>
  );
}
