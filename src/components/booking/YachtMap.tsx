"use client";

import type { MouseEvent } from "react";
import { BOAT_AMENITIES, BOAT_UNITS, HULL, SCALE, type Deck } from "./boat";

export interface YachtLabels { bow: string; stern: string; port: string; starboard: string; main: string; upper: string; locale: "en" | "ar" }

interface Props {
  labels: YachtLabels;
  deck: Deck;
  /** unit ids that are booked or held by another guest */
  taken: ReadonlySet<string>;
  /** unit ids held by this guest (in the cart) */
  mine?: ReadonlySet<string>;
  /** VIP-priority units not yet released to this guest */
  reserved?: ReadonlySet<string>;
  /** unit types not on sale for this session's event */
  closed?: ReadonlySet<string>;
  onSeatClick: (id: string) => void;
  onSeatMove?: (id: string, e: MouseEvent) => void;
  onSeatLeave?: () => void;
}

const s = (mm: number) => mm / SCALE;

/**
 * THE NOA seat map, to scale from the Atelier EPJ detailed-design set (see boat.ts). One deck at a time;
 * interaction uses event delegation on the <svg>, so the booking engine's contract (data-seat ids,
 * seat/taken/mine/reserved/closed classes) is unchanged. Labels are plain SVG text in the site font.
 */
export default function YachtMap({ labels, deck, taken, mine, reserved, closed, onSeatClick, onSeatMove, onSeatLeave }: Props) {
  const sc = (base: string, id: string) => (taken.has(id) ? `${base} taken` : mine?.has(id) ? `${base} mine` : closed?.has(id) ? `${base} closed` : reserved?.has(id) ? `${base} reserved` : base);
  const seatOf = (e: MouseEvent): string | null => (e.target as Element).closest?.("[data-seat]")?.getAttribute("data-seat") ?? null;
  const onClick = (e: MouseEvent) => { const id = seatOf(e); if (id && !taken.has(id)) onSeatClick(id); };
  const onMove = (e: MouseEvent) => { const id = seatOf(e); if (id && !taken.has(id)) onSeatMove?.(id, e); else onSeatLeave?.(); };
  const W = s(HULL.length), H = s(HULL.beam), PAD = 26;
  const units = BOAT_UNITS.filter((u) => u.deck === deck && u.w > 0);
  const amen = BOAT_AMENITIES.filter((a) => a.deck === deck);
  const L = labels.locale;
  const font = { fontFamily: "var(--font-sans)" };

  return (
    <svg className="yacht-map" onClick={onClick} onMouseMove={onMove} onMouseLeave={() => onSeatLeave?.()} viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={deck === "main" ? labels.main : labels.upper}>
      <defs>
        <pattern id="deckwood" patternUnits="userSpaceOnUse" width="120" height="12"><line x1="0" y1="6" x2="120" y2="6" stroke="#d9cfbe" strokeWidth=".35" opacity=".8" /></pattern>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#8c8373" strokeWidth=".5" opacity=".45" /></pattern>
        <linearGradient id="pool" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#9fd0d6" /><stop offset="1" stopColor="#c9e4ea" /></linearGradient>
      </defs>

      {/* hull: full outline on the main deck; on the upper deck the structure covers the stern half, the bow is open sky over the pool */}
      {(() => { const hull = `M${s(2600)},0 H${W - s(1200)} a${s(1200)},${s(1200)} 0 0 1 ${s(1200)},${s(1200)} V${H - s(1200)} a${s(1200)},${s(1200)} 0 0 1 -${s(1200)},${s(1200)} H${s(2600)} Q0,${H / 2} ${s(2600)},0 Z`;
        const upperX = s(29300); const slab = `M${upperX},0 H${W - s(1200)} a${s(1200)},${s(1200)} 0 0 1 ${s(1200)},${s(1200)} V${H - s(1200)} a${s(1200)},${s(1200)} 0 0 1 -${s(1200)},${s(1200)} H${upperX} Z`;
        return deck === "main"
          ? <><path d={hull} fill="#f2ede4" stroke="#8c8373" strokeWidth="1.2" /><path d={hull} fill="url(#deckwood)" pointerEvents="none" /></>
          : <><path d={hull} fill="none" stroke="#b9b0a1" strokeWidth=".8" strokeDasharray="4 3" /><path d={slab} fill="#f2ede4" stroke="#8c8373" strokeWidth="1.2" /><path d={slab} fill="url(#deckwood)" pointerEvents="none" /></>;
      })()}
      {/* compass words */}
      <text x={-PAD + 4} y={H / 2 + 3} fontSize="7" letterSpacing="2" fill="#8c8373" style={font} transform={`rotate(-90 ${-PAD + 4} ${H / 2 + 3})`} textAnchor="middle">{labels.bow}</text>
      <text x={W + PAD - 4} y={H / 2 + 3} fontSize="7" letterSpacing="2" fill="#8c8373" style={font} transform={`rotate(90 ${W + PAD - 4} ${H / 2 + 3})`} textAnchor="middle">{labels.stern}</text>
      <text x={W / 2} y={-10} fontSize="7" letterSpacing="2" fill="#8c8373" style={font} textAnchor="middle">{labels.port}</text>
      <text x={W / 2} y={H + 16} fontSize="7" letterSpacing="2" fill="#8c8373" style={font} textAnchor="middle">{labels.starboard}</text>

      {/* amenities */}
      {amen.map((a) => {
        const x = s(a.x), y = s(a.y), w = s(a.w), h = s(a.h), r = a.r ? s(a.r) : 2, cx = x + w / 2, cy = y + h / 2, nm = a.name[L];
        const fill = { pool: "url(#pool)", stage: "#e6dfd1", bar: "#d8c7a6", label: "transparent", restroom: "#ece7dd", stairs: "#ece7dd", arrival: "#dce6e8", boh: "url(#hatch)", salon: "#ece7dd", canopy: "#e8e2d7", dj: "#cdbfa2" }[a.kind];
        const stroke = a.kind === "label" ? "none" : a.kind === "boh" ? "#b9b0a1" : "#b4a992";
        return (
          <g key={a.id} className={`amen amen-${a.kind}`} pointerEvents="none">
            <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth=".6" strokeDasharray={a.kind === "label" || a.kind === "canopy" ? "2 2" : undefined} />
            {a.kind === "stairs" && [0, 1, 2, 3, 4].map((i) => <line key={i} x1={x + 2} y1={y + 3 + i * ((h - 6) / 4)} x2={x + w - 2} y2={y + 3 + i * ((h - 6) / 4)} stroke="#b4a992" strokeWidth=".5" />)}
            {a.kind === "arrival" && <path d={`M${cx - 4},${cy} h8 m-3,-3 l3,3 l-3,3`} fill="none" stroke="#3b6c75" strokeWidth=".8" />}
            {a.kind !== "arrival" && <text x={cx} y={cy + (a.kind === "pool" || a.kind === "stage" ? 2 : 2)} fontSize={a.kind === "pool" || a.kind === "stage" ? 7 : 4.6} letterSpacing={a.kind === "pool" || a.kind === "stage" ? 2 : 1} fill={a.kind === "pool" ? "#2e6a74" : "#6f6553"} style={font} textAnchor="middle">{nm.toUpperCase()}</text>}
          </g>
        );
      })}

      {/* seats */}
      {units.map((u) => {
        const x = s(u.x), y = s(u.y), w = s(u.w), h = s(u.h), r = u.r ? s(u.r) : 1.5;
        const fill = { sunbed: "#ead8b8", daybed: "#e7d3ac", cabana: "#dcc9a2", lounge: "#d7c39a", table: "#e9dfca", "upper-cabana": "#d2bd92", "vip-booth": "#c9ad7a", alfresco: "#e4d6b8" }[u.type] ?? "#e6d8bb";
        return (
          <g key={u.id} className="seat-g">
            {u.r && u.r >= u.w / 2 ? (
              <circle className={sc(`seat ${u.type}`, u.id)} data-seat={u.id} cx={x + w / 2} cy={y + h / 2} r={w / 2} fill={fill} stroke="#7a6a4f" strokeWidth=".7" />
            ) : (
              <rect className={sc(`seat ${u.type}`, u.id)} data-seat={u.id} x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke="#7a6a4f" strokeWidth=".7" />
            )}
            {u.type === "cabana" || u.type === "upper-cabana" || u.type === "lounge" ? <rect x={x + 3} y={y + h * 0.3} width={w - 6} height={h * 0.26} rx="1" fill="none" stroke="#7a6a4f" strokeWidth=".4" opacity=".7" pointerEvents="none" /> : null}
            {u.type === "sunbed" || u.type === "daybed" ? <line x1={x + 2} y1={y + h * 0.5} x2={x + w - 2} y2={y + h * 0.5} stroke="#7a6a4f" strokeWidth=".35" opacity=".6" pointerEvents="none" /> : null}
            <text className="seat-lbl" x={x + w / 2} y={y + h / 2 + (h < 16 ? 1.6 : 2.2)} fontSize={h < 16 || w < 20 ? 4.2 : 6} letterSpacing=".6" fill="#3d3324" style={font} textAnchor="middle" pointerEvents="none">{u.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
