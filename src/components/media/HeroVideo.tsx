"use client";

import { useEffect, useRef } from "react";

/**
 * Background film written into the server HTML as a raw <video> tag, so `autoplay muted playsinline` are present when
 * Safari first sees the file (React alone only sets `muted` from JavaScript, after hydration, which is too late for
 * Safari's autoplay decision). The script then only confirms playback, retries on any gesture, and shows a play
 * control if the browser still refuses. The photograph behind stays visible until the film is actually running.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export default function HeroVideo({ className, poster, sources }: { className: string; poster?: string; sources: { src: string; type: string }[] }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const html = `<video class="hero-video" autoplay muted loop playsinline webkit-playsinline preload="auto" disablepictureinpicture disableremoteplayback aria-hidden="true"${poster ? ` poster="${esc(poster)}"` : ""}>${sources.map((s) => `<source src="${esc(s.src)}" type="${esc(s.type)}">`).join("")}</video>`;

  useEffect(() => {
    const v = wrap.current?.querySelector("video");
    if (!v) return;
    v.muted = true; v.defaultMuted = true;
    let stopped = false;
    const hero = v.closest(".hero");
    const show = () => { v.classList.add("hero-video-playing"); hero?.classList.remove("film-blocked"); };
    const tryPlay = () => { if (stopped || !v.paused) return; const p = v.play(); if (p) p.then(show).catch(() => undefined); };
    v.addEventListener("playing", show); v.addEventListener("timeupdate", show, { once: true });
    tryPlay();
    const onVis = () => { if (document.visibilityState === "visible") tryPlay(); };
    document.addEventListener("visibilitychange", onVis);
    const gestures: (keyof WindowEventMap)[] = ["touchstart", "pointerdown", "keydown", "wheel", "touchend", "click"];
    gestures.forEach((g) => window.addEventListener(g, tryPlay, { passive: true }));
    let btn: HTMLButtonElement | null = null;
    if (hero && !hero.querySelector(".hero-play")) {
      btn = document.createElement("button"); btn.type = "button"; btn.className = "hero-play"; btn.setAttribute("aria-label", "Play film");
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
      btn.addEventListener("click", (e) => { e.stopPropagation(); v.muted = true; v.play().then(show).catch(() => undefined); });
      hero.appendChild(btn);
    }
    const check = window.setInterval(() => { if (!v.paused && v.currentTime > 0) { show(); window.clearInterval(check); } }, 250);
    const watch = window.setTimeout(() => { if (v.paused) hero?.classList.add("film-blocked"); }, 2500);
    window.setTimeout(() => window.clearInterval(check), 15000);
    return () => { stopped = true; window.clearTimeout(watch); window.clearInterval(check); document.removeEventListener("visibilitychange", onVis); gestures.forEach((g) => window.removeEventListener(g, tryPlay)); btn?.remove(); };
  }, []);

  return <div ref={wrap} className={className} dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />;
}
