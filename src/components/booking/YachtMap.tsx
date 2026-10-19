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
/** Clear pictograms, drawn at 1 unit = 50 mm, centred on (0,0), ~16 units tall */
function Icon({ kind, x, y }: { kind: string; x: number; y: number }) {
  const g = (children: ReactNode) => <g transform={`translate(${x} ${y})`} fill="none" stroke={ICON} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">{children}</g>;
  switch (kind) {
    case "women": return g(<><circle cx="0" cy="-6.5" r="2.2" fill={ICON} stroke="none" /><path d="M-4.2,4 L-2.4,-2.6 h4.8 L4.2,4 Z" fill={ICON} stroke="none" /><path d="M-1.6,4 v4.5 M1.6,4 v4.5" /></>);
    case "men": return g(<><circle cx="0" cy="-6.5" r="2.2" fill={ICON} stroke="none" /><rect x="-3" y="-3" width="6" height="7.5" rx="1" fill={ICON} stroke="none" /><path d="M-1.6,4.5 v4.5 M1.6,4.5 v4.5" /></>);
    case "spa": return g(<><path d="M0,7 C-7,4 -8,-3 -4,-6 C-2,-3 -1,0 0,2 C1,0 2,-3 4,-6 C8,-3 7,4 0,7 Z" /><path d="M0,2 C-1,-2 -1,-5 0,-8 C1,-5 1,-2 0,2 Z" fill={ICON} stroke="none" /><path d="M-9,7 q9,4 18,0" /></>);
    case "salon": return g(<><circle cx="-3.5" cy="4.5" r="2.4" /><circle cx="3.5" cy="4.5" r="2.4" /><path d="M-2,2.6 L5,-8 M2,2.6 L-5,-8" /></>);
    case "reception": return g(<><path d="M-8,5 h16 M-6,5 a6,6 0 0 1 12,0 M0,-1 v-2.5" /><circle cx="0" cy="-4.5" r="1.1" fill={ICON} stroke="none" /></>);
    case "kitchen": return g(<><path d="M-7,-7 v14 M-7,-7 q-3,0 -3,3 v4 q0,3 3,3 M-5,-7 q3,0 3,3 v4 q0,3 -3,3" /><path d="M3,-7 v14 M3,-7 q-2.5,0 -2.5,3 v2 q0,2 2.5,2 M3,-7 q2.5,0 2.5,3 v2 q0,2 -2.5,2 M6.5,-7 v14" /></>);
    case "staff": return g(<><circle cx="0" cy="-5" r="2.6" /><path d="M-6,8 a6,6 0 0 1 12,0 Z" /></>);
    case "stairs": return g(<path d="M-7,7 h3.5 v-3.5 h3.5 v-3.5 h3.5 v-3.5 h3.5" />);
    default: return null;
  }
}
const Caption = ({ x, y, text, dark = false }: { x: number; y: number; text: string; dark?: boolean }) => {
  const w = Math.max(14, text.length * 3.1 + 6);
  return <g pointerEvents="none"><rect x={x - w / 2} y={y - 4.3} width={w} height="6.4" rx="3.2" fill={dark ? "#5f5040" : "#fff"} fillOpacity={dark ? 1 : 0.92} /><text x={x} y={y + 0.4} fontSize="4.2" letterSpacing=".9" fill={dark ? "#fff" : "#5f5040"} style={F} textAnchor="middle" fontWeight="600">{text}</text></g>;
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
  const slab = `M${slabX},0 H${W - R} a${R},${R} 0 0 1 ${R},${R} V${H - R} a${R},${R} 0 0 1 -${R},${R} H${slabX} Z`;
  
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

      {/* 2 · amenities: raised panels with icons and readable captions */}
      {amen.map((a) => {
        const x = sx(a.x), y = sy(a.y), w = sx(a.w), h = sx(a.h), cx = x + w / 2, cy = y + h / 2, nm = a.name[L]?.toUpperCase() ?? "";
        const icon = a.kind === "restroom" ? (a.id.includes("-w-") ? "women" : "men") : a.id === "spa" ? "spa" : a.id === "salon" ? "salon" : a.id === "reception" ? "reception" : a.id === "boh" ? "kitchen" : a.id === "boh-2" ? "staff" : "";
        switch (a.kind) {
          case "pool": return <g key={a.id} pointerEvents="none">
            <rect x={x} y={y} width={w} height={h} rx="1.2" fill="url(#poolDepth)" />
            <rect x={x} y={y} width={w} height={h} rx="1.2" fill="none" stroke="#5f8f98" strokeWidth="2.2" strokeOpacity=".35" filter="url(#soft)" />
            <rect x={x + 0.6} y={y + 0.6} width={w - 1.2} height={h - 1.2} rx="1" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth=".6" />
            {[0.28, 0.5, 0.72].map((q) => <path key={q} d={`M${x + 5},${y + h * q} q${w / 10},-1.2 ${w / 5},0 t${w / 5},0 t${w / 5},0 t${w / 5},0`} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".7" strokeLinecap="round" />)}
            {nm && <text x={cx} y={cy + 2.4} fontSize="6.5" letterSpacing="2.4" fill="#1f4f57" style={F} textAnchor="middle" fontWeight="600">{nm}</text>}
          </g>;
          case "stairs": return <g key={a.id} pointerEvents="none" filter="url(#lift)"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="url(#panel)" />{Array.from({ length: 8 }).map((_, i) => { const yy = y + 1.5 + (i * (h - 3)) / 7; return <g key={i}><line x1={x + 1.5} y1={yy} x2={x + w - 1.5} y2={yy} stroke="#fff" strokeOpacity=".8" strokeWidth=".5" /><line x1={x + 1.5} y1={yy + 0.7} x2={x + w - 1.5} y2={yy + 0.7} stroke="#8d7c64" strokeOpacity=".35" strokeWidth=".6" /></g>; })}</g>;
          case "stage": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="4" fill="url(#floor)" filter="url(#lift)" /><rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx="3.5" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth=".7" />{nm && <Caption x={x + w * 0.78} y={cy} text={nm} />}</g>;
          case "dj": return <g key={a.id} pointerEvents="none" filter="url(#lift)"><rect x={x} y={y} width={w} height={h} rx="3" fill="url(#panelDark)" /><rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx="1.5" fill="url(#panel)" />{[0.3, 0.5, 0.7].map((k) => <circle key={k} cx={x + w * k} cy={cy} r="2" fill="#f6efe2" stroke="#8d7c64" strokeWidth=".4" />)}{nm && <Caption x={cx} y={cy + 7} text={nm} />}</g>;
          case "bar": return <g key={a.id} pointerEvents="none" filter="url(#lift)"><rect x={x} y={y} width={w} height={h} rx={sx(a.r ?? 500)} fill="url(#barGrad)" /><rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={Math.max(1.5, sx(a.r ?? 500) - 6)} fill="url(#panel)" /><rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx={Math.max(1, sx(a.r ?? 500) - 1)} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".7" />{nm && <Caption x={cx} y={cy} text={nm} dark />}</g>;
          case "restroom": case "salon": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="2" fill="url(#panel)" filter="url(#lift)" /><rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx="1.6" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".7" /><Icon kind={icon} x={cx} y={cy - 5} />{nm && <Caption x={cx} y={y + h - 6} text={nm} />}</g>;
          case "boh": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="2" fill="url(#panelDark)" filter="url(#lift)" /><rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} rx="1.6" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth=".7" />{icon && <Icon kind={icon} x={cx} y={cy - (nm ? 6 : 0)} />}{nm && <Caption x={cx} y={cy + 8} text={nm} />}</g>;
          case "label": return <g key={a.id} pointerEvents="none">
            {a.id === "void" && <rect x={x} y={y} width={w} height={h} rx="4" fill="#e7dfcf" stroke="#c9bda6" strokeWidth=".6" />}
            {a.id === "reception" && <><rect x={x} y={y} width={w} height={h} rx="2" fill="url(#panel)" filter="url(#lift)" /><Icon kind="reception" x={cx} y={cy - 5} /></>}
            {nm && <Caption x={cx} y={a.id === "reception" ? y + h - 6 : cy} text={nm} />}
          </g>;
          default: return null;
        }
      })}

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
