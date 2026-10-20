"use client";

import { useEffect, useRef } from "react";

/**
 * Background film written into the server HTML as a raw <video> tag, so `autoplay muted playsinline` are present when
 * Safari first sees the file (React alone only sets `muted` from JavaScript, after hydration, which is too late for
 * Safari's autoplay decision). The script then only confirms playback, retries on any gesture, and shows a play
 * control if the browser still refuses. The photograph behind stays visible until the film is actually running.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export default function HeroVideo({ className, sources }: { className: string; sources: { src: string; type: string }[] }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const html = `<video class="hero-video" autoplay muted loop playsinline webkit-playsinline x5-playsinline preload="auto" disablepictureinpicture disableremoteplayback aria-hidden="true">${sources.map((s) => `<source src="${esc(s.src)}" type="${esc(s.type)}">`).join("")}</video>`;

  useEffect(() => {
    const v = wrap.current?.querySelector("video");
    if (!v) return;
    v.muted = true; v.defaultMuted = true;
    let stopped = false;
    const show = () => { v.classList.add("hero-video-playing"); };
    const tryPlay = () => { if (stopped || !v.paused) return; const p = v.play(); if (p) p.then(show).catch(() => undefined); };
    v.addEventListener("playing", show); v.addEventListener("timeupdate", show, { once: true });
    tryPlay();
    const onVis = () => { if (document.visibilityState === "visible") tryPlay(); };
    document.addEventListener("visibilitychange", onVis);
    const gestures: (keyof WindowEventMap)[] = ["touchstart", "pointerdown", "keydown", "wheel", "touchend", "click"];
    gestures.forEach((g) => window.addEventListener(g, tryPlay, { passive: true }));
    const check = window.setInterval(() => { if (!v.paused && v.currentTime > 0) { show(); window.clearInterval(check); } }, 250);
    window.setTimeout(() => window.clearInterval(check), 15000);
    return () => { stopped = true; window.clearInterval(check); document.removeEventListener("visibilitychange", onVis); gestures.forEach((g) => window.removeEventListener(g, tryPlay)); };
  }, []);

  return <div ref={wrap} className={className} dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />;
}
