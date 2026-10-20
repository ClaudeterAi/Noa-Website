"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Entrance motion. Native scrolling, no pins, no per-frame work: each scene plays once as it enters and then leaves
 * nothing behind (transforms are cleared). Disabled for reduced motion, in the booking app, in the admin, and with
 * ?motion=off for debugging.
 */
function chars(el: HTMLElement) {
  if (el.dataset.chars) return Array.from(el.querySelectorAll<HTMLElement>(".ch"));
  el.dataset.chars = "1";
  const out: HTMLElement[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      for (const word of (node.textContent ?? "").split(/(\s+)/)) {
        if (!word) continue;
        if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(word)); continue; }
        const w = document.createElement("span"); w.className = "chw";
        for (const c of Array.from(word)) { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; w.appendChild(s); out.push(s); }
        frag.appendChild(w);
      }
      node.parentNode?.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName !== "BR") Array.from(node.childNodes).forEach(walk);
  };
  Array.from(el.childNodes).forEach(walk);
  return out;
}

export default function Scroll() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.body.classList.contains("booking-page") || document.body.classList.contains("ad")) return;
    if (new URLSearchParams(window.location.search).get("motion") === "off") return;
    const main = document.querySelector<HTMLElement>("main");
    if (!main) return;
    document.documentElement.classList.add("scrub");

    const ctx = gsap.context(() => {
      const q = (s: string) => Array.from(main.querySelectorAll<HTMLElement>(s));
      const mark = (els: HTMLElement[]) => els.forEach((e) => { e.dataset.scrub = "1"; });
      const once = (trigger: Element) => ({ trigger, start: "top 88%", toggleActions: "play none none none", fastScrollEnd: true, once: true });
      const CLEAR = "transform,opacity";

      /* hero: never touched */
      const hero = main.querySelector<HTMLElement>(".hero"); if (hero) mark([hero]);

      /* headings write in, once, then release their layers */
      q("h1, h2").forEach((h) => {
        if (h.closest(".hero") || h.closest("[data-scrub]")) return;
        mark([h]);
        gsap.fromTo(chars(h), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.012, duration: 0.8, ease: "power3.out", clearProps: CLEAR, scrollTrigger: once(h) });
      });

      /* copy blocks */
      q(".ed-intro-copy, .ed-portrait-copy, .ed-pkg-copy, .ed-sub").forEach((el) => {
        if (el.closest(".hero")) return;
        gsap.fromTo(el, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", clearProps: CLEAR, scrollTrigger: once(el) });
      });

      /* posters, programme cards, tiles: a short wave */
      [".ed-posters .ed-poster", ".ed-night-grid .ed-night", ".ed-tiles .ed-tile"].forEach((sel) => {
        const groups = new Map<Element, HTMLElement[]>();
        q(sel).forEach((el) => { const g = el.parentElement as Element; groups.set(g, [...(groups.get(g) ?? []), el]); });
        groups.forEach((els, g) => gsap.fromTo(els, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: "power3.out", clearProps: CLEAR, scrollTrigger: once(g) }));
      });

      /* footer lifts in once */
      const footer = document.querySelector<HTMLElement>("footer");
      if (footer?.firstElementChild) gsap.fromTo(footer.firstElementChild, { y: 40, opacity: 0.5 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", clearProps: CLEAR, scrollTrigger: { trigger: footer, start: "top 92%", toggleActions: "play none none none", once: true } });

      /* nav settles on load */
      const nav = document.querySelector("#nav"); if (nav) gsap.fromTo(nav, { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.15, clearProps: CLEAR });
    }, main);

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => { window.removeEventListener("load", onLoad); ctx.revert(); document.documentElement.classList.remove("scrub"); };
  }, [pathname]);
  return null;
}
