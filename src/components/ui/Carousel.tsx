"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Editorial carousel (design pass 2). Native scroll-snap does the work; arrows and dots are sugar.
 * `perView` slides visible on desktop; phones always show one with a peek of the next.
 */
export default function Carousel({ children, perView = 1, arrows = "outside", dots = true, className = "", ariaLabel }: {
  children: ReactNode[]; perView?: 1 | 2 | 3; arrows?: "outside" | "inside" | "none"; dots?: boolean; className?: string; ariaLabel?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const n = children.length;

  const slideWidth = () => { const el = track.current; if (!el || !el.firstElementChild) return 0; const first = el.firstElementChild as HTMLElement; const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0; return first.getBoundingClientRect().width + gap; };
  const go = useCallback((to: number) => { const el = track.current; if (!el) return; const w = slideWidth(); const t = Math.max(0, Math.min(n - 1, to)); el.scrollTo({ left: t * w * (document.dir === "rtl" ? -1 : 1), behavior: "smooth" }); }, [n]);

  useEffect(() => {
    const el = track.current; if (!el) return;
    const onScroll = () => { const w = slideWidth(); if (!w) return; setIdx(Math.round(Math.abs(el.scrollLeft) / w)); };
    el.addEventListener("scroll", onScroll, { passive: true }); return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const atStart = idx <= 0, atEnd = idx >= n - perView;
  return (
    <div className={`car car-${arrows} car-pv${perView} ${className}`} aria-roledescription="carousel" aria-label={ariaLabel}>
      {arrows !== "none" && n > perView && (
        <button type="button" className="car-arrow car-prev" aria-label="Previous" disabled={atStart} onClick={() => go(idx - 1)}>
          <svg viewBox="0 0 40 12" width="40" height="12" aria-hidden="true"><path d="M39 6H2M7 1 2 6l5 5" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}
      <div className="car-track" ref={track}>
        {children.map((c, i) => <div className="car-slide" key={i} aria-hidden={i < idx || i >= idx + perView ? true : undefined}>{c}</div>)}
      </div>
      {arrows !== "none" && n > perView && (
        <button type="button" className="car-arrow car-next" aria-label="Next" disabled={atEnd} onClick={() => go(idx + 1)}>
          <svg viewBox="0 0 40 12" width="40" height="12" aria-hidden="true"><path d="M1 6h37m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}
      {dots && n > 1 && (
        <div className="car-dots" role="tablist">
          {children.map((_, i) => <button type="button" key={i} role="tab" aria-selected={i === idx} aria-label={`Slide ${i + 1}`} className={`car-dot${i === idx ? " on" : ""}`} onClick={() => go(i)} />)}
        </div>
      )}
    </div>
  );
}
