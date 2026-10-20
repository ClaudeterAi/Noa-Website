"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Port of the Aceternity moving border button in NOA colours: a sea green glow travels the edge of a sea blue glass pill.
 * Pure rAF + SVG getPointAtLength, no animation library. Wraps every primary button on the content pages.
 * The loop only runs while the button is on screen, the tab is visible and it is not paused; the outline length is
 * measured once and again only when the button changes size. Hidden under prefers-reduced-motion.
 */
export default function MovingBorder({ children, duration = 2000, className = "", paused = false }: { children: ReactNode; duration?: number; className?: string; paused?: boolean }) {
  const wrap = useRef<HTMLSpanElement>(null);
  const path = useRef<SVGRectElement>(null);
  const dot = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const w = wrap.current, p = path.current, d = dot.current;
    if (!w || !p || !d || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, len = 0, onScreen = false, tabVisible = !document.hidden;
    const measure = () => { len = p.getTotalLength(); };
    const tick = (t: number) => {
      raf = 0;
      if (len > 0) {
        const pt = p.getPointAtLength((t * (len / duration)) % len);
        d.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%)`;
      }
      sync();
    };
    const sync = () => {
      const run = onScreen && tabVisible && !paused;
      if (run && !raf) raf = requestAnimationFrame(tick);
      if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    const ro = new ResizeObserver(measure);
    const onVis = () => { tabVisible = !document.hidden; sync(); };
    measure();
    io.observe(w); ro.observe(w);
    document.addEventListener("visibilitychange", onVis);
    return () => { if (raf) cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [duration, paused]);

  return (
    <span className={`mb${paused ? " mb-paused" : ""} ${className}`.trim()} ref={wrap}>
      <svg className="mb-path" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
        <rect ref={path} fill="none" width="100%" height="100%" rx="30%" ry="30%" />
      </svg>
      <span className="mb-dot" ref={dot} aria-hidden="true" />
      {children}
    </span>
  );
}
