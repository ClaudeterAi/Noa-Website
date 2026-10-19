"use client";

import { useEffect, useRef } from "react";

/**
 * Background film that Safari will actually autoplay. React does not emit the `muted` attribute into server HTML, and
 * Safari only grants autoplay to media that was muted at parse time — so we set the attribute via a callback ref, call
 * play() ourselves (and once more after the page becomes visible or the first touch), and hide the native play glyph
 * if Safari still refuses (Low Power Mode) by showing the poster instead.
 */
export default function HeroVideo({ className, poster, sources }: { className: string; poster?: string; sources: { src: string; type: string }[] }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true; v.defaultMuted = true; v.setAttribute("muted", "");
    let stopped = false;
    const tryPlay = () => { if (stopped) return; const p = v.play(); if (p) p.then(() => { v.classList.remove("hero-video-blocked"); v.classList.add("hero-video-playing"); }).catch(() => v.classList.add("hero-video-blocked")); };
    const show = () => { v.classList.remove("hero-video-blocked"); v.classList.add("hero-video-playing"); };
    v.addEventListener("playing", show); v.addEventListener("timeupdate", show, { once: true });
    const check = window.setInterval(() => { if (!v.paused && v.currentTime > 0) { show(); window.clearInterval(check); } }, 250);
    window.setTimeout(() => window.clearInterval(check), 15000);
    tryPlay();
    const onVis = () => { if (document.visibilityState === "visible") tryPlay(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("touchstart", tryPlay, { once: true, passive: true });
    window.addEventListener("pointerdown", tryPlay, { once: true, passive: true });
    return () => { stopped = true; document.removeEventListener("visibilitychange", onVis); window.removeEventListener("touchstart", tryPlay); window.removeEventListener("pointerdown", tryPlay); };
  }, []);
  return (
    <video ref={ref} className={className} autoPlay muted loop playsInline preload="metadata" poster={poster} aria-hidden="true" disablePictureInPicture disableRemotePlayback>
      {sources.map((s) => <source key={s.src} src={s.src} type={s.type} />)}
    </video>
  );
}
