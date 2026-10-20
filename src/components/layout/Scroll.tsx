"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll choreography. Smooth scroll (Lenis) drives GSAP ScrollTrigger; scrubbed scenes reverse when scrolling back.
 * The hero is never touched. Pins are desktop only; reduced motion disables everything.
 */
// palette tokens stay as designed; no scroll-driven colour change

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
    const main = document.querySelector<HTMLElement>("main");
    if (!main) return;

    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add("scrub");

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const desktop = window.innerWidth > 1024;
      const q = (s: string) => Array.from(main.querySelectorAll<HTMLElement>(s));
      const mark = (els: HTMLElement[]) => els.forEach((e) => { e.dataset.scrub = "1"; });

      /* ---------- hero: left exactly as it is; the film plays, nothing moves it ---------- */
      const hero = main.querySelector<HTMLElement>(".hero");
      if (hero) mark([hero]);

      /* ---------- intro: copy drifts up, the two aerials move at different depths ---------- */
      const intro = main.querySelector<HTMLElement>(".ed-intro");
      if (intro) {
        mark([intro]);
        gsap.fromTo(intro.querySelector(".ed-intro-copy"), { yPercent: 10, y: 0, opacity: 0 }, { yPercent: 0, y: 0, opacity: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: intro, start: "top 85%", toggleActions: "play none none reverse", fastScrollEnd: true } });
      }

      /* ---------- packages: a pinned stack, each slides up over the last; the Night brings the night ---------- */
      const pkgs = q(".ed-pkg");
      if (pkgs.length >= 2) {
        mark(pkgs);
        let wrap = pkgs[0].parentElement as HTMLElement;
        if (!wrap.classList.contains("ed-stack")) {
          wrap = document.createElement("div"); wrap.className = "ed-stack";
          pkgs[0].parentNode?.insertBefore(wrap, pkgs[0]); pkgs.forEach((p) => wrap.appendChild(p));
        }
        if (desktop) {
          wrap.classList.add("pinned");
          pkgs.forEach((p, i) => { p.classList.add("stacked"); gsap.set(p, { yPercent: i === 0 ? 0 : 100, y: 0, zIndex: i + 1 }); gsap.set(p.querySelectorAll(".ed-pkg-copy, .ed-pkg-media"), { y: 0, opacity: 1 }); });
          const tl = gsap.timeline({ scrollTrigger: { trigger: wrap, start: "top top", end: `+=${(pkgs.length - 1) * 100}%`, scrub: true, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
          pkgs.forEach((p, i) => {
            if (i === 0) return;
            tl.to(p, { yPercent: 0, ease: "power2.inOut", duration: 1 }, i - 1);
            const prevMedia = pkgs[i - 1].querySelector(".ed-pkg-media"), prevCopy = pkgs[i - 1].querySelector(".ed-pkg-copy");
            if (prevMedia) tl.to(prevMedia, { opacity: 0.35, scale: 0.96, ease: "power2.inOut", duration: 1 }, i - 1);
            if (prevCopy) tl.to(prevCopy, { opacity: 0.15, yPercent: -6, ease: "power2.inOut", duration: 1 }, i - 1);
          });
        } else {
          pkgs.forEach((p) => { const m = p.querySelector(".ed-pkg-media"); if (m) gsap.fromTo(m, { yPercent: 8 }, { yPercent: -8, ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true } }); });
        }
      }

      /* ---------- portrait: image at depth, copy rises ---------- */
      q(".ed-portrait").forEach((sec) => {
        mark([sec]);
        const copy = sec.querySelector(".ed-portrait-copy");
        if (copy) gsap.fromTo(copy, { yPercent: 12, y: 0, opacity: 0 }, { yPercent: 0, y: 0, opacity: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: sec, start: "top 80%", toggleActions: "play none none reverse", fastScrollEnd: true } });
      });

      /* ---------- posters: rise and straighten one after another ---------- */
      q(".ed-posters").forEach((sec) => {
        mark([sec]);
        sec.querySelectorAll<HTMLElement>(".ed-poster").forEach((p, i) => gsap.fromTo(p, { yPercent: 18, rotation: i % 2 ? 2 : -2, opacity: 0 }, { yPercent: 0, rotation: 0, opacity: 1, duration: 1, delay: i * 0.08, ease: "power3.out", scrollTrigger: { trigger: sec, start: "top 85%", toggleActions: "play none none reverse", fastScrollEnd: true } }));
      });

      /* ---------- programme (events page): cards rise in a wave ---------- */
      q(".ed-night").forEach((card, i) => gsap.fromTo(card, { yPercent: 14, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, delay: (i % 3) * 0.08, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 95%", toggleActions: "play none none reverse", fastScrollEnd: true } }));

      /* ---------- inner page heroes: the photograph settles, the heading writes in ---------- */
      q(".subhero").forEach((sh) => {
        mark([sh]);
        const h = sh.querySelector<HTMLElement>("h1");
        if (h) { const cs = chars(h); gsap.from(cs, { yPercent: 110, opacity: 0, stagger: 0.015, duration: 0.9, ease: "power3.out", delay: 0.15, clearProps: "transform,opacity" }); }
      });

      /* ---------- split sections: images at depth, headings write in ---------- */
      q("h2").forEach((h) => { if (h.closest("[data-scrub]")) return; mark([h]); const cs = chars(h); gsap.fromTo(cs, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.012, duration: 0.8, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: h, start: "top 92%", toggleActions: "play none none none", fastScrollEnd: true } }); });

      /* ---------- ticker: moves on its own, faster and in the direction of your scroll ---------- */
      const firstPosters = main.querySelector<HTMLElement>(".ed-posters");
      if (firstPosters && !main.querySelector(".ed-ticker")) {
        const ar = document.documentElement.lang === "ar";
        const items = ar ? ["المقيمون الخميس والجمعة", "الدي جيه الضيوف السبت", "بار السوشي من 7 مساءً", "آخر قارب 2:30 فجراً", "رصيف مرسى دبي، المرسى 7"] : ["Residents Thursday and Friday", "Guest DJs Saturday", "Sushi bar from 7 PM", "Last boat 2:30 AM", "Dubai Marina Pier, Berth 7"];
        const wrapT = document.createElement("div"); wrapT.className = "ed-ticker"; wrapT.setAttribute("aria-hidden", "true");
        const track = document.createElement("div"); track.className = "ed-ticker-track";
        track.innerHTML = [...items, ...items].map((t) => `<span class="ed-ticker-item">${t}<i></i></span>`).join("");
        wrapT.appendChild(track); firstPosters.parentNode?.insertBefore(wrapT, firstPosters);
      }
      const ticker = main.querySelector<HTMLElement>(".ed-ticker-track");
      if (ticker) {
        mark([ticker.parentElement as HTMLElement]);
        let x = 0, dir = 1, half = ticker.scrollWidth / 2;
        const measure = () => { half = ticker.scrollWidth / 2; }; window.addEventListener("resize", measure);
        gsap.ticker.add(() => { const v = lenis.velocity; dir = v < -0.1 ? -1 : v > 0.1 ? 1 : dir; x -= (0.6 + Math.min(Math.abs(v), 40) * 0.12) * dir; if (x <= -half) x += half; if (x > 0) x -= half; ticker.style.transform = `translate3d(${x}px,0,0)`; });
      }

      /* ---------- footer: lifts into place like a curtain ---------- */
      const footer = document.querySelector<HTMLElement>("footer");
      if (footer && desktop && footer.firstElementChild) gsap.fromTo(footer.firstElementChild, { yPercent: 18, opacity: 0.4 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: footer, start: "top bottom", end: "top 55%", scrub: true } });

      /* page load: header settles */
      const nav = document.querySelector("#nav"); if (nav) gsap.fromTo(nav, { yPercent: -30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.2, clearProps: "transform,opacity" });
    }, main);

    requestAnimationFrame(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => { window.removeEventListener("load", onLoad); ctx.revert(); mm.revert(); gsap.ticker.remove(tick); lenis.destroy(); document.documentElement.classList.remove("scrub"); };
  }, [pathname]);
  return null;
}
