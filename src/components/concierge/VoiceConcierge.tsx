"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { usePathname } from "next/navigation";

type State = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "error" | "off";
type Session = { endSession: () => Promise<void> };

/**
 * Voice concierge on ElevenLabs Agents. Same pattern as the Claudeter site's NOVA: the SDK is loaded on
 * the first tap, one streaming session handles speech, turn-taking, the LLM and TTS; the agent drives the
 * page through client tools (navigate, open_booking, switch_language). Uses @elevenlabs/client directly —
 * the React provider has an open bug where client tools fail to register on iOS Safari.
 */
export default function VoiceConcierge() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>("idle");
  const [detail, setDetail] = useState<string>("");
  const session = useRef<Session | null>(null);
  const ar = locale === "ar";
  const T = ar
    ? { talk: "تحدث مع نوا", stop: "إنهاء", connecting: "جارٍ الاتصال…", listening: "أستمع…", thinking: "لحظة…", speaking: "نوا تتحدث", mic: "نحتاج إذن الميكروفون", off: "الصوت غير مفعّل في هذه المعاينة بعد", lost: "انقطع الاتصال — اضغط للمحاولة" }
    : { talk: "Talk to NOA", stop: "End", connecting: "Connecting…", listening: "Listening…", thinking: "One moment…", speaking: "NOA is speaking", mic: "Microphone access needed", off: "Voice isn't configured on this preview yet", lost: "Connection lost — tap to retry" };

  const stop = useCallback(async () => { try { await session.current?.endSession(); } catch { /* ignore */ } session.current = null; setState("idle"); setDetail(""); }, []);
  useEffect(() => () => { void stop(); }, [stop]);

  const start = async () => {
    if (session.current) return stop();
    setState("connecting"); setDetail(T.connecting);
    try {
      const r = await fetch("/api/voice/session", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ locale, page: pathname }) });
      if (r.status === 503) { setState("off"); setDetail(T.off); return; }
      if (!r.ok) throw new Error("session");
      const { signedUrl, agentId, dynamicVariables } = (await r.json()) as { signedUrl?: string; agentId?: string; dynamicVariables: Record<string, string | number | boolean> };
      try { await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { setState("error"); setDetail(T.mic); return; }
      const { Conversation } = await import("@elevenlabs/client");
      const clientTools = {
        navigate: async ({ path, page, section }: { path?: string; page?: string; section?: string }) => {
          const target = path ?? (page ? `/${page === "home" ? "" : page}` : "/");
          const rel = target.replace(new RegExp(`^/(en|ar)(?=/|$)`), "") || "/";
          router.push(section ? `${rel}#${section}` : rel);
          return `Navigated to ${rel}${section ? "#" + section : ""}`;
        },
        open_booking: async () => { router.push("/booking"); return "Booking page opened; the guest's held seats are in the cart."; },
        switch_language: async ({ locale: to }: { locale: "en" | "ar" }) => { router.replace(pathname, { locale: to }); return `Language switched to ${to}`; },
      };
      const conv = await Conversation.startSession({
        ...(signedUrl ? { signedUrl } : { agentId: agentId! }),
        connectionType: "websocket",
        dynamicVariables,
        clientTools,
        onConnect: () => { setState("listening"); setDetail(T.listening); },
        onDisconnect: (d: { reason?: string }) => { session.current = null; if (d?.reason === "error") { setState("error"); setDetail(T.lost); } else { setState("idle"); setDetail(""); } },
        onModeChange: ({ mode }: { mode: string }) => { setState(mode === "speaking" ? "speaking" : "listening"); setDetail(mode === "speaking" ? T.speaking : T.listening); },
        onMessage: ({ source }: { source: string }) => { if (source === "user") { setState("thinking"); setDetail(T.thinking); } },
        onError: (m: unknown) => console.error("[NOA voice]", m),
      } as Parameters<typeof Conversation.startSession>[0]);
      session.current = conv as unknown as Session;
    } catch (e) { console.error(e); setState("error"); setDetail(T.lost); }
  };

  const active = state !== "idle" && state !== "off" && state !== "error";
  return (
    <button type="button" className={`vc-fab ${state}`} onClick={() => void start()} aria-label={active ? T.stop : T.talk} title={detail || T.talk}>
      <span className="vc-ring" />
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
      {detail && <span className="vc-detail">{detail}</span>}
    </button>
  );
}
