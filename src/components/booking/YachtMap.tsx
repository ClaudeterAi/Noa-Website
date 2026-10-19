"use client";

import type { MouseEvent, ReactNode } from "react";
import { BOAT_AMENITIES, BOAT_UNITS, HULL, SCALE, type Amenity, type BoatUnit, type Deck } from "./boat";

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

const s = (mm: number) => mm / SCALE;
const INK = "#5a4a36", INK_SOFT = "#8a7a63", LINEN = "#f4ecdd";
const F = { fontFamily: "var(--font-sans)" } as const;

/* ---------- furniture symbols traced from the EPJ plan (origin = unit top-left, SVG units; `open` = which side faces the guests) ---------- */
function Cabana({ w, h, open }: { w: number; h: number; open: "top" | "bottom" }) {
  // two long sofas along the side walls (three cushions each, back cushions to the wall), a long low table between them,
  // a round pouf at the closed end, two round poufs at the open end, planters + curtain line along the rail
  const pad = 2.2, sofaW = w * 0.24, sofaY = h * 0.2, sofaH = h * 0.56, cush = sofaH / 3, tableW = w * 0.22, tableH = h * 0.42;
  const flip = open === "top";
  const Y = (y: number, hh = 0) => (flip ? h - y - hh : y);
  return (
    <g pointerEvents="none">
      {/* rail side: planter + curtain */}
      <rect x={pad} y={Y(0.6, 2.2)} width={w - pad * 2} height={2.2} fill="#b7c7a3" opacity=".8" />
      <path d={`M${pad + 1},${Y(4)} ${Array.from({ length: 7 }).map((_, i) => `q${(w - pad * 2 - 2) / 14},${flip ? -1.4 : 1.4} ${(w - pad * 2 - 2) / 7},0`).join(" ")}`} fill="none" stroke={INK} strokeWidth=".35" opacity=".6" />
      {/* sofas */}
      {[pad + 1.2, w - pad - 1.2 - sofaW].map((sx, k) => (
        <g key={k}>
          <rect x={sx} y={Y(sofaY, sofaH)} width={sofaW} height={sofaH} rx="1.4" fill="#f6efe2" stroke={INK} strokeWidth=".45" />
          {[0, 1, 2].map((c) => <rect key={c} x={sx + 0.8} y={Y(sofaY + c * cush + 0.6, cush - 1.2)} width={sofaW - 1.6} height={cush - 1.2} rx="1" fill="#fff" stroke={INK} strokeWidth=".25" opacity=".9" />)}
          <rect x={k === 0 ? sx - 0.2 : sx + sofaW - 1.4} y={Y(sofaY + 1, sofaH - 2)} width="1.6" height={sofaH - 2} rx=".6" fill="#efe6d4" stroke={INK} strokeWidth=".3" />
        </g>
      ))}
      {/* low table */}
      <rect x={w / 2 - tableW / 2} y={Y(h * 0.33, tableH)} width={tableW} height={tableH} rx="1" fill="#e9d9bd" stroke={INK} strokeWidth=".45" />
      <rect x={w / 2 - tableW / 2 + 1} y={Y(h * 0.33 + 1, tableH - 2)} width={tableW - 2} height={tableH - 2} rx=".6" fill="none" stroke={INK} strokeWidth=".25" opacity=".6" />
      {/* poufs: one at the closed end, two at the open end */}
      <circle cx={w / 2} cy={Y(h * 0.12)} r={Math.min(w, h) * 0.07} fill="#f6efe2" stroke={INK} strokeWidth=".4" />
      <circle cx={w * 0.2} cy={Y(h * 0.88)} r={Math.min(w, h) * 0.07} fill="#f6efe2" stroke={INK} strokeWidth=".4" />
      <circle cx={w * 0.8} cy={Y(h * 0.88)} r={Math.min(w, h) * 0.07} fill="#f6efe2" stroke={INK} strokeWidth=".4" />
    </g>
  );
}
function Lounge({ w, h, open }: { w: number; h: number; open: "top" | "bottom" }) {
  // scalloped sofa band along the rail (680 deep) that wraps the two ends, a row of four round tables, four poufs toward the floor
  const flip = open === "top", d = 13.6, pad = 2;
  const Y = (y: number) => (flip ? h - y : y);
  const scallops = 6, sw = (w - pad * 2) / scallops;
  const front = `M${pad},${Y(d)} ${Array.from({ length: scallops }).map(() => `q${sw / 2},${flip ? -4 : 4} ${sw},0`).join(" ")}`;
  return (
    <g pointerEvents="none">
      <rect x={pad} y={Y(0.6) - (flip ? 2.2 : 0)} width={w - pad * 2} height="2.2" fill="#b7c7a3" opacity=".8" />
      <path d={`M${pad},${Y(3)} V${Y(d)} ${front.slice(front.indexOf(" ") + 1)} V${Y(3)} Z`} fill="#f6efe2" stroke={INK} strokeWidth=".45" />
      {/* wrap-around ends: the sofa turns the corner and runs down each side */}
      <rect x={pad} y={Y(3) - (flip ? 22 : 0)} width={d * 0.78} height="22" rx="4" fill="#f6efe2" stroke={INK} strokeWidth=".45" />
      <rect x={w - pad - d * 0.78} y={Y(3) - (flip ? 22 : 0)} width={d * 0.78} height="22" rx="4" fill="#f6efe2" stroke={INK} strokeWidth=".45" />
      {[0.26, 0.42, 0.58, 0.74].map((k, i) => <circle key={i} cx={w * k} cy={Y(h * 0.5)} r="3.4" fill="#e9d9bd" stroke={INK} strokeWidth=".45" />)}
      {[0.26, 0.42, 0.58, 0.74].map((k, i) => <circle key={i} cx={w * k} cy={Y(h * 0.78)} r="2.4" fill="#f6efe2" stroke={INK} strokeWidth=".4" />)}
      <circle cx={pad + 6.5} cy={Y(h * 0.62)} r="3" fill="#e9d9bd" stroke={INK} strokeWidth=".45" />
      <circle cx={w - pad - 6.5} cy={Y(h * 0.62)} r="3" fill="#e9d9bd" stroke={INK} strokeWidth=".45" />
    </g>
  );
}
function Daybed({ w, h }: { w: number; h: number }) {
  // double mattress with a bolster at each end and a centre seam
  return (
    <g pointerEvents="none">
      <rect x={1.2} y={1.2} width={w - 2.4} height={h - 2.4} rx="2" fill="#f8f2e6" stroke={INK} strokeWidth=".45" />
      <rect x={3.2} y={2.6} width={w - 6.4} height="2.6" rx="1.3" fill="#fff" stroke={INK} strokeWidth=".3" />
      <rect x={3.2} y={h - 5.2} width={w - 6.4} height="2.6" rx="1.3" fill="#fff" stroke={INK} strokeWidth=".3" />
      <line x1={w / 2} y1={5.6} x2={w / 2} y2={h - 5.6} stroke={INK} strokeWidth=".3" opacity=".45" />
    </g>
  );
}
function Lounger({ w, h }: { w: number; h: number }) {
  // slatted backrest toward the rail, seat toward the pool
  const back = w * 0.34;
  return (
    <g pointerEvents="none">
      <rect x={0.8} y={0.8} width={w - 1.6} height={h - 1.6} rx="1.2" fill="#f8f2e6" stroke={INK} strokeWidth=".4" />
      {Array.from({ length: 7 }).map((_, i) => <line key={i} x1={1.8 + i * ((back - 2) / 6)} y1={1.8} x2={1.8 + i * ((back - 2) / 6)} y2={h - 1.8} stroke={INK} strokeWidth=".3" opacity=".55" />)}
      <rect x={back + 1} y={1.8} width={w - back - 2.8} height={h - 3.6} rx=".8" fill="#fff" stroke={INK} strokeWidth=".3" />
    </g>
  );
}
function HighTable({ w, h }: { w: number; h: number }) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 0.6;
  return (
    <g pointerEvents="none">
      <circle cx={cx} cy={cy} r={r} fill="#e9d9bd" stroke={INK} strokeWidth=".45" />
      <circle cx={cx} cy={cy} r={r * 0.72} fill="none" stroke={INK} strokeWidth=".3" opacity=".6" />
    </g>
  );
}
function AlfrescoGroup({ w, h, open }: { w: number; w2?: number; h: number; open: "top" | "bottom" }) {
  // sofa (three cushions) along the rail, a low table in front, three poufs toward the deck
  const flip = open === "top", sofaH = 15.2, tableH = 9.8;
  const Y = (y: number, hh = 0) => (flip ? h - y - hh : y);
  return (
    <g pointerEvents="none">
      <rect x={1} y={Y(0, 2.2)} width={w - 2} height="2.2" fill="#b7c7a3" opacity=".8" />
      <rect x={1} y={Y(3.4, sofaH)} width={w - 2} height={sofaH} rx="1.4" fill="#f6efe2" stroke={INK} strokeWidth=".45" />
      {[0, 1, 2].map((c) => <rect key={c} x={1.8 + c * ((w - 3.6) / 3)} y={Y(4.4, sofaH - 2)} width={(w - 3.6) / 3 - 0.8} height={sofaH - 2} rx="1" fill="#fff" stroke={INK} strokeWidth=".25" opacity=".9" />)}
      <rect x={w / 2 - 12} y={Y(sofaH + 8, tableH)} width="24" height={tableH} rx="1" fill="#e9d9bd" stroke={INK} strokeWidth=".45" />
      {[0.22, 0.5, 0.78].map((k, i) => <circle key={i} cx={w * k} cy={Y(h - 6)} r="4.6" fill="#f6efe2" stroke={INK} strokeWidth=".4" />)}
    </g>
  );
}
function VipBooth({ w, h }: { w: number; h: number }) {
  // U-shaped sofa (740 deep) along the stern wall and both sides, low table in the middle, open toward the dance floor
  const d = 14.8;
  return (
    <g pointerEvents="none">
      <path d={`M${w - 1},${1} V${h - 1} H${w - 1 - d} V${d + 1} H${1} V${1} Z`} fill="#f6efe2" stroke={INK} strokeWidth=".45" />
      <path d={`M${w - 1},${h - 1} H${1} V${h - 1 - d} H${w - 1 - d}`} fill="#f6efe2" stroke={INK} strokeWidth=".45" />
      {[0.2, 0.5, 0.8].map((k, i) => <rect key={i} x={w - d - 0.3} y={h * k - 8} width={d - 1.4} height="16" rx="1" fill="#fff" stroke={INK} strokeWidth=".25" opacity=".9" />)}
      <rect x={w * 0.22} y={h / 2 - 5} width={24} height={10} rx="1" fill="#e9d9bd" stroke={INK} strokeWidth=".45" />
    </g>
  );
}

/* ---------- amenity drawings ---------- */
function Pool({ a }: { a: Amenity }) {
  const x = s(a.x), y = s(a.y), w = s(a.w), h = s(a.h);
  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={w} height={h} rx="1.6" fill="url(#poolGrad)" stroke="#8fb7bf" strokeWidth=".7" />
      <rect x={x + 1.2} y={y + 1.2} width={w - 2.4} height={h - 2.4} rx="1" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".5" />
      {[0.25, 0.5, 0.75].map((k) => <path key={k} d={`M${x + 4},${y + h * k} q${w / 8},-1.6 ${w / 4},0 t${w / 4},0 t${w / 4},0`} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth=".6" />)}
    </g>
  );
}
function Bar({ a }: { a: Amenity }) {
  const x = s(a.x), y = s(a.y), w = s(a.w), h = s(a.h), r = s(a.r ?? 500);
  return (
    <g pointerEvents="none" filter="url(#lift)">
      <rect x={x} y={y} width={w} height={h} rx={r} fill="url(#barGrad)" stroke={INK} strokeWidth=".55" />
      <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={Math.max(1.5, r - 6)} fill="#f6efe2" stroke={INK} strokeWidth=".4" />
    </g>
  );
}
function Stairs({ a }: { a: Amenity }) {
  const x = s(a.x), y = s(a.y), w = s(a.w), h = s(a.h), n = 8;
  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={w} height={h} rx="1" fill="#efe8da" stroke={INK_SOFT} strokeWidth=".5" />
      {Array.from({ length: n }).map((_, i) => <line key={i} x1={x + 1.5} y1={y + 2 + (i * (h - 4)) / (n - 1)} x2={x + w - 1.5} y2={y + 2 + (i * (h - 4)) / (n - 1)} stroke={INK_SOFT} strokeWidth=".45" />)}
    </g>
  );
}
function Room({ a, icon }: { a: Amenity; icon?: ReactNode }) {
  const x = s(a.x), y = s(a.y), w = s(a.w), h = s(a.h);
  return <g pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="#f1ebdf" stroke={INK_SOFT} strokeWidth=".5" />{icon}</g>;
}

export default function YachtMap({ labels, deck, taken, mine, reserved, closed, onSeatClick, onSeatMove, onSeatLeave }: Props) {
  const stateOf = (id: string) => (taken.has(id) ? "taken" : mine?.has(id) ? "mine" : closed?.has(id) ? "closed" : reserved?.has(id) ? "reserved" : "");
  const seatOf = (e: MouseEvent): string | null => (e.target as Element).closest?.("[data-seat]")?.getAttribute("data-seat") ?? null;
  const onClick = (e: MouseEvent) => { const id = seatOf(e); if (id && !taken.has(id)) onSeatClick(id); };
  const onMove = (e: MouseEvent) => { const id = seatOf(e); if (id && !taken.has(id)) onSeatMove?.(id, e); else onSeatLeave?.(); };
  const W = s(HULL.length), H = s(HULL.beam), PAD = 30, L = labels.locale;
  const units = BOAT_UNITS.filter((u) => u.deck === deck && u.w > 0);
  const amen = BOAT_AMENITIES.filter((a) => a.deck === deck);
  const R = s(HULL.corner);
  const hull = `M${R},0 H${W - R} a${R},${R} 0 0 1 ${R},${R} V${H - R} a${R},${R} 0 0 1 -${R},${R} H${R} a${R},${R} 0 0 1 -${R},-${R} V${R} a${R},${R} 0 0 1 ${R},-${R} Z`;
  const upperX = s(29300);
  const slab = `M${upperX},0 H${W - R} a${R},${R} 0 0 1 ${R},${R} V${H - R} a${R},${R} 0 0 1 -${R},${R} H${upperX} Z`;
  const fillFor = (u: BoatUnit) => ({ cabana: "url(#cabFabric)", "upper-cabana": "url(#cabFabric)", lounge: "url(#loungeFabric)", "vip-booth": "url(#vipFabric)", daybed: "url(#linen)", sunbed: "url(#linen)", table: "#f1e8d8", alfresco: "#f1e8d8" }[u.type] ?? LINEN);
  const Symbol = ({ u, w, h }: { u: BoatUnit; w: number; h: number }) => {
    const open: "top" | "bottom" = u.y + u.h / 2 < HULL.beam / 2 ? "bottom" : "top";   // port-side rows open toward the centre line
    switch (u.type) {
      case "cabana": case "upper-cabana": return <Cabana w={w} h={h} open={open} />;
      case "lounge": return <Lounge w={w} h={h} open={open} />;
      case "daybed": return <Daybed w={w} h={h} />;
      case "sunbed": return <Lounger w={w} h={h} />;
      case "table": return <HighTable w={w} h={h} />;
      case "alfresco": return <AlfrescoGroup w={w} h={h} open={open} />;
      case "vip-booth": return <VipBooth w={w} h={h} />;
      default: return null;
    }
  };

  return (
    <svg className="yacht-map" onClick={onClick} onMouseMove={onMove} onMouseLeave={() => onSeatLeave?.()} viewBox={`${-PAD} ${-PAD} ${W + PAD * 2} ${H + PAD * 2}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={deck === "main" ? labels.main : labels.upper}>
      <defs>
        <pattern id="planks" patternUnits="userSpaceOnUse" width="160" height="3.2"><line x1="0" y1="0" x2="160" y2="0" stroke="#d3c5ad" strokeWidth=".28" /><line x1="80" y1="0" x2="80" y2="3.2" stroke="#d3c5ad" strokeWidth=".22" /></pattern>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#a69a86" strokeWidth=".5" opacity=".5" /></pattern>
        <linearGradient id="poolGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#9fcbd4" /><stop offset=".6" stopColor="#bfdde3" /><stop offset="1" stopColor="#d6e9ed" /></linearGradient>
        <linearGradient id="stageGrad" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#eae2d3" /><stop offset="1" stopColor="#ddd3bf" /></linearGradient>
        <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d9bd8f" /><stop offset="1" stopColor="#c7a66f" /></linearGradient>
        <linearGradient id="cabFabric" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#dcb07c" /><stop offset="1" stopColor="#c99a66" /></linearGradient>
        <linearGradient id="loungeFabric" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d2a776" /><stop offset="1" stopColor="#bb8f5c" /></linearGradient>
        <linearGradient id="vipFabric" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c9a26e" /><stop offset="1" stopColor="#a67e4e" /></linearGradient>
        <linearGradient id="linen" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#efe4cf" /><stop offset="1" stopColor="#e4d5b9" /></linearGradient>
        <linearGradient id="hullGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f0e8d9" /><stop offset="1" stopColor="#e7dcc7" /></linearGradient>
        <filter id="lift" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy=".9" stdDeviation=".9" floodColor="#4a3a24" floodOpacity=".28" /></filter>
        <filter id="hullShadow" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#4a3a24" floodOpacity=".22" /></filter>
      </defs>

      <text x={-PAD + 6} y={H / 2} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle" transform={`rotate(-90 ${-PAD + 6} ${H / 2})`}>{labels.bow}</text>
      <text x={W + PAD - 6} y={H / 2} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle" transform={`rotate(90 ${W + PAD - 6} ${H / 2})`}>{labels.stern}</text>
      <text x={W / 2} y={-14} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle">{labels.port}</text>
      <text x={W / 2} y={H + 21} fontSize="7.5" letterSpacing="3" fill={INK_SOFT} style={F} textAnchor="middle">{labels.starboard}</text>

      {deck === "main" ? (
        <g><path d={hull} fill="url(#hullGrad)" stroke={INK} strokeWidth="1.1" filter="url(#hullShadow)" /><path d={hull} fill="url(#planks)" pointerEvents="none" /></g>
      ) : (
        <g><path d={hull} fill="none" stroke={INK_SOFT} strokeWidth=".7" strokeDasharray="3 3" opacity=".7" /><path d={slab} fill="url(#hullGrad)" stroke={INK} strokeWidth="1.1" filter="url(#hullShadow)" /><path d={slab} fill="url(#planks)" pointerEvents="none" /></g>
      )}

      {amen.map((a) => {
        const x = s(a.x), y = s(a.y), w = s(a.w), h = s(a.h), cx = x + w / 2, cy = y + h / 2, nm = a.name[L].toUpperCase();
        const small = nm ? <text x={cx} y={cy + 1.8} fontSize="4.8" letterSpacing="1" fill={INK_SOFT} style={F} textAnchor="middle" pointerEvents="none">{nm}</text> : null;
        switch (a.kind) {
          case "pool": return <g key={a.id}><Pool a={a} /><text x={cx} y={cy + 2.4} fontSize="7" letterSpacing="2.6" fill="#2f6b74" style={F} textAnchor="middle" pointerEvents="none">{nm}</text></g>;
          case "stage": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="3" fill="#f0e9db" stroke={INK_SOFT} strokeWidth=".6" strokeDasharray="4 2.5" /><text x={cx} y={y + h - 6} fontSize="6" letterSpacing="2.4" fill={INK_SOFT} style={F} textAnchor="middle">{nm}</text></g>;
          case "dj": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="3" fill="#e4dac6" stroke={INK} strokeWidth=".5" strokeDasharray="2.5 1.5" /><rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx="1.5" fill="none" stroke={INK} strokeWidth=".4" strokeDasharray="2 1.5" /><text x={cx} y={cy + 1.6} fontSize="4.4" letterSpacing="1.2" fill={INK} style={F} textAnchor="middle">{nm}</text></g>;
          case "bar": return <g key={a.id}><Bar a={a} /><text x={cx} y={cy + 2} fontSize="5.4" letterSpacing="1.8" fill={INK} style={F} textAnchor="middle" pointerEvents="none">{nm}</text></g>;
          case "stairs": return <Stairs key={a.id} a={a} />;
          case "arrival": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="#dbe7ea" stroke="#7fa3ab" strokeWidth=".5" /><path d={`M${cx - 4},${cy} h8 m-3,-3 l3,3 l-3,3`} fill="none" stroke="#2f6b74" strokeWidth=".9" /></g>;
          case "boh": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="#ece5d7" stroke="#b9ae9c" strokeWidth=".5" /><rect x={x} y={y} width={w} height={h} rx="1.2" fill="url(#hatch)" />{small}</g>;
          case "canopy": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="#ece6d9" stroke="#c4b9a4" strokeWidth=".5" strokeDasharray="2.5 2" />{small}</g>;
          case "label": return <g key={a.id} pointerEvents="none">
            {a.id === "void" && <rect x={x} y={y} width={w} height={h} rx="2" fill="none" stroke={INK_SOFT} strokeWidth=".5" strokeDasharray="3 2.5" />}
            {a.id.startsWith("parasol") && <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="#f6efe2" stroke={INK} strokeWidth=".45" />}
            {a.id === "vip-rail" && <path d={`M${x + w},${y} q-${w},${h / 2} 0,${h}`} fill="none" stroke={INK} strokeWidth=".9" strokeDasharray="2 1.2" />}
            {small}
          </g>;
          case "restroom": return <g key={a.id}><Room a={a} icon={<g><circle cx={cx} cy={cy - 4} r="1.6" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><path d={`M${cx - 3},${cy + 3.5} a3,3 0 0 1 6,0`} fill="none" stroke={INK_SOFT} strokeWidth=".5" /></g>} /><text x={cx} y={y + h - 3.5} fontSize="4.4" letterSpacing=".9" fill={INK_SOFT} style={F} textAnchor="middle" pointerEvents="none">{nm}</text></g>;
          case "salon": return <g key={a.id}><Room a={a} icon={<g><rect x={cx - 7} y={cy - 6} width="5" height="5" rx="1.2" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><rect x={cx + 2} y={cy - 6} width="5" height="5" rx="1.2" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><circle cx={cx - 4.5} cy={cy + 3} r="1.4" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><circle cx={cx + 4.5} cy={cy + 3} r="1.4" fill="none" stroke={INK_SOFT} strokeWidth=".5" /></g>} /><text x={cx} y={y + h - 3.5} fontSize="4.2" letterSpacing=".8" fill={INK_SOFT} style={F} textAnchor="middle" pointerEvents="none">{nm}</text></g>;
          default: return null;
        }
      })}

      {units.map((u) => {
        const x = s(u.x), y = s(u.y), w = s(u.w), h = s(u.h), st = stateOf(u.id), round = !!u.r && u.r >= u.w / 2;
        const lifted = u.type === "cabana" || u.type === "upper-cabana" || u.type === "lounge" || u.type === "vip-booth";
        const chipW = u.label.length > 2 ? 15 : 12, chipH = 7.6;
        return (
          <g key={u.id} className={`seat-g ${st}`} transform={`translate(${x} ${y})`} filter={lifted ? "url(#lift)" : undefined}>
            {round
              ? <circle className={`seat ${u.type} ${st}`} data-seat={u.id} cx={w / 2} cy={h / 2} r={w / 2} fill={fillFor(u)} stroke={INK} strokeWidth=".5" />
              : <rect className={`seat ${u.type} ${st}`} data-seat={u.id} x="0" y="0" width={w} height={h} rx={u.r ? s(u.r) : 2} fill={fillFor(u)} stroke={INK} strokeWidth=".5" />}
            <Symbol u={u} w={w} h={h} />
            <g pointerEvents="none" transform={round ? `translate(${w / 2 - chipW / 2} ${u.y + u.h / 2 < HULL.beam / 2 ? h + 1.5 : -chipH - 1.5})` : `translate(2 2)`}>
              <rect width={chipW} height={chipH} rx="1.4" fill="#fff" fillOpacity=".94" stroke={INK} strokeWidth=".35" />
              <text x={chipW / 2} y={chipH - 2.1} fontSize="5.2" letterSpacing=".3" fill={INK} style={F} textAnchor="middle" fontWeight="600">{u.label}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
