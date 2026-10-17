"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";

type Msg = { role: "user" | "assistant"; content: string };

/** Chat concierge panel. Streams NDJSON from /api/chat; held seats go straight to the shared cart. */
export default function ChatConcierge() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const bottom = useRef<HTMLDivElement>(null);

  const T = ar
    ? { title: "كونسيرج نوا", sub: "حجوزات · أسئلة · الوصول", placeholder: "اسأل عن المقاعد أو الأسعار أو احجز…", send: "إرسال", open: "تحدث مع نوا", goPay: "إتمام الدفع", off: "الكونسيرج غير مفعّل في هذه المعاينة بعد.", chips: ["ما المتاح هذا الجمعة بعد الظهر؟", "كم سعر الكابانا؟", "كيف أصل إلى نوا؟", "احجز لي سريراً نهارياً"], hello: "مرحباً، أنا كونسيرج نوا. كيف أساعدك اليوم؟" }
    : { title: "NOA Concierge", sub: "Reservations · Questions · Getting here", placeholder: "Ask about seats, prices, or book…", send: "Send", open: "Chat with NOA", goPay: "Complete payment", off: "The concierge isn't configured on this preview yet.", chips: ["What's free this Friday afternoon?", "How much is a cabana?", "How do I get to NOA?", "Hold a daybed for me"], hello: "Hello, I'm the NOA concierge. How can I help today?" };

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);
  useEffect(() => { if (open && !msgs.length) setMsgs([{ role: "assistant", content: T.hello }]); }, [open, msgs.length, T.hello]);

  const send = async (text: string) => {
    const content = text.trim(); if (!content || busy) return;
    setErr(null); setInput("");
    const history: Msg[] = [...msgs.filter((m, i) => !(i === 0 && m.content === T.hello)), { role: "user", content }];
    setMsgs([...msgs, { role: "user", content }, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ locale, messages: history }) });
      if (!res.ok || !res.body) { const b = await res.json().catch(() => ({})) as { error?: { code?: string } }; throw new Error(b.error?.code === "CHAT_NOT_CONFIGURED" ? T.off : "chat failed"); }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = ""; let acc = "";
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as { type: string; text?: string; name?: string; result?: { held?: unknown[]; items?: unknown[] }; message?: string };
          if (ev.type === "text" && ev.text) { acc += (acc ? "\n\n" : "") + ev.text; setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]); }
          if (ev.type === "tool" && (ev.name === "hold_seat" || ev.name === "release_hold" || ev.name === "get_cart")) {
            const n = ev.name === "get_cart" ? (ev.result?.items?.length ?? 0) : ev.name === "hold_seat" ? cartCount + (ev.result?.held?.length ?? 0) : Math.max(0, cartCount - 1);
            setCartCount(n);
          }
          if (ev.type === "error") throw new Error(ev.message);
        }
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "chat failed"); setMsgs((m) => (m.at(-1)?.content === "" ? m.slice(0, -1) : m)); }
    finally { setBusy(false); }
  };

  return (
    <>
      <button type="button" className={`cc-fab${open ? " open" : ""}`} aria-label={T.open} aria-expanded={open} onClick={() => setOpen(!open)}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M4 5h16v11H8l-4 4V5z" /></svg>
        {cartCount > 0 && <span className="cc-badge">{cartCount}</span>}
      </button>
      <div className={`cc-panel${open ? " open" : ""}`} role="dialog" aria-label={T.title} aria-hidden={!open}>
        <div className="cc-head"><div><div className="cc-title">{T.title}</div><div className="cc-sub">{T.sub}</div></div><button type="button" className="cc-close" onClick={() => setOpen(false)} aria-label="Close">×</button></div>
        <div className="cc-msgs">
          {msgs.map((m, i) => <div key={i} className={`cc-msg ${m.role}`}>{m.content || <span className="cc-typing">···</span>}</div>)}
          {msgs.length <= 1 && <div className="cc-chips">{T.chips.map((c) => <button key={c} type="button" className="cc-chip" onClick={() => void send(c)}>{c}</button>)}</div>}
          {err && <div className="cc-err" role="alert">{err}</div>}
          <div ref={bottom} />
        </div>
        {cartCount > 0 && <button type="button" className="cc-pay" onClick={() => { setOpen(false); router.push("/booking"); }}>{T.goPay} →</button>}
        <form className="cc-form" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={T.placeholder} disabled={busy} aria-label={T.placeholder} />
          <button type="submit" disabled={busy || !input.trim()}>{T.send}</button>
        </form>
      </div>
    </>
  );
}
