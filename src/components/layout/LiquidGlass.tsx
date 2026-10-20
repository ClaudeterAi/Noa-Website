"use client";

import { useEffect } from "react";

/**
 * Liquid glass for the header pill and the footer panel.
 *
 * Three layers make the material. Two are plain CSS and work in every browser
 * (see .lg in globals.css): a frosted, colour-boosted blur of the backdrop, and a
 * lit rim with a gloss band. The third, refraction at the edge, needs an SVG
 * displacement filter applied through `backdrop-filter: url(#…)`, which only
 * Chromium renders. This component builds that filter for each glass element,
 * sized to it, and marks <html> with .lg-refract so the CSS switches it on;
 * Safari and Firefox never get the class and keep the frosted look.
 *
 * The lens map is drawn on a canvas: neutral grey in the middle (no shift) and,
 * in a ring of `thickness` px inside the edge, a vector pulling the backdrop
 * toward the centre, so the page appears to bend around the glass. R drives X,
 * G drives Y. Regenerated when the element resizes (the pill changes width on
 * scroll). Nothing runs per frame.
 */

type Spec = { selector: string; id: string; thickness: number; scale: number; blur: number; saturate: number; brightness: number };

const SPECS: Spec[] = [
  { selector: "#nav .nav-body", id: "lg-nav", thickness: 22, scale: 38, blur: 14, saturate: 1.5, brightness: 0.86 },
  { selector: ".bwf-inner.lg", id: "lg-foot", thickness: 44, scale: 60, blur: 10, saturate: 1.3, brightness: 1 },
];

/** Signed distance from a point to a rounded rectangle (inside negative). */
const sdRoundRect = (px: number, py: number, w: number, h: number, r: number) => {
  const qx = Math.abs(px - w / 2) - (w / 2 - r), qy = Math.abs(py - h / 2) - (h / 2 - r);
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
};

/** Lens map PNG data URL for an element of w×h with corner radius r. */
const lensMap = (w: number, h: number, r: number, thickness: number): string => {
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h));
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(c.width, c.height), d = img.data, cx = c.width / 2, cy = c.height / 2;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const dist = -sdRoundRect(x + 0.5, y + 0.5, c.width, c.height, r);   // >0 inside, px from the edge
      // 0 at the edge → 1 at `thickness` inward, eased so the bend is strongest right at the rim and fades smoothly
      const t = Math.min(Math.max(dist / thickness, 0), 1), f = 1 - t * t * (3 - 2 * t);
      // direction: toward the centre; magnitude: f
      const vx = cx - x, vy = cy - y, len = Math.hypot(vx, vy) || 1;
      const i = (y * c.width + x) * 4;
      d[i] = Math.round(128 + (vx / len) * f * 127);
      d[i + 1] = Math.round(128 + (vy / len) * f * 127);
      d[i + 2] = 128; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
};

const isChromium = (): boolean => {
  const n = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } };
  if (n.userAgentData?.brands?.length) return n.userAgentData.brands.some((b) => /Chromium/i.test(b.brand));
  // Chrome, Edge, Opera, Brave, Arc all carry "Chrome/"; Chrome on iOS (CriOS) is WebKit and must not match
  return /Chrome\/\d/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
};

export default function LiquidGlass() {
  useEffect(() => {
    if (!isChromium() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("lg-refract");

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden");
    svg.innerHTML = SPECS.map((s) =>
      `<filter id="${s.id}" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">` +
      `<feImage result="map" preserveAspectRatio="none" x="0" y="0" width="100%" height="100%"/>` +
      `<feGaussianBlur in="SourceGraphic" stdDeviation="${s.blur}" result="blurred"/>` +
      `<feColorMatrix in="blurred" type="saturate" values="${s.saturate}" result="sat"/>` +
      `<feComponentTransfer in="sat" result="lit"><feFuncR type="linear" slope="${s.brightness}"/><feFuncG type="linear" slope="${s.brightness}"/><feFuncB type="linear" slope="${s.brightness}"/></feComponentTransfer>` +
      `<feDisplacementMap in="lit" in2="map" scale="${s.scale}" xChannelSelector="R" yChannelSelector="G"/>` +
      `</filter>`,
    ).join("");
    document.body.appendChild(svg);

    const observers: ResizeObserver[] = [];
    const pending = new Map<string, number>();
    const draw = (spec: Spec, el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const radius = Math.min(parseFloat(getComputedStyle(el).borderRadius) || 0, r.height / 2, r.width / 2);
      const img = svg.querySelector<SVGElement>(`#${spec.id} feImage`);
      if (!img) return;
      img.setAttribute("href", lensMap(r.width, r.height, radius, spec.thickness));
      img.setAttribute("width", String(r.width)); img.setAttribute("height", String(r.height));
    };
    const schedule = (spec: Spec, el: HTMLElement) => {
      // the pill animates width for 700ms on scroll; redraw after it settles, not every observer tick
      clearTimeout(pending.get(spec.id));
      pending.set(spec.id, window.setTimeout(() => draw(spec, el), 760));
    };
    for (const spec of SPECS) {
      const el = document.querySelector<HTMLElement>(spec.selector);
      if (!el) continue;
      draw(spec, el);
      const ro = new ResizeObserver(() => schedule(spec, el));
      ro.observe(el);
      observers.push(ro);
    }
    return () => {
      observers.forEach((o) => o.disconnect());
      pending.forEach((t) => clearTimeout(t));
      svg.remove();
      document.documentElement.classList.remove("lg-refract");
    };
  }, []);
  return null;
}
