"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll choreography. Smooth scroll (Lenis) drives GSAP ScrollTrigger, and every scene is scrubbed to the scroll
 * position, so scrolling back plays it in reverse. The one big idea: the page turns from day to night as the Night
 * package arrives, and stays night until the footer. Pins are desktop only; reduced motion disables everything.
 */
const DAY = { "--bg": "#EDE6DA", "--ink": "#10384A", "--head": "#156A89", "--ed-ink": "#10384A", "--ed-mute": "rgba(21,106,137,.72)", "--ed-hair": "rgba(39,160,161,.26)", "--ed-sand": "#DFCDBE" };
const NIGHT = { "--bg": "#0C2227", "--ink": "#E9E1D2", "--head": "#E6DCC8", "--ed-ink": "#E9E1D2", "--ed-mute": "rgba(233,225,210,.62)", "--ed-hair": "rgba(233,225,210,.18)", "--ed-sand": "#10313A" };

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
      const root = document.documentElement;
      const desktop = window.innerWidth > 1024;
      const q = (s: string) => Array.from(main.querySelectorAll<HTMLElement>(s));
      const mark = (els: HTMLElement[]) => els.forEach((e) => { e.dataset.scrub = "1"; });

      /* ---------- hero: pinned, the film tightens into a framed window while the line writes in ---------- */
      const hero = main.querySelector<HTMLElement>(".hero");
      if (hero) {
        mark([hero]);
        const film = hero.querySelectorAll<HTMLElement>(".hero-bg");
        let line = hero.querySelector<HTMLElement>(".hero-line");
        if (!line) {
          line = document.createElement("div"); line.className = "hero-line";
          line.textContent = document.documentElement.lang === "ar" ? "بعد الظهر هادئ. أما الليل فلا." : "The afternoon is slow. The night is not.";
          hero.appendChild(line);
        }
        const cs = chars(line);
        gsap.set(cs, { yPercent: 110, opacity: 0 });
        if (desktop) {
          const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "+=140%", scrub: true, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
          tl.to(film, { scale: 0.74, borderRadius: 6, ease: "none", duration: 1 }, 0)
            .to(hero.querySelector(".hero-fade"), { opacity: 0, ease: "none", duration: 0.4 }, 0)
            .to(cs, { yPercent: 0, opacity: 1, stagger: 0.012, ease: "power2.out", duration: 0.5 }, 0.35)
            .to(hero.querySelector(".hero-scroll"), { opacity: 0, duration: 0.2 }, 0);
        } else {
          gsap.to(film, { yPercent: 18, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
          gsap.to(cs, { yPercent: 0, opacity: 1, stagger: 0.012, ease: "power2.out", scrollTrigger: { trigger: hero, start: "top top", end: "60% top", scrub: true } });
        }
      }

      /* ---------- intro: copy drifts up, the two aerials move at different depths ---------- */
      const intro = main.querySelector<HTMLElement>(".ed-intro");
      if (intro) {
        mark([intro]);
        gsap.fromTo(intro.querySelector(".ed-intro-copy"), { yPercent: 14, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: intro, start: "top 85%", end: "top 30%", scrub: true } });
        intro.querySelectorAll<HTMLElement>(".ed-frame").forEach((f, i) => gsap.fromTo(f, { yPercent: 10 + i * 8 }, { yPercent: -10 - i * 8, ease: "none", scrollTrigger: { trigger: intro, start: "top bottom", end: "bottom top", scrub: true } }));
      }

      /* ---------- deck tiles: the two columns drift against each other as you pass ---------- */
      const tiles = main.querySelector<HTMLElement>(".ed-tiles");
      if (tiles) {
        mark([tiles]);
        tiles.querySelectorAll<HTMLElement>(".ed-tile").forEach((t, i) => gsap.fromTo(t, { yPercent: i % 2 ? 14 : -4, opacity: 0.35 }, { yPercent: i % 2 ? -10 : 6, opacity: 1, ease: "none", scrollTrigger: { trigger: tiles, start: "top 90%", end: "bottom 30%", scrub: true } }));
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
        const nightIdx = pkgs.findIndex((p) => p.id === "pkg-night");
        if (desktop) {
          wrap.classList.add("pinned");
          pkgs.forEach((p, i) => { p.classList.add("stacked"); gsap.set(p, { yPercent: i === 0 ? 0 : 100, zIndex: i + 1 }); });
          const tl = gsap.timeline({ scrollTrigger: { trigger: wrap, start: "top top", end: `+=${(pkgs.length - 1) * 100}%`, scrub: true, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
          pkgs.forEach((p, i) => {
            if (i === 0) return;
            tl.to(p, { yPercent: 0, ease: "power2.inOut", duration: 1 }, i - 1)
              .to(pkgs[i - 1].querySelector(".ed-pkg-media"), { filter: "brightness(0.35)", scale: 0.96, ease: "power2.inOut", duration: 1 }, i - 1)
              .to(pkgs[i - 1].querySelector(".ed-pkg-copy"), { opacity: 0.15, yPercent: -6, ease: "power2.inOut", duration: 1 }, i - 1);
            if (i === nightIdx) tl.to(root, { ...NIGHT, ease: "none", duration: 1 }, i - 1);
          });
        } else {
          pkgs.forEach((p) => { const m = p.querySelector(".ed-pkg-media"); if (m) gsap.fromTo(m, { yPercent: 8 }, { yPercent: -8, ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true } }); });
          if (nightIdx >= 0) gsap.to(root, { ...NIGHT, ease: "none", scrollTrigger: { trigger: pkgs[nightIdx], start: "top 80%", end: "top 20%", scrub: true } });
        }
      }

      /* ---------- gallery: enters through an arch, the strip slides against the scroll ---------- */
      const gallery = main.querySelector<HTMLElement>(".ed-gallery");
      if (gallery) {
        mark([gallery]);
        gsap.fromTo(gallery, { clipPath: "ellipse(150% 100% at 50% 100%)" }, { clipPath: "ellipse(60% 100% at 50% 100%)", ease: "power2.out", scrollTrigger: { trigger: gallery, start: "top bottom", end: "top 30%", scrub: true } });
        const track = gallery.querySelector<HTMLElement>(".car-track");
        if (track && desktop) gsap.fromTo(track, { xPercent: 4 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: gallery, start: "top bottom", end: "bottom top", scrub: true } });
      }

      /* ---------- portrait: image at depth, copy rises ---------- */
      q(".ed-portrait").forEach((sec) => {
        mark([sec]);
        const media = sec.querySelector(".ed-portrait-media"); const copy = sec.querySelector(".ed-portrait-copy");
        if (media) gsap.fromTo(media, { yPercent: 12 }, { yPercent: -12, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true } });
        if (copy) gsap.fromTo(copy, { yPercent: 18, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: sec, start: "top 80%", end: "top 35%", scrub: true } });
      });

      /* ---------- posters: rise and straighten one after another ---------- */
      q(".ed-posters").forEach((sec) => {
        mark([sec]);
        sec.querySelectorAll<HTMLElement>(".ed-poster").forEach((p, i) => gsap.fromTo(p, { yPercent: 24, rotation: i % 2 ? 2.5 : -2.5, opacity: 0 }, { yPercent: 0, rotation: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: sec, start: "top 90%", end: "top 35%", scrub: true }, delay: 0 }));
      });

      /* ---------- programme (events page): cards rise in a wave ---------- */
      q(".ed-night").forEach((card, i) => gsap.fromTo(card, { yPercent: 18, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: card, start: "top 95%", end: "top 55%", scrub: true } }));

      /* ---------- inner page heroes: the photograph settles, the heading writes in ---------- */
      q(".subhero").forEach((sh) => {
        mark([sh]);
        const bg = sh.querySelector(".subhero-bg");
        if (bg) gsap.fromTo(bg, { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: sh, start: "top top", end: "bottom top", scrub: true } });
        const h = sh.querySelector<HTMLElement>("h1");
        if (h) { const cs = chars(h); gsap.from(cs, { yPercent: 110, opacity: 0, stagger: 0.015, duration: 0.9, ease: "power3.out", delay: 0.15 }); }
      });

      /* ---------- split sections: images at depth, headings write in ---------- */
      q(".split-img, .split-media").forEach((m) => gsap.fromTo(m, { yPercent: 8, scale: 1.06 }, { yPercent: -8, scale: 1, ease: "none", scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: true } }));
      q("h2").forEach((h) => { if (h.closest("[data-scrub]")) return; mark([h]); const cs = chars(h); gsap.fromTo(cs, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.012, ease: "none", scrollTrigger: { trigger: h, start: "top 92%", end: "top 55%", scrub: true } }); });

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
        let x = 0, dir = 1;
        const w = () => ticker.scrollWidth / 2;
        gsap.ticker.add(() => { const v = lenis.velocity; dir = v < -0.1 ? -1 : v > 0.1 ? 1 : dir; x -= (0.6 + Math.min(Math.abs(v), 40) * 0.12) * dir; const half = w(); if (x <= -half) x += half; if (x > 0) x -= half; ticker.style.transform = `translate3d(${x}px,0,0)`; });
      }

      /* ---------- footer: lifts into place like a curtain ---------- */
      const footer = document.querySelector<HTMLElement>("footer");
      if (footer && desktop) gsap.fromTo(footer.firstElementChild, { yPercent: 18, opacity: 0.4 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: footer, start: "top bottom", end: "top 55%", scrub: true } });

      /* page load: header settles */
      gsap.fromTo(".site-header, header", { yPercent: -30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.2 });
      // day tokens whenever we land
      gsap.set(root, { ...DAY });
    }, main);

    requestAnimationFrame(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => { window.removeEventListener("load", onLoad); ctx.revert(); mm.revert(); gsap.ticker.remove(tick); lenis.destroy(); document.documentElement.classList.remove("scrub"); gsap.set(document.documentElement, { clearProps: Object.keys(DAY).join(",") }); };
  }, [pathname]);
  return null;
}
