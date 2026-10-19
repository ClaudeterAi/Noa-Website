"use client";

import type { MouseEvent } from "react";
import { BOAT_AMENITIES, BOAT_UNITS, HULL, SCALE, type Deck } from "./boat";

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
  const tint: Record<string, string> = { cabana: "#d9b27c", "upper-cabana": "#d9b27c", lounge: "#cfa672", "vip-booth": "#c69d66", daybed: "#e8d6b2", sunbed: "#e8d6b2", table: "#e0cfa8", alfresco: "#e8d6b2" };

  return (
    <svg className="yacht-map" onClick={onClick} onMouseMove={onMove} onMouseLeave={() => onSeatLeave?.()} viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={deck === "main" ? labels.main : labels.upper}>
      <defs>
        <linearGradient id="poolGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#a8d1d8" /><stop offset="1" stopColor="#cfe5ea" /></linearGradient>
        <linearGradient id="hullGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f3ede1" /><stop offset="1" stopColor="#ebe2d0" /></linearGradient>
        <pattern id="planks" patternUnits="userSpaceOnUse" width="160" height="3.2"><line x1="0" y1="0" x2="160" y2="0" stroke="#d8ccb6" strokeWidth=".25" /></pattern>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#b9ad99" strokeWidth=".6" /></pattern>
        <filter id="hullShadow" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#4a3a24" floodOpacity=".22" /></filter>
        <clipPath id="hullClip"><path d={deck === "main" ? hull : slab} /></clipPath>
      </defs>

      <text x={-PAD + 7} y={H / 2} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle" transform={`rotate(-90 ${-PAD + 7} ${H / 2})`}>{labels.bow}</text>
      <text x={W + PAD - 7} y={H / 2} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle" transform={`rotate(90 ${W + PAD - 7} ${H / 2})`}>{labels.stern}</text>
      <text x={W / 2} y={-14} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle">{labels.port}</text>
      <text x={W / 2} y={H + 21} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle">{labels.starboard}</text>

      {/* 1 · colour under the drawing */}
      {deck === "main"
        ? <path d={hull} fill="url(#hullGrad)" stroke={INK} strokeWidth="1.1" filter="url(#hullShadow)" />
        : <><path d={hull} fill="none" stroke={INK_SOFT} strokeWidth=".7" strokeDasharray="3 3" opacity=".6" /><path d={slab} fill="url(#hullGrad)" stroke={INK} strokeWidth="1.1" filter="url(#hullShadow)" /></>}
      <path d={deck === "main" ? hull : slab} fill="url(#planks)" pointerEvents="none" />
      {amen.filter((a) => a.kind === "pool").map((a) => <rect key={a.id} x={sx(a.x)} y={sy(a.y)} width={sx(a.w)} height={sx(a.h)} fill="url(#poolGrad)" pointerEvents="none" />)}
      {amen.filter((a) => a.kind === "stage" || a.kind === "dj").map((a) => <rect key={a.id} x={sx(a.x)} y={sy(a.y)} width={sx(a.w)} height={sx(a.h)} rx="2" fill={a.kind === "dj" ? "#e3d8c2" : "#efe7d7"} pointerEvents="none" />)}
      {amen.filter((a) => a.kind === "bar").map((a) => <rect key={a.id} x={sx(a.x)} y={sy(a.y)} width={sx(a.w)} height={sx(a.h)} rx={sx(a.r ?? 400)} fill="#dcc399" pointerEvents="none" />)}
      {units.map((u) => <rect key={u.id} x={sx(u.x)} y={sy(u.y)} width={sx(u.w)} height={sx(u.h)} rx={u.r ? sx(u.r) : 1.5} fill={tint[u.type] ?? "#e8d6b2"} fillOpacity=".55" pointerEvents="none" />)}

      {/* 2 · the EPJ linework, exactly as drawn */}
      <image href={deck === "main" ? "/map/main-deck.svg" : "/map/upper-deck.svg"} x="0" y="0" width={W} height={H} clipPath="url(#hullClip)" pointerEvents="none" />

      {/* 3 · masks over back of house (kitchen, stores, service, staff rooms) */}
      {amen.filter((a) => a.kind === "boh").map((a) => (
        <g key={a.id} pointerEvents="none">
          <rect x={sx(a.x)} y={sy(a.y)} width={sx(a.w)} height={sx(a.h)} rx="1.5" fill="#ece5d7" />
          <rect x={sx(a.x)} y={sy(a.y)} width={sx(a.w)} height={sx(a.h)} rx="1.5" fill="url(#hatch)" stroke="#bfb3a0" strokeWidth=".5" />
          {a.name[L] && <text x={sx(a.x) + sx(a.w) / 2} y={sy(a.y) + sx(a.h) / 2 + 2} fontSize="5" letterSpacing="1.2" fill={INK_SOFT} style={F} textAnchor="middle">{a.name[L].toUpperCase()}</text>}
        </g>
      ))}

      {/* 4 · names on amenities */}
      {amen.filter((a) => ["pool", "stage", "bar", "restroom", "salon", "label", "dj", "stairs"].includes(a.kind) && a.name[L]).map((a) => {
        const x = sx(a.x), y = sy(a.y), w = sx(a.w), h = sx(a.h), nm = a.name[L].toUpperCase();
        const big = a.kind === "pool" || a.kind === "stage" || a.kind === "label";
        const yy = a.kind === "stage" ? y + h - 6 : a.kind === "restroom" || a.kind === "salon" ? y + h - 4 : y + h / 2 + 2;
        return <text key={a.id} x={x + w / 2} y={yy} fontSize={big ? 6.5 : 4.6} letterSpacing={big ? 2.4 : 1} fill={a.kind === "pool" ? "#2f6b74" : INK_SOFT} style={F} textAnchor="middle" pointerEvents="none" opacity={a.kind === "pool" ? 1 : 0.9}>{nm}</text>;
      })}
      {amen.filter((a) => a.kind === "arrival").map((a) => {
        const x = sx(a.x), y = sy(a.y), w = sx(a.w), h = sx(a.h), cx = x + w / 2, cy = y + h / 2, top = a.y < 7000;
        const caption = L === "ar" ? "القارب المكوكي · الوصول والمغادرة" : "SHUTTLE · ARRIVAL & DEPARTURE";
        return (
          <g key={a.id} pointerEvents="none">
            <rect x={x} y={y} width={w} height={h} rx="1.2" fill="#dbe7ea" stroke="#7fa3ab" strokeWidth=".5" />
            {/* small boat glyph + arrow */}
            <path d={`M${cx - 6},${cy + 1.5} h12 l-2,2.6 h-8 z`} fill="#2f6b74" />
            <path d={`M${cx - 1},${cy + 1.5} v-5 l4,5`} fill="none" stroke="#2f6b74" strokeWidth=".7" />
            <text x={cx} y={top ? y + h + 5 : y - 2.5} fontSize="3.6" letterSpacing="1" fill="#2f6b74" style={F} textAnchor="middle">{caption}</text>
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
              ? <circle className={`seat ${u.type} ${st}`} data-seat={u.id} cx={w / 2} cy={h / 2} r={w / 2 + 2} fill="transparent" stroke={INK} strokeWidth=".55" />
              : <rect className={`seat ${u.type} ${st}`} data-seat={u.id} x="-0.6" y="-0.6" width={w + 1.2} height={h + 1.2} rx={u.r ? sx(u.r) : 1.5} fill="transparent" stroke={INK} strokeWidth=".55" />}
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
