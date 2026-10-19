"use client";

import type { MouseEvent } from "react";
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
const sy = (mm: number) => (mm - HULL.top) / SCALE;
const INK = "#5a4a36", INK_SOFT = "#8a7a63";
const F = { fontFamily: "var(--font-sans)" } as const;

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

      {/* 2 · amenities, drawn clean */}
      {amen.map((a) => {
        const x = sx(a.x), y = sy(a.y), w = sx(a.w), h = sx(a.h), cx = x + w / 2, cy = y + h / 2, nm = a.name[L]?.toUpperCase() ?? "";
        const cap = (fs: number, yy: number, color = INK_SOFT, ls = 1) => (nm ? <text x={cx} y={yy} fontSize={fs} letterSpacing={ls} fill={color} style={F} textAnchor="middle" pointerEvents="none">{nm}</text> : null);
        switch (a.kind) {
          case "pool": return <g key={a.id} pointerEvents="none">
            <rect x={x} y={y} width={w} height={h} rx="1.2" fill="url(#poolDepth)" />
            <rect x={x} y={y} width={w} height={h} rx="1.2" fill="none" stroke="#5f8f98" strokeWidth="2.2" strokeOpacity=".35" filter="url(#soft)" />
            <rect x={x + 0.6} y={y + 0.6} width={w - 1.2} height={h - 1.2} rx="1" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth=".6" />
            {[0.28, 0.5, 0.72].map((q) => <path key={q} d={`M${x + 5},${y + h * q} q${w / 10},-1.2 ${w / 5},0 t${w / 5},0 t${w / 5},0 t${w / 5},0`} fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".7" strokeLinecap="round" />)}
            {cap(6.5, cy + 2.4, "#245f68", 2.4)}
          </g>;
          case "stairs": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1" fill="#efe8da" stroke={INK_SOFT} strokeWidth=".5" />{Array.from({ length: 8 }).map((_, i) => <line key={i} x1={x + 1.5} y1={y + 2 + (i * (h - 4)) / 7} x2={x + w - 1.5} y2={y + 2 + (i * (h - 4)) / 7} stroke={INK_SOFT} strokeWidth=".45" />)}</g>;
          case "stage": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="3" fill="#efe7d7" stroke={INK_SOFT} strokeWidth=".6" strokeDasharray="4 2.5" />{nm && <text x={x + w * 0.78} y={cy + 2} fontSize="5.4" letterSpacing="2.2" fill={INK_SOFT} style={F} textAnchor="middle" pointerEvents="none">{nm}</text>}</g>;
          case "dj": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="3" fill="#e4dac6" stroke={INK} strokeWidth=".5" strokeDasharray="2.5 1.5" /><rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx="1.5" fill="none" stroke={INK} strokeWidth=".4" strokeDasharray="2 1.5" />{cap(4.4, cy + 1.6, INK, 1.2)}</g>;
          case "bar": return <g key={a.id} pointerEvents="none" filter="url(#lift)"><rect x={x} y={y} width={w} height={h} rx={sx(a.r ?? 500)} fill="url(#barGrad)" stroke={INK} strokeWidth=".55" /><rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={Math.max(1.5, sx(a.r ?? 500) - 6)} fill="#f6efe2" stroke={INK} strokeWidth=".4" />{cap(5.2, cy + 2, INK, 1.8)}</g>;
          case "restroom": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="#f1ebdf" stroke={INK_SOFT} strokeWidth=".5" /><circle cx={cx} cy={cy - 4} r="1.6" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><path d={`M${cx - 3},${cy + 3.5} a3,3 0 0 1 6,0`} fill="none" stroke={INK_SOFT} strokeWidth=".5" />{cap(4.4, y + h - 4)}</g>;
          case "salon": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="#f1ebdf" stroke={INK_SOFT} strokeWidth=".5" /><rect x={cx - 7} y={cy - 6} width="5" height="5" rx="1.2" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><rect x={cx + 2} y={cy - 6} width="5" height="5" rx="1.2" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><circle cx={cx - 4.5} cy={cy + 3} r="1.4" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><circle cx={cx + 4.5} cy={cy + 3} r="1.4" fill="none" stroke={INK_SOFT} strokeWidth=".5" />{cap(4.2, y + h - 4)}</g>;
          case "boh": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="#ece5d7" stroke="#bfb3a0" strokeWidth=".5" /><rect x={x} y={y} width={w} height={h} rx="1.2" fill="url(#hatch)" />{cap(4.8, cy + 1.8)}</g>;
          case "label": return <g key={a.id} pointerEvents="none">{a.id === "void" && <rect x={x} y={y} width={w} height={h} rx="2" fill="none" stroke={INK_SOFT} strokeWidth=".5" strokeDasharray="3 2.5" />}{a.id === "reception" && <rect x={x} y={y} width={w} height={h} rx="1.2" fill="#f1ebdf" stroke={INK_SOFT} strokeWidth=".5" />}{cap(4.8, a.id === "reception" ? cy + 1.8 : cy + 1.8)}</g>;
          case "arrival": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="#dbe7ea" stroke="#7fa3ab" strokeWidth=".5" /><path d={`M${cx - 6},${cy + 1.5} h12 l-2,2.6 h-8 z`} fill="#2f6b74" /><path d={`M${cx - 1},${cy + 1.5} v-5 l4,5`} fill="none" stroke="#2f6b74" strokeWidth=".7" /><text x={cx} y={a.y < 7000 ? y + h + 5 : y - 2.5} fontSize="3.6" letterSpacing="1" fill="#2f6b74" style={F} textAnchor="middle">{L === "ar" ? "القارب المكوكي · الوصول والمغادرة" : "SHUTTLE · ARRIVAL & DEPARTURE"}</text></g>;
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
            {round ? <circle cx={w / 2} cy={h / 2} r={w / 2} fill={u.type === "table" ? "url(#cushion)" : fill} stroke={u.type === "table" ? "#9c8a6c" : "none"} strokeWidth=".45" /> : <rect x="0" y="0" width={w} height={h} rx={u.r ? sx(u.r) : 1.5} fill={fill} />}
            {u.type === "table" && <circle cx={w / 2} cy={h / 2} r={w / 2 * 0.62} fill="none" stroke="#9c8a6c" strokeWidth=".3" opacity=".7" />}
            {round ? <circle cx={w / 2} cy={h / 2} r={w / 2} fill="url(#edgeLight)" /> : <rect x="0" y="0" width={w} height={h} rx={u.r ? sx(u.r) : 1.5} fill="url(#edgeLight)" />}
            {(u.type === "daybed" || u.type === "sunbed") && <rect x="1.4" y="1.4" width={w - 2.8} height={h - 2.8} rx="1.8" fill="url(#cushion)" filter="url(#piece)" />}
            <g clipPath={`url(#clip-${u.id})`}>
              {/* soft fills under the pieces: closed shapes by outline, cushion-like polylines by their box */}
              <g filter="url(#piece)">
                {pieces.map(([px, py, pw, ph], i) => <rect key={`p${i}`} x={px} y={py} width={pw} height={ph} rx="1.6" fill="url(#cushion)" />)}
                {lines.map(([d, kind, bx, by, bw, bh], i) => kind === 1
                  ? <path key={i} d={d} fill="url(#cushion)" stroke="none" />
                  : kind === 2 ? <rect key={i} x={bx + 0.3} y={by + 0.3} width={bw - 0.6} height={bh - 0.6} rx="1.3" fill="url(#cushion)" /> : null)}
              </g>
              {/* the architect's strokes */}
              {lines.map(([d, kind], i) => <path key={i} d={d} fill="none" stroke={kind ? "#6b5a44" : "#7d6d56"} strokeWidth={kind ? ".42" : ".36"} strokeLinecap="round" strokeLinejoin="round" opacity={kind ? 1 : 0.85} />)}
            </g>
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
