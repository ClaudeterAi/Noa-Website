"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

/**
 * "Choose your seat" carousel. Port of the 21st.dev Infinite Perspective Slider in NOA colours:
 * an endless strip of photo cards that tilts in 3D with the speed of the drag, details rising line by line on hover.
 *
 * Differences from the original, on purpose:
 * - Input is scoped to the carousel: drag, sideways trackpad swipe, arrow keys. Vertical page scroll is never captured.
 * - Seat name and price are always visible; description and capacity reveal on hover. Touch screens show everything.
 * - The frame loop pauses when off screen, when the tab is hidden, and when the strip comes to rest (Safari).
 * - Without JavaScript the cards are a plain scrollable row, so prices are always reachable.
 * - Arabic runs right to left.
 */

export interface SeatCard { name: string; price: string; desc: string; cap: string; src: string; alt: string }

interface Props { cards: SeatCard[]; rtl?: boolean; hint: string; label: string }

const lerp = (a: number, b: number, n: number) => a + (b - a) * n;
const SCROLL_LERP = 0.1, ROT_DAMP = 0.1, ROT_LERP = 0.12, ROT_SENS = 0.025, MAX_ROT = 80;

function sizes(vw: number) {
  if (vw < 640) return { w: 240, gap: 16 };
  if (vw < 1025) return { w: 380, gap: 20 };
  return { w: 320, gap: 24 };
}

export default function PerspectiveSlider({ cards, rtl = false, hint, label }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [vw, setVw] = useState(1440);
  const [reps, setReps] = useState(1);

  const { w, gap } = sizes(vw);
  const step = w + gap;
  const items = Array.from({ length: reps }, (_, r) => cards.map((c, i) => ({ c, i, r }))).flat();

  // Viewport size → card size and how many copies keep the loop seamless on wide screens.
  useEffect(() => {
    const measure = () => {
      const width = root.current?.clientWidth ?? window.innerWidth;
      const s = sizes(window.innerWidth);
      setVw(window.innerWidth);
      setReps(Math.max(1, Math.ceil((width + 2 * (s.w + s.gap)) / (cards.length * (s.w + s.gap)))));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [cards.length]);

  // Motion: positions, tilt, input, frame loop.
  useEffect(() => {
    const el = root.current, st = strip.current;
    if (!el || !st || !cards.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dir = rtl ? -1 : 1;
    const nodes = Array.from(st.children) as HTMLElement[];
    const setX = nodes.map((n) => gsap.quickSetter(n, "x", "px"));
    const setR = nodes.map((n) => gsap.quickSetter(n, "rotateY", "deg"));
    const loop = nodes.length * step;
    // axis: 0 = undecided, 1 = horizontal (carousel drags), -1 = vertical (page scroll, carousel ignores it)
    const s = { cur: 0, target: 0, rotVel: 0, rot: 0, drag: false, lastX: 0, startX: 0, startY: 0, axis: 0, pid: -1 };
    let raf = 0, visible = true, tabVisible = !document.hidden;

    const place = () => {
      const centre = el.clientWidth / 2 - w / 2;
      for (let i = 0; i < nodes.length; i++) {
        // wrap symmetrically around the centre so cards fill both edges (the loop is always wider than the screen + 2 cards)
        let p = i * step - s.cur + loop / 2;
        p = (((p % loop) + loop) % loop) - loop / 2;
        setX[i](centre + dir * p);
        setR[i](reduced ? 0 : Math.max(-MAX_ROT, Math.min(MAX_ROT, s.rot)) * dir);
      }
    };
    const frame = () => {
      raf = 0;
      if (reduced) { s.cur = s.target; s.rot = 0; }
      else {
        s.cur = lerp(s.cur, s.target, SCROLL_LERP);
        const vel = s.target - s.cur;
        s.rotVel = lerp(s.rotVel, vel, ROT_DAMP);
        s.rot = lerp(s.rot, s.rotVel * ROT_SENS, ROT_LERP);
      }
      if (Math.abs(s.cur - s.target) < 0.05) { const shift = Math.round(s.cur / loop) * loop; s.cur -= shift; s.target -= shift; }
      place();
      const resting = Math.abs(s.cur - s.target) < 0.05 && Math.abs(s.rot) < 0.01 && !s.drag;
      if (!resting) kick();
    };
    const kick = () => { if (!raf && visible && tabVisible) raf = requestAnimationFrame(frame); };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical: let the page scroll
      e.preventDefault();
      s.target += e.deltaX * dir;
      kick();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      s.drag = true; s.lastX = s.startX = e.clientX; s.startY = e.clientY; s.pid = e.pointerId;
      s.axis = e.pointerType === "mouse" ? 1 : 0; // a mouse drag is always sideways; touch decides after 6px
      if (s.axis === 1) { el.setPointerCapture?.(e.pointerId); el.classList.add("is-dragging"); }
    };
    const onMove = (e: PointerEvent) => {
      if (!s.drag || e.pointerId !== s.pid) return;
      if (s.axis === 0) {
        const dx = Math.abs(e.clientX - s.startX), dy = Math.abs(e.clientY - s.startY);
        if (dx < 6 && dy < 6) return;
        s.axis = dx > dy ? 1 : -1;
        if (s.axis === 1) { el.setPointerCapture?.(e.pointerId); el.classList.add("is-dragging"); s.lastX = e.clientX; }
      }
      if (s.axis !== 1) return;
      const d = e.clientX - s.lastX; s.lastX = e.clientX;
      s.target -= d * dir;
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== s.pid) return;
      s.drag = false; s.pid = -1; s.axis = 0;
      el.classList.remove("is-dragging");
      kick();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const forward = (e.key === "ArrowRight") !== rtl;
      s.target += (forward ? 1 : -1) * step;
      kick();
    };
    const onVis = () => { tabVisible = !document.hidden; kick(); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick(); }, { rootMargin: "200px" });

    place();
    setLive(true);
    io.observe(el);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    const onResize = () => { place(); };
    window.addEventListener("resize", onResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
    };
  }, [cards.length, reps, step, w, rtl]);

  // Hover reveal of description and capacity, line by line. Skipped on touch screens and under reduced motion.
  useEffect(() => {
    const st = strip.current;
    if (!st) return;
    if (!window.matchMedia("(hover: hover)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const cleanups: (() => void)[] = [];
    document.fonts.ready.then(() => {
      if (cancelled) return;
      st.querySelectorAll<HTMLElement>(".ps-card").forEach((card) => {
        const detail = card.querySelector<HTMLElement>(".ps-detail");
        const frame = card.querySelector<HTMLElement>(".ps-frame");
        if (!detail || !frame) return;
        const split = SplitText.create(detail.querySelectorAll(".ps-desc, .ps-cap"), { type: "lines", mask: "lines", aria: "none" } /* keep the real text readable to screen readers */);
        gsap.set(split.lines, { yPercent: 100 });
        gsap.set(detail, { opacity: 0 });
        const enter = () => {
          gsap.killTweensOf([split.lines, detail]);
          gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" } }).set(detail, { opacity: 1 }).to(split.lines, { yPercent: 0, duration: 0.35, stagger: 0.06 });
        };
        const leave = () => {
          gsap.killTweensOf([split.lines, detail]);
          gsap.timeline({ defaults: { ease: "power3.in", overwrite: "auto" } }).to(split.lines, { yPercent: 100, duration: 0.35, stagger: 0.04 }).set(detail, { opacity: 0 });
        };
        frame.addEventListener("mouseenter", enter);
        frame.addEventListener("mouseleave", leave);
        cleanups.push(() => { frame.removeEventListener("mouseenter", enter); frame.removeEventListener("mouseleave", leave); split.revert(); gsap.set(detail, { clearProps: "all" }); });
      });
    });
    return () => { cancelled = true; cleanups.forEach((f) => f()); };
  }, [reps, w, cards.length]);

  return (
    <div className={`ps${live ? " is-live" : ""}`} ref={root} tabIndex={0} role="region" aria-roledescription="carousel" aria-label={label} style={{ ["--ps-w" as string]: `${w}px`, ["--ps-gap" as string]: `${gap}px` }}>
      <div className="ps-strip" ref={strip}>
        {items.map(({ c, i, r }) => (
          <article className="ps-card" key={`${r}-${i}`} aria-hidden={r > 0 ? true : undefined}>
            <div className="ps-num">{String(i + 1).padStart(2, "0")}</div>
            <div className="ps-frame"><img src={c.src} alt={r > 0 ? "" : c.alt} draggable={false} loading="lazy" decoding="async" /></div>
            <div className="ps-head"><span className="ps-name">{c.name}</span><span className="ps-price"><small>AED</small>{c.price}</span></div>
            <div className="ps-detail"><div className="ps-desc">{c.desc}</div><div className="ps-cap">{c.cap}</div></div>
          </article>
        ))}
      </div>
      <div className="ps-hint" aria-hidden="true">
        <svg width="22" height="12" viewBox="0 0 22 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 1 1 6l5 5M16 1l5 5-5 5M1 6h20" /></svg>
        <span>{hint}</span>
      </div>
    </div>
  );
}
