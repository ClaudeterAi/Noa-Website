"use client";

import { useEffect, useRef, useState } from "react";

export type SeatPush = { type: "availability"; date: string; slot: string; serverTime: string; changes: { unitId: string; state: "free" | "held" | "booked" | "reserved" | "closed"; heldUntil?: string }[] };

/**
 * Live seat updates over the API Gateway WebSocket. Reconnects with backoff; reports whether it is
 * connected so the caller can slow its polling to a safety net (30 s) instead of 4 s.
 * No-op when NEXT_PUBLIC_WS_URL is unset — the map simply keeps polling.
 */
export function useLiveSeats(date: string | null, slot: string | null, onPush: (p: SeatPush) => void, onReconnect: () => void) {
  const [connected, setConnected] = useState(false);
  const cb = useRef(onPush); cb.current = onPush;
  const rc = useRef(onReconnect); rc.current = onReconnect;

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_WS_URL;
    if (!base || !date || !slot || typeof WebSocket === "undefined") return;
    let ws: WebSocket | null = null, closed = false, attempt = 0, timer: ReturnType<typeof setTimeout> | undefined, hadConnection = false;
    const open = () => {
      if (closed) return;
      ws = new WebSocket(`${base}?date=${encodeURIComponent(date)}&slot=${encodeURIComponent(slot)}`);
      ws.onopen = () => { attempt = 0; setConnected(true); if (hadConnection) rc.current(); hadConnection = true; };
      ws.onmessage = (ev) => { try { const p = JSON.parse(ev.data) as SeatPush; if (p.type === "availability" && p.date === date && p.slot === slot) cb.current(p); } catch { /* ignore */ } };
      ws.onclose = () => { setConnected(false); if (closed) return; timer = setTimeout(open, Math.min(30_000, 1000 * 2 ** attempt++)); };
      ws.onerror = () => ws?.close();
    };
    open();
    const onVis = () => { if (document.visibilityState === "visible" && ws?.readyState !== WebSocket.OPEN) { clearTimeout(timer); attempt = 0; open(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { closed = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVis); ws?.close(); setConnected(false); };
  }, [date, slot]);

  return connected;
}
