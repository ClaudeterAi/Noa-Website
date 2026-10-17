"use client";

import { useEffect } from "react";

/**
 * Port of legacy-static/script.js: custom cursor (hidden on touch), hover highlight,
 * reveal-on-scroll for `.rv`, and in-page smooth anchors. Event delegation so new
 * sections need no wiring.
 */
const HL_SELECTOR =
  "a,button,.s-arrow,.evt,.split-cell,.pkg,.rest-img,.faq-q,.gal-cell,.event-row,.tariff-card";

export default function Effects() {
  useEffect(() => {
    const isTouch = window.matchMedia("(hover:none)").matches;
    const cleanups: (() => void)[] = [];

    if (!isTouch) {
      const c = document.getElementById("cur");
      const r = document.getElementById("cur2");
      if (c && r) {
        let mx = 0, my = 0, rx = 0, ry = 0, raf = 0;
        const onMove = (e: MouseEvent) => {
          mx = e.clientX; my = e.clientY;
          c.style.left = `${mx}px`; c.style.top = `${my}px`;
        };
        const loop = () => {
          rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
          r.style.left = `${rx}px`; r.style.top = `${ry}px`;
          raf = requestAnimationFrame(loop);
        };
        document.addEventListener("mousemove", onMove);
        raf = requestAnimationFrame(loop);
        const over = (e: Event) => { if ((e.target as Element).closest?.(HL_SELECTOR)) document.body.classList.add("hl"); };
        const out = (e: Event) => { if ((e.target as Element).closest?.(HL_SELECTOR)) document.body.classList.remove("hl"); };
        document.addEventListener("mouseover", over);
        document.addEventListener("mouseout", out);
        cleanups.push(() => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseover", over);
          document.removeEventListener("mouseout", out);
          cancelAnimationFrame(raf);
        });
      }
    }

    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("on"); }),
      { threshold: 0.06, rootMargin: "0px 0px -40px 0px" }
    );
    const observeAll = () => document.querySelectorAll(".rv:not(.on)").forEach((el) => obs.observe(el));
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => { obs.disconnect(); mo.disconnect(); });

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const hash = a.getAttribute("href")?.split("#")[1];
      if (!hash) return;
      const samePage = a.pathname === window.location.pathname;
      const t = samePage ? document.getElementById(hash) : null;
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth" }); }
    };
    document.addEventListener("click", onClick);
    cleanups.push(() => document.removeEventListener("click", onClick));

    return () => cleanups.forEach((f) => f());
  }, []);

  return (
    <>
      <div id="cur" />
      <div id="cur2" />
    </>
  );
}
