"use client";

import { useEffect } from "react";

/**
 * Site motion. Runs after mount and after every DOM change, so every page and every new section gets it without wiring:
 *  - headings rise word by word through a mask
 *  - framed photography wipes in from the side it sits on, then drifts gently with the scroll
 *  - copy, cards and rows fade up in a short stagger
 * Skipped for prefers-reduced-motion, inside the booking app and the admin.
 */
const IMG = ".ed-frame,.split-img,.pkg-img,.ed-night-img,.ed-next-img,.rest-img,.ed-map-frame,.subhero-bg,.evt-img,.tile-img,.gal-cell,.ed-tile-img,.ed-portrait,.ed-pkg-img,.ed-poster,.ed-gallery-img,.ed-intro-img";
const UP = "p,li,.ed-sub,.ed-kicker,.ed-fact,.tariff-card,.faq-q,.ed-night,.inc-row,.spec,.contact-cell,.ed-link,.cta-btn,.btn,.pkg-meta,.ed-tile,.ed-month-h,.card,.tile,blockquote";
const WORDS = "h1,h2,h3,.ed-h,.prose-h,.subhero-h,.ed-next-name,.pkg-h,.rest-h";
const SKIP = ".bk-app,.yacht-map,.cc-panel,.ad,header,nav,footer,.booking-page,[data-no-motion],[data-scrub],.hero,.ed-stack,.ed-ticker";

function splitWords(el: HTMLElement) {
  if (el.dataset.words === "1") return;
  el.dataset.words = "1";
  let i = 0;
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        const outer = document.createElement("span"); outer.className = "mw";
        const inner = document.createElement("span"); inner.className = "mwi"; inner.style.setProperty("--i", String(i++)); inner.textContent = part;
        outer.appendChild(inner); frag.appendChild(outer);
      });
      node.parentNode?.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName !== "BR") {
      Array.from(node.childNodes).forEach(walk);
    }
  };
  Array.from(el.childNodes).forEach(walk);
}

export default function Motion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { document.documentElement.classList.add("no-motion"); return; }
    if (document.body.classList.contains("booking-page") || document.body.classList.contains("ad")) return;
    document.documentElement.classList.add("motion");

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    const tag = () => {
      const main = document.querySelector("main");
      if (!main) return;
      const vw = window.innerWidth;
      main.querySelectorAll<HTMLElement>(IMG).forEach((el) => {
        if (el.dataset.m || el.closest(SKIP)) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        el.dataset.m = "img";
        el.dataset.dir = r.width > vw * 0.8 ? "up" : cx < vw * 0.45 ? "left" : cx > vw * 0.55 ? "right" : "up";
        io.observe(el);
      });
      main.querySelectorAll<HTMLElement>(WORDS).forEach((el) => {
        if (el.dataset.m || el.closest(SKIP) || el.closest("[data-m='img']")) return;
        splitWords(el); el.dataset.m = "words"; io.observe(el);
      });
      main.querySelectorAll<HTMLElement>(UP).forEach((el) => {
        if (el.dataset.m || el.closest(SKIP) || el.closest("[data-m]")) return;
        const parent = el.parentElement;
        const sib = parent ? Array.from(parent.children).filter((c) => (c as HTMLElement).dataset.m === "up" || c === el) : [el];
        el.style.setProperty("--i", String(Math.min(sib.indexOf(el), 8)));
        el.dataset.m = "up"; io.observe(el);
      });
    };
    window.setTimeout(tag, 120);
    const mo = new MutationObserver(() => { clearTimeout(t); t = window.setTimeout(tag, 60); });
    let t = 0;
    mo.observe(document.body, { childList: true, subtree: true });

    // anything already scrolled past (anchor jumps, fast flicks) shows without waiting for an intersection
    let raf = 0;
    const settle = () => { raf = 0; document.querySelectorAll<HTMLElement>("[data-m]:not(.in)").forEach((el) => { if (el.getBoundingClientRect().bottom < 0) el.classList.add("in"); }); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(settle); };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => { io.disconnect(); mo.disconnect(); window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return null;
}
