"use client";

import type { MouseEvent, ReactNode } from "react";
import { BOAT_AMENITIES, BOAT_UNITS, HULL, SCALE, type Deck } from "./boat";
import furniture from "./furniture.json";

type Strokes = [string, number, number, number, number, number, number][];
const FURN = furniture as unknown as Record<string, { p: Strokes; f: [number, number, number, number][] }>;

export interface YachtLabels { bow: string; stern: string; port: string; starboard: string; main: string; upper: string; locale: "en" | "ar" }

interface Props {
  labels: YachtLabels;
  deck: Deck;
  taken: ReadonlySet<string>;
  mine?: ReadonlySet<string>;
  reserved?: ReadonlySet<string>;
  closed?: ReadonlySet<string>;
  onSeatClick: (id: string) => void;
  onSeatMove?: (id: string, e: MouseEvent) => void;
  onSeatLeave?: () => void;
}

const sx = (mm: number) => mm / SCALE;
const isCircle = (bw: number, bh: number) => bw >= 4.5 && bw < 24 && Math.abs(bw - bh) < Math.max(bw, bh) * 0.12;
const sy = (mm: number) => (mm - HULL.top) / SCALE;
const INK = "#5a4a36", INK_SOFT = "#8a7a63";
const F = { fontFamily: "var(--font-sans)" } as const;
const ICON = "#5f5040";
/** Pictograms centred on (0,0), about 16 units tall */
function Icon({ kind, x, y, scale = 1 }: { kind: string; x: number; y: number; scale?: number }) {
  const g = (children: ReactNode) => <g transform={`translate(${x} ${y}) scale(${scale})`} fill="none" stroke={ICON} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">{children}</g>;
  switch (kind) {
    case "women": return g(<><circle cx="0" cy="-6.6" r="2.3" fill={ICON} stroke="none" /><path d="M-4.6,4.2 L-2.3,-2.8 h4.6 L4.6,4.2 Z" fill={ICON} stroke="none" /><path d="M-1.7,4.2 v4.4 M1.7,4.2 v4.4" /></>);
    case "men": return g(<><circle cx="0" cy="-6.6" r="2.3" fill={ICON} stroke="none" /><rect x="-3.2" y="-3.2" width="6.4" height="7.6" rx="1.2" fill={ICON} stroke="none" /><path d="M-1.7,4.4 v4.4 M1.7,4.4 v4.4" /><path d="M-2.2,-3.4 l2.2,1.4 l2.2,-1.4" strokeWidth=".9" /></>);
    case "hand": return g(<><path d="M-5.5,2.5 v-7 a1.4,1.4 0 0 1 2.8,0 v5 v-8.5 a1.4,1.4 0 0 1 2.8,0 v8.5 v-9.5 a1.4,1.4 0 0 1 2.8,0 v9.5 v-7.5 a1.4,1.4 0 0 1 2.8,0 v9.5 c0,4.5 -3,7 -6.5,7 c-3.5,0 -5.5,-2 -6.8,-4.5 l-2.2,-4.2 a1.4,1.4 0 0 1 2.4,-1.3 z" /><path d="M-4.1,-5.3 a1.2,.8 0 0 0 0,.2 M-1.3,-8.8 a1.2,.8 0 0 0 0,.2" stroke="#b56a7a" strokeWidth="1.6" /></>);
    case "stones": return g(<><ellipse cx="0" cy="5.5" rx="7.5" ry="3" fill="#e9dfcc" /><ellipse cx="0" cy="1" rx="6" ry="2.6" fill="#e9dfcc" /><ellipse cx="0" cy="-3.2" rx="4.4" ry="2.2" fill="#e9dfcc" /><path d="M-2,-8 q1,-2 0,-4 M2,-8 q1,-2 0,-4" strokeWidth=".8" /></>);
    case "scissors": return g(<><circle cx="-3.6" cy="4.8" r="2.4" /><circle cx="3.6" cy="4.8" r="2.4" /><path d="M-2,2.8 L5.4,-8 M2,2.8 L-5.4,-8" /></>);
    case "tattoo": return g(<><path d="M-1.8,-9 h3.6 v5 h-3.6 z" fill={ICON} stroke="none" /><rect x="-2.6" y="-4" width="5.2" height="7" rx="1" /><path d="M0,3 v4.5 M-.8,7.5 l.8,2.2 l.8,-2.2" /><path d="M2.6,-7 q4,-1 4,2.5 q0,2 -2,2" strokeWidth=".9" /></>);
    case "reception": return g(<><path d="M-8,5 h16 M-6.2,5 a6.2,6.2 0 0 1 12.4,0 M0,-1.2 v-2.4" /><circle cx="0" cy="-4.6" r="1.2" fill={ICON} stroke="none" /></>);
    case "kitchen": return g(<><path d="M-6.5,-8 v15 M-6.5,-8 q-2.6,0 -2.6,2.6 v3 q0,2.6 2.6,2.6 M-6.5,-8 q2.6,0 2.6,2.6 v3 q0,2.6 -2.6,2.6" /><path d="M4,-8 v15 M4,-8 q-2.4,0 -2.4,2.4 v2 q0,2 2.4,2 M4,-8 q2.4,0 2.4,2.4 v2 q0,2 -2.4,2 M7,-8 v15" /></>);
    case "staff": return g(<><circle cx="0" cy="-5" r="2.7" /><path d="M-6.2,8 a6.2,6.2 0 0 1 12.4,0 Z" /></>);
    case "cocktail": return g(<><path d="M-7,-8 h14 L0,0 Z" /><path d="M0,0 v7 M-4,7 h8" /><path d="M-5,-5.5 h10" strokeWidth=".8" /><circle cx="3.5" cy="-9.5" r="1.3" fill="#c0392b" stroke="none" /><path d="M-7,-8 l-2,-3" strokeWidth=".8" /></>);
    case "dj": return g(<><circle cx="-4.5" cy="0" r="4.2" /><circle cx="4.5" cy="0" r="4.2" /><circle cx="-4.5" cy="0" r="1" fill={ICON} stroke="none" /><circle cx="4.5" cy="0" r="1" fill={ICON} stroke="none" /><path d="M-9,-5.5 h18" strokeWidth=".9" /></>);
    default: return null;
  }
}
/** A lit, shadowed disc with a pictogram on it */
const Badge = ({ kind, x, y, r = 9 }: { kind: string; x: number; y: number; r?: number }) => (
  <g pointerEvents="none"><g filter="url(#bevel)"><circle cx={x} cy={y} r={r} fill="url(#disc)" /></g><circle cx={x} cy={y} r={r} fill="none" stroke="#b9a98d" strokeWidth=".4" opacity=".8" /><Icon kind={kind} x={x} y={y} scale={r / 11} /></g>
);
/** Caption pill: one line per " · " segment, text forced to fit its line */
const Caption = ({ x, y, text, dark = false, max = 40 }: { x: number; y: number; text: string; dark?: boolean; max?: number }) => {
  const parts = text.split(" · ").flatMap((t) => (t.length * 2.7 > max ? t.split(" ").reduce<string[]>((acc, wd) => { const last = acc[acc.length - 1]; if (last !== undefined && (last + " " + wd).length * 2.7 <= max) acc[acc.length - 1] = last + " " + wd; else acc.push(wd); return acc; }, []) : [t]));
  const lh = 5.6, fs = 4.3, pw = Math.min(max, Math.max(...parts.map((t) => t.length * 2.7)) + 6), ph = parts.length * lh + 1.6;
  return (
    <g pointerEvents="none">
      <rect x={x - pw / 2} y={y - ph / 2} width={pw} height={ph} rx="3.2" fill={dark ? "#5f5040" : "#fff"} fillOpacity={dark ? 1 : 0.94} />
      {parts.map((t, i) => <text key={i} x={x} y={y - ph / 2 + 0.8 + lh * (i + 1) - 1.3} fontSize={fs} fill={dark ? "#fff" : "#5f5040"} style={{ ...F, fontKerning: "none" }} textAnchor="middle" fontWeight="600">{t}</text>)}
    </g>
  );
};

/**
 * THE NOA seat map. The linework IS Atelier EPJ's drawing: the furniture, pool, stairs, rooms and rails are the
 * PDF's own vectors (NA-ID-1000 / NA-ID-1100), cleaned of dimensions, grid and annotations and exported at 1:50
 * into /public/map. This component paints colour under it (deck, water, masks over back of house) and the
 * interactive layer over it (seat hit areas with state tints, corner labels). Nothing about the layout is drawn by hand.
 */
export default function YachtMap({ labels, deck, taken, mine, reserved, closed, onSeatClick, onSeatMove, onSeatLeave }: Props) {
  const stateOf = (id: string) => (taken.has(id) ? "taken" : mine?.has(id) ? "mine" : closed?.has(id) ? "closed" : reserved?.has(id) ? "reserved" : "");
  const seatOf = (e: MouseEvent): string | null => (e.target as Element).closest?.("[data-seat]")?.getAttribute("data-seat") ?? null;
  const onClick = (e: MouseEvent) => { const id = seatOf(e); if (id && !taken.has(id)) onSeatClick(id); };
  const onMove = (e: MouseEvent) => { const id = seatOf(e); if (id && !taken.has(id)) onSeatMove?.(id, e); else onSeatLeave?.(); };
  const W = HULL.length / SCALE, H = HULL.beam / SCALE, PAD = 30, L = labels.locale, R = HULL.corner / SCALE;
  const units = BOAT_UNITS.filter((u) => u.deck === deck && u.w > 0);
  const amen = BOAT_AMENITIES.filter((a) => a.deck === deck);
  const hull = `M${R},0 H${W - R} a${R},${R} 0 0 1 ${R},${R} V${H - R} a${R},${R} 0 0 1 -${R},${R} H${R} a${R},${R} 0 0 1 -${R},-${R} V${R} a${R},${R} 0 0 1 ${R},-${R} Z`;
  const slabX = sx(31400);
  const Rs = sx(400);
  const slab = `M${slabX},0 H${W - Rs} a${Rs},${Rs} 0 0 1 ${Rs},${Rs} V${H - Rs} a${Rs},${Rs} 0 0 1 -${Rs},${Rs} H${slabX} Z`;
  
  return (
    <svg className="yacht-map" onClick={onClick} onMouseMove={onMove} onMouseLeave={() => onSeatLeave?.()} viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={deck === "main" ? labels.main : labels.upper}>
      <defs>
        <linearGradient id="poolGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a8d1d8" /><stop offset="1" stopColor="#cfe5ea" /></linearGradient>
        <linearGradient id="hullGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f3ede1" /><stop offset="1" stopColor="#ebe2d0" /></linearGradient>
        <pattern id="planks" patternUnits="userSpaceOnUse" width="160" height="3.2"><line x1="0" y1="0" x2="160" y2="0" stroke="#d8ccb6" strokeWidth=".25" /></pattern>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#b9ad99" strokeWidth=".6" /></pattern>
        <radialGradient id="disc" cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#fffdf8" /><stop offset=".55" stopColor="#f1e9d8" /><stop offset="1" stopColor="#d9cbb1" /></radialGradient>
        <radialGradient id="pouf" cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#fffdf9" /><stop offset=".6" stopColor="#f3ecdd" /><stop offset="1" stopColor="#d7c8ad" /></radialGradient>
        <linearGradient id="sofaBody" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fffcf6" /><stop offset="1" stopColor="#e6dbc6" /></linearGradient>
        <filter id="bevel" x="-20%" y="-20%" width="140%" height="150%">
          <feGaussianBlur in="SourceAlpha" stdDeviation=".6" result="b" />
          <feSpecularLighting in="b" surfaceScale="2.2" specularConstant=".55" specularExponent="18" lightingColor="#fff" result="spec"><fePointLight x="-40" y="-80" z="120" /></feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="spec2" />
          <feComposite in="SourceGraphic" in2="spec2" operator="arithmetic" k1="0" k2="1" k3=".9" k4="0" result="lit" />
          <feDropShadow in="lit" dx="0" dy="1" stdDeviation=".8" floodColor="#4a3a24" floodOpacity=".42" />
        </filter>
        <linearGradient id="panel" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f7f2e8" /><stop offset="1" stopColor="#e9e0cf" /></linearGradient>
        <linearGradient id="panelDark" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e1d6c2" /><stop offset="1" stopColor="#cfc2aa" /></linearGradient>
        <linearGradient id="floor" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f3ece0" /><stop offset="1" stopColor="#e6dcc8" /></linearGradient>
        <filter id="hullShadow" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#4a3a24" floodOpacity=".22" /></filter>
        <clipPath id="hullClip"><path d={deck === "main" ? hull : slab} /></clipPath>
        {units.map((u) => { const w = sx(u.w), h = sx(u.h); return <clipPath key={u.id} id={`clip-${u.id}`}>{u.r && u.r >= u.w / 2 ? <circle cx={w / 2} cy={h / 2} r={w / 2 + 2} /> : <rect x="-4" y="-4" width={w + 8} height={h + 8} rx={u.r ? sx(u.r) : 1.5} />}</clipPath>; })}
        <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d9bd8f" /><stop offset="1" stopColor="#c7a66f" /></linearGradient>
        <linearGradient id="cabFabric" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#dcb07c" /><stop offset="1" stopColor="#c99a66" /></linearGradient>
        <linearGradient id="loungeFabric" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d2a776" /><stop offset="1" stopColor="#bb8f5c" /></linearGradient>
        <linearGradient id="vipFabric" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c9a26e" /><stop offset="1" stopColor="#a67e4e" /></linearGradient>
        <linearGradient id="linen" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#efe4cf" /><stop offset="1" stopColor="#e4d5b9" /></linearGradient>
        <filter id="lift" x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.5" floodColor="#4a3a24" floodOpacity=".32" /></filter>
        <filter id="piece" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy=".6" stdDeviation=".45" floodColor="#4a3a24" floodOpacity=".28" /></filter>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" /></filter>
        <linearGradient id="cushion" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fdfaf4" /><stop offset="1" stopColor="#ebe2d0" /></linearGradient>
        <linearGradient id="edgeLight" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".35" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#3a2c1c" stopOpacity=".16" /></linearGradient>
        <radialGradient id="poolDepth" cx="50%" cy="50%" r="70%"><stop offset="0" stopColor="#d4e9ec" /><stop offset=".7" stopColor="#a9d0d7" /><stop offset="1" stopColor="#8fbfc8" /></radialGradient>
      </defs>

      <text x={-PAD + 7} y={H / 2} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle" transform={`rotate(-90 ${-PAD + 7} ${H / 2})`}>{labels.bow}</text>
      <text x={W + PAD - 7} y={H / 2} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle" transform={`rotate(90 ${W + PAD - 7} ${H / 2})`}>{labels.stern}</text>
      <text x={W / 2} y={-14} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle">{labels.port}</text>
      <text x={W / 2} y={H + 21} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle">{labels.starboard}</text>

      {/* 1 · deck */}
      {deck === "main"
        ? <><path d={hull} fill="url(#hullGrad)" stroke="#8a7a63" strokeWidth=".9" filter="url(#hullShadow)" /><path d={hull} fill="none" stroke="#3a2c1c" strokeWidth="6" strokeOpacity=".06" filter="url(#soft)" /></>
        : <><path d={hull} fill="none" stroke={INK_SOFT} strokeWidth=".7" strokeDasharray="3 3" opacity=".6" /><path d={slab} fill="url(#hullGrad)" stroke={INK} strokeWidth="1.1" filter="url(#hullShadow)" /></>}
      <path d={deck === "main" ? hull : slab} fill="url(#planks)" pointerEvents="none" />

      {/* 2 · amenities: raised panels with icons and readable captions — everything inside the deck outline */}
      <g clipPath="url(#hullClip)">
      {amen.map((a) => {
        const x = sx(a.x), y = sy(a.y), w = sx(a.w), h = sx(a.h), cx = x + w / 2, cy = y + h / 2, nm = a.name[L]?.toUpperCase() ?? "";
        const badges: string[] = a.kind === "restroom" ? [a.id.includes("-w-") ? "women" : "men"] : a.id === "spa" ? ["hand", "stones"] : a.id === "salon" ? ["scissors", "tattoo"] : a.id === "reception" ? ["reception"] : a.id === "boh" ? ["kitchen"] : a.id === "boh-2" ? ["staff"] : [];
        const Badges = ({ cy2 }: { cy2: number }) => <>{badges.map((b, i) => <Badge key={b} kind={b} x={cx + (i - (badges.length - 1) / 2) * 22} y={cy2} />)}</>;
        switch (a.kind) {
          case "pool": return <g key={a.id} pointerEvents="none">
            <rect x={x} y={y} width={w} height={h} rx="1.2" fill="url(#poolDepth)" />
            <rect x={x} y={y} width={w} height={h} rx="1.2" fill="none" stroke="#5f8f98" strokeWidth="2.2" strokeOpacity=".35" filter="url(#soft)" />
            <rect x={x + 0.6} y={y + 0.6} width={w - 1.2} height={h - 1.2} rx="1" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth=".6" />
            {[0.28, 0.5, 0.72].map((q) => <path key={q} d={`M${x + 5},${y + h * q} q${w / 10},-1.2 ${w / 5},0 t${w / 5},0 t${w / 5},0 t${w / 5},0`} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".7" strokeLinecap="round" />)}
            {nm && <text x={cx} y={cy + 2.4} fontSize="6.5" letterSpacing="2.4" fill="#1f4f57" style={F} textAnchor="middle" fontWeight="600">{nm}</text>}
          </g>;
          case "stairs": return <g key={a.id} pointerEvents="none" filter="url(#lift)"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="url(#panel)" />{Array.from({ length: 8 }).map((_, i) => { const yy = y + 1.5 + (i * (h - 3)) / 7; return <g key={i}><line x1={x + 1.5} y1={yy} x2={x + w - 1.5} y2={yy} stroke="#fff" strokeOpacity=".8" strokeWidth=".5" /><line x1={x + 1.5} y1={yy + 0.7} x2={x + w - 1.5} y2={yy + 0.7} stroke="#8d7c64" strokeOpacity=".35" strokeWidth=".6" /></g>; })}</g>;
          case "stage": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="4" fill="url(#floor)" filter="url(#lift)" /><rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx="3.5" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth=".7" />{nm && <Caption x={x + w * 0.78} y={cy} text={nm} max={60} />}</g>;
          case "dj": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="3" fill="url(#panelDark)" filter="url(#lift)" /><Badge kind="dj" x={cx} y={cy - 7} r={8} />{nm && <Caption x={cx} y={cy + 9} text={nm} max={w - 4} />}</g>;
          case "bar": {
            const vertical = h > w, rr = sx(a.r ?? 500), n = vertical ? 4 : 5, stools: [number, number][] = [];
            for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; if (vertical) { stools.push([x - 4.2, y + h * t], [x + w + 4.2, y + h * t]); } else { stools.push([x + w * t, y - 4.2], [x + w * t, y + h + 4.2]); } }
            return <g key={a.id} pointerEvents="none">
              <g filter="url(#lift)"><rect x={x} y={y} width={w} height={h} rx={rr} fill="url(#barGrad)" /></g>
              <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={Math.max(1.5, rr - 5)} fill="url(#panel)" />
              {/* back bar: a shelf of bottles along the service side */}
              {vertical
                ? <g><rect x={x + 7} y={y + 8} width="4" height={h - 16} rx="1" fill="#d9cdb6" />{Array.from({ length: 7 }).map((_, i) => <rect key={i} x={x + 7.8} y={y + 10 + (i * (h - 20)) / 6} width="2.4" height="3.2" rx=".8" fill={["#7a9a6b", "#b56a3a", "#5f7f9a", "#c9a24a"][i % 4]} />)}</g>
                : <g><rect x={x + 8} y={y + 7} width={w - 16} height="4" rx="1" fill="#d9cdb6" />{Array.from({ length: 9 }).map((_, i) => <rect key={i} x={x + 10 + (i * (w - 20)) / 8} y={y + 7.4} width="2.4" height="3.2" rx=".8" fill={["#7a9a6b", "#b56a3a", "#5f7f9a", "#c9a24a"][i % 4]} />)}</g>}
              {/* bar stools on the guest sides */}
              <g filter="url(#bevel)">{stools.map(([sxx, syy], i) => <circle key={i} cx={sxx} cy={syy} r="2.3" fill="url(#pouf)" />)}</g>
              <Badge kind="cocktail" x={cx} y={cy - 6} r={8} />
              {nm && <Caption x={cx} y={cy + 8} text={nm} dark max={w - 2} />}
            </g>;
          }
          case "restroom": case "salon": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="2" fill="url(#panel)" filter="url(#lift)" /><rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx="1.6" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".7" /><Badges cy2={cy - 8} />{nm && <Caption x={cx} y={y + h - 9} text={nm} max={w - 4} />}</g>;
          case "boh": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="2" fill="url(#panelDark)" filter="url(#lift)" /><rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx="1.6" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth=".7" />{badges.length > 0 && <Badges cy2={cy - (nm ? 8 : 0)} />}{nm && <Caption x={cx} y={cy + 9} text={nm} max={w - 4} />}</g>;
          case "label": return <g key={a.id} pointerEvents="none">
            {a.id === "void" && <rect x={x} y={y} width={w} height={h} rx="4" fill="#e7dfcf" stroke="#c9bda6" strokeWidth=".6" />}
            {a.id === "reception" && <><rect x={x} y={y} width={w} height={h} rx="2" fill="url(#panel)" filter="url(#lift)" /><Badge kind="reception" x={cx} y={cy - 8} /></>}
            {nm && <Caption x={cx} y={a.id === "reception" ? y + h - 9 : cy} text={nm} max={a.id === "reception" ? w - 4 : 120} />}
          </g>;
          default: return null;
        }
      })}

      </g>

      {/* 3 · seats: tinted base with a lift shadow, then the architect's own furniture lines for that unit */}
      {units.map((u) => {
        const x = sx(u.x), y = sy(u.y), w = sx(u.w), h = sx(u.h), round = !!u.r && u.r >= u.w / 2;
        const fill = { cabana: "url(#cabFabric)", "upper-cabana": "url(#cabFabric)", lounge: "url(#loungeFabric)", "vip-booth": "url(#vipFabric)", daybed: "url(#linen)", sunbed: "url(#linen)", table: "#efe6d3", alfresco: "url(#linen)" }[u.type] ?? "#efe6d3";
        const lifted = true;
        const lines = FURN[u.id]?.p ?? [], pieces = FURN[u.id]?.f ?? [];
        return (
          <g key={`f-${u.id}`} transform={`translate(${x} ${y})`} pointerEvents="none" filter={lifted ? "url(#lift)" : undefined}>
            {round ? <g filter="url(#bevel)"><circle cx={w / 2} cy={h / 2} r={w / 2} fill="url(#disc)" /></g> : <rect x="0" y="0" width={w} height={h} rx={u.r ? sx(u.r) : 1.5} fill={fill} />}
            {u.type === "table" && <><circle cx={w / 2} cy={h / 2} r={w / 2} fill="none" stroke="#9c8a6c" strokeWidth=".4" /><circle cx={w / 2} cy={h / 2} r={w / 2 * 0.55} fill="none" stroke="#b2a286" strokeWidth=".3" /></>}
            {round ? <circle cx={w / 2} cy={h / 2} r={w / 2} fill="url(#edgeLight)" /> : <rect x="0" y="0" width={w} height={h} rx={u.r ? sx(u.r) : 1.5} fill="url(#edgeLight)" />}
            {(u.type === "daybed" || u.type === "sunbed") && <g filter="url(#bevel)"><rect x="1.4" y="1.4" width={w - 2.8} height={h - 2.8} rx="2" fill="url(#sofaBody)" /></g>}
            <g clipPath={`url(#clip-${u.id})`}>
              {/* 3-D bodies: every closed shape and every rectilinear piece gets a lit, shadowed body; circles become discs/poufs */}
              <g filter="url(#bevel)">
                {u.type !== "vip-booth" && lines.map(([, kind, bx, by, bw, bh], i) => (kind !== 1 && isCircle(bw, bh) ? <circle key={`o${i}`} cx={bx + bw / 2} cy={by + bh / 2} r={bw / 2} fill={bw > 10 ? "url(#disc)" : "url(#pouf)"} /> : null))}
                {u.type === "lounge" && pieces.map(([px, py, pw, ph], i) => (pw >= 5 && pw <= 14 && ph >= 5 && ph <= 14 ? <rect key={`q${i}`} x={px} y={py} width={pw} height={ph} rx={Math.min(pw, ph) * 0.42} fill="url(#pouf)" /> : null))}
                {(u.type === "cabana" || u.type === "upper-cabana" || u.type === "alfresco") && pieces.map(([px, py, pw, ph], i) => <rect key={`p${i}`} x={px} y={py} width={pw} height={ph} rx="1.6" fill="url(#sofaBody)" />)}
                {u.type !== "vip-booth" && lines.map(([d, kind, bx, by, bw, bh], i) => {
                  if (kind !== 1) return null;
                  const roundish = Math.abs(bw - bh) < Math.max(bw, bh) * 0.12;
                  if (roundish && bw < 24) return <circle key={i} cx={bx + bw / 2} cy={by + bh / 2} r={bw / 2} fill={bw > 10 ? "url(#disc)" : "url(#pouf)"} />;
                  return <path key={i} d={d} fill="url(#sofaBody)" stroke="none" />;
                })}
                {(u.type === "cabana" || u.type === "upper-cabana" || u.type === "alfresco" || u.type === "vip-booth") && lines.map(([d, kind, bx, by, bw, bh], i) => kind === 2 ? <rect key={`c${i}`} x={bx + 0.3} y={by + 0.3} width={bw - 0.6} height={bh - 0.6} rx="1.3" fill="url(#cushion)" stroke="#cfc2a9" strokeWidth=".4" /> : null)}
              </g>
              {/* sofa curves (lounges, VIP): a raised body with a soft underside */}
              {u.type === "lounge" && lines.map(([d, kind, , , bw, bh], i) => (kind === 1 || isCircle(bw, bh) || Math.max(bw, bh) < 12 || Math.min(bw, bh) < 0.6) ? null : (
                <g key={`r${i}`}>
                  <path d={d} fill="none" stroke="#5a4a36" strokeWidth="5" strokeOpacity=".22" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 1.2)" />
                  <path d={d} fill="none" stroke="url(#sofaBody)" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={d} fill="none" stroke="#fff" strokeWidth="1" strokeOpacity=".7" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -1.1)" />
                </g>
              ))}
              {/* a faint rim on discs so they read on cream */}
              {u.type !== "vip-booth" && lines.map(([, kind, bx, by, bw, bh], i) => isCircle(bw, bh) ? <circle key={`rim${i}`} cx={bx + bw / 2} cy={by + bh / 2} r={bw / 2} fill="none" stroke="#9c8a6c" strokeWidth=".3" opacity=".6" /> : null)}
            </g>
            {/* our own soft details where the drawing only has seams: bolsters on daybeds, slats on loungers */}
            {u.type === "vip-booth" && (() => { const d = 14.8, cush = (h - 2 * d - 2) / 3; return (
              <g filter="url(#bevel)">
                <rect x={w - d - 1} y="1" width={d} height={h - 2} rx="2" fill="url(#sofaBody)" />
                <rect x="1" y="1" width={w - 2} height={d} rx="2" fill="url(#sofaBody)" />
                <rect x="1" y={h - d - 1} width={w - 2} height={d} rx="2" fill="url(#sofaBody)" />
                {[0, 1, 2].map((i) => <rect key={i} x={w - d} y={d + 1.6 + i * cush} width={d - 2} height={cush - 1.2} rx="1.3" fill="url(#cushion)" stroke="#cfc2a9" strokeWidth=".4" />)}
                {[0, 1].map((i) => <rect key={`t${i}`} x={2.2 + i * ((w - d - 4) / 2)} y="2" width={(w - d - 4) / 2 - 1} height={d - 2} rx="1.3" fill="url(#cushion)" stroke="#cfc2a9" strokeWidth=".4" />)}
                {[0, 1].map((i) => <rect key={`b${i}`} x={2.2 + i * ((w - d - 4) / 2)} y={h - d} width={(w - d - 4) / 2 - 1} height={d - 2} rx="1.3" fill="url(#cushion)" stroke="#cfc2a9" strokeWidth=".4" />)}
                <rect x={(w - d) / 2 - 12 + 1} y={h / 2 - 4.9} width="24" height="9.8" rx="1.2" fill="url(#disc)" />
              </g>); })()}
            {u.type === "daybed" && <g filter="url(#piece)"><rect x="3.2" y="2.6" width={w - 6.4} height="3" rx="1.5" fill="url(#pouf)" /><rect x="3.2" y={h - 5.6} width={w - 6.4} height="3" rx="1.5" fill="url(#pouf)" /></g>}
            {u.type === "sunbed" && <g>{Array.from({ length: 5 }).map((_, i) => <rect key={i} x={2.2 + i * 1.3} y="2.2" width=".6" height={h - 4.4} rx=".3" fill="#b9a98d" opacity=".55" />)}<rect x={w * 0.42} y="2.2" width={w * 0.52} height={h - 4.4} rx="1" fill="url(#cushion)" filter="url(#piece)" /></g>}
          </g>
        );
      })}

      {/* 5 · interactive seats: transparent hit areas + state + corner label */}
      {units.map((u) => {
        const x = sx(u.x), y = sy(u.y), w = sx(u.w), h = sx(u.h), st = stateOf(u.id), round = !!u.r && u.r >= u.w / 2;
        const chipW = u.label.length > 2 ? 15 : 12, chipH = 7.6, below = u.y + u.h / 2 < 7000;
        return (
          <g key={u.id} className={`seat-g ${st}`} transform={`translate(${x} ${y})`}>
            {round
              ? <circle className={`seat ${u.type} ${st}`} data-seat={u.id} cx={w / 2} cy={h / 2} r={w / 2 + 2} fill="transparent" stroke="none" />
              : <rect className={`seat ${u.type} ${st}`} data-seat={u.id} x="-0.6" y="-0.6" width={w + 1.2} height={h + 1.2} rx={u.r ? sx(u.r) : 1.5} fill="transparent" stroke="none" />}
            <g pointerEvents="none" transform={round ? `translate(${w / 2 - chipW / 2} ${below ? h + 3 : -chipH - 3})` : `translate(${w - chipW - 1} ${below ? h - chipH - 1 : 1})`}>
              <rect width={chipW} height={chipH} rx="1.4" fill="#fff" fillOpacity=".95" stroke={INK} strokeWidth=".35" />
              <text x={chipW / 2} y={chipH - 2.1} fontSize="5.2" letterSpacing=".3" fill={INK} style={F} textAnchor="middle" fontWeight="600">{u.label}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
