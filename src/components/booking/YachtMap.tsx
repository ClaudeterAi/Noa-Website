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

/* ---------- furniture symbols, drawn the way the EPJ plan draws them (origin = unit top-left, SVG units) ---------- */
function Cabana({ w, h }: { w: number; h: number }) {
  const pad = 3.2, sofaH = h * 0.26, chair = Math.min(w * 0.2, 10);
  return (
    <g pointerEvents="none">
      <rect x={1.2} y={1.2} width={w - 2.4} height={h - 2.4} rx="1.5" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth=".6" />
      <rect x={pad} y={pad} width={w - pad * 2} height={sofaH} rx="1.4" fill="#f6efe2" stroke={INK} strokeWidth=".45" />
      <rect x={pad + 1.5} y={pad + 1.3} width={(w - pad * 2) / 2 - 2.2} height={sofaH * 0.42} rx="1" fill="#fff" stroke={INK} strokeWidth=".3" />
      <rect x={pad + (w - pad * 2) / 2 + 0.7} y={pad + 1.3} width={(w - pad * 2) / 2 - 2.2} height={sofaH * 0.42} rx="1" fill="#fff" stroke={INK} strokeWidth=".3" />
      <circle cx={w / 2} cy={h * 0.62} r={Math.min(w, h) * 0.11} fill="#e9d9bd" stroke={INK} strokeWidth=".45" />
      <rect x={pad + 1} y={h * 0.52} width={chair} height={chair} rx="2.2" fill="#f6efe2" stroke={INK} strokeWidth=".45" />
      <rect x={w - pad - 1 - chair} y={h * 0.52} width={chair} height={chair} rx="2.2" fill="#f6efe2" stroke={INK} strokeWidth=".45" />
      <circle cx={pad + 2} cy={h - pad - 1.5} r="1.6" fill="#b7c7a3" stroke="#6f7f5c" strokeWidth=".35" />
      <circle cx={w - pad - 2} cy={h - pad - 1.5} r="1.6" fill="#b7c7a3" stroke="#6f7f5c" strokeWidth=".35" />
    </g>
  );
}
function Lounge({ w, h }: { w: number; h: number }) {
  const cx = w / 2, baseY = h * 0.24, r = w * 0.44;
  const arc = `M${cx - r},${baseY} A${r},${r} 0 0 0 ${cx + r},${baseY}`;
  return (
    <g pointerEvents="none">
      <path d={arc} fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" opacity=".08" transform="translate(0 1)" />
      <path d={arc} fill="none" stroke="#f6efe2" strokeWidth="7" strokeLinecap="round" />
      <path d={arc} fill="none" stroke={INK} strokeWidth=".45" strokeLinecap="round" opacity=".8" />
      {[-0.26, 0, 0.26].map((k, i) => <circle key={i} cx={cx + k * w} cy={h * 0.56} r="3.2" fill="#e9d9bd" stroke={INK} strokeWidth=".45" />)}
      {[-0.4, -0.13, 0.13, 0.4].map((k, i) => <circle key={i} cx={cx + k * w} cy={h * 0.8} r="1.9" fill="#f6efe2" stroke={INK} strokeWidth=".4" />)}
    </g>
  );
}
function Daybed({ w, h }: { w: number; h: number }) {
  return (
    <g pointerEvents="none">
      <rect x={1.4} y={1.4} width={w - 2.8} height={h - 2.8} rx="1.6" fill="#f8f2e6" stroke={INK} strokeWidth=".45" />
      <rect x={3} y={3} width={(w - 6) / 2 - 0.8} height={h * 0.26} rx="1" fill="#fff" stroke={INK} strokeWidth=".3" />
      <rect x={w / 2 + 0.8} y={3} width={(w - 6) / 2 - 0.8} height={h * 0.26} rx="1" fill="#fff" stroke={INK} strokeWidth=".3" />
      <line x1={3} y1={h * 0.58} x2={w - 3} y2={h * 0.58} stroke={INK} strokeWidth=".3" opacity=".5" />
    </g>
  );
}
function Lounger({ w, h }: { w: number; h: number }) {
  return (
    <g pointerEvents="none">
      <rect x={1} y={1} width={w - 2} height={h - 2} rx="2" fill="#f8f2e6" stroke={INK} strokeWidth=".4" />
      <rect x={2} y={2} width={w * 0.3} height={h - 4} rx="1.4" fill="#fff" stroke={INK} strokeWidth=".3" />
      <line x1={w * 0.33} y1={2} x2={w * 0.33} y2={h - 2} stroke={INK} strokeWidth=".3" opacity=".5" />
    </g>
  );
}
function TableRound({ w, h, chairs }: { w: number; h: number; chairs: number }) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.3;
  return (
    <g pointerEvents="none">
      <circle cx={cx} cy={cy} r={r} fill="#e9d9bd" stroke={INK} strokeWidth=".45" />
      <circle cx={cx} cy={cy} r={r * 0.45} fill="none" stroke={INK} strokeWidth=".25" opacity=".5" />
      {Array.from({ length: chairs }).map((_, i) => { const a = (i / chairs) * Math.PI * 2 - Math.PI / 2; return <circle key={i} cx={cx + Math.cos(a) * (r + 2.4)} cy={cy + Math.sin(a) * (r + 2.4)} r="1.5" fill="#f6efe2" stroke={INK} strokeWidth=".35" />; })}
    </g>
  );
}
function VipBooth({ w, h }: { w: number; h: number }) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 1;
  const arc = `M${cx},${cy - r} A${r},${r} 0 0 1 ${cx},${cy + r}`;
  return (
    <g pointerEvents="none">
      <path d={arc} fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" opacity=".08" transform="translate(0 1)" />
      <path d={arc} fill="none" stroke="#f6efe2" strokeWidth="7" strokeLinecap="round" />
      <path d={arc} fill="none" stroke={INK} strokeWidth=".45" strokeLinecap="round" />
      <circle cx={cx - 3} cy={cy} r={r * 0.34} fill="#e9d9bd" stroke={INK} strokeWidth=".45" />
      <circle cx={cx - 3} cy={cy} r={r * 0.16} fill="none" stroke={INK} strokeWidth=".3" opacity=".6" />
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
  const x = s(a.x), y = s(a.y), w = s(a.w), h = s(a.h), r = s(a.r ?? 1000), cx = x + w / 2, cy = y + h / 2, stools = 10;
  return (
    <g pointerEvents="none" filter="url(#lift)">
      <rect x={x} y={y} width={w} height={h} rx={r} fill="url(#barGrad)" stroke={INK} strokeWidth=".55" />
      <rect x={x + 7} y={y + 7} width={w - 14} height={h - 14} rx={Math.max(2, r - 7)} fill="#f6efe2" stroke={INK} strokeWidth=".4" />
      {Array.from({ length: stools }).map((_, i) => { const t = (i / stools) * Math.PI * 2; return <circle key={i} cx={cx + Math.cos(t) * (w / 2 + 3.2)} cy={cy + Math.sin(t) * (h / 2 + 3.2)} r="1.4" fill="#f6efe2" stroke={INK} strokeWidth=".35" />; })}
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
  const hull = `M${s(2600)},0 H${W - s(1200)} a${s(1200)},${s(1200)} 0 0 1 ${s(1200)},${s(1200)} V${H - s(1200)} a${s(1200)},${s(1200)} 0 0 1 -${s(1200)},${s(1200)} H${s(2600)} Q0,${H / 2} ${s(2600)},0 Z`;
  const upperX = s(29300);
  const slab = `M${upperX},0 H${W - s(1200)} a${s(1200)},${s(1200)} 0 0 1 ${s(1200)},${s(1200)} V${H - s(1200)} a${s(1200)},${s(1200)} 0 0 1 -${s(1200)},${s(1200)} H${upperX} Z`;
  const fillFor = (u: BoatUnit) => ({ cabana: "url(#cabFabric)", "upper-cabana": "url(#cabFabric)", lounge: "url(#loungeFabric)", "vip-booth": "url(#vipFabric)", daybed: "url(#linen)", sunbed: "url(#linen)", table: "#f1e8d8", alfresco: "#f1e8d8" }[u.type] ?? LINEN);
  const Symbol = ({ u, w, h }: { u: BoatUnit; w: number; h: number }) => {
    switch (u.type) {
      case "cabana": case "upper-cabana": return <Cabana w={w} h={h} />;
      case "lounge": return <Lounge w={w} h={h} />;
      case "daybed": return <Daybed w={w} h={h} />;
      case "sunbed": return <Lounger w={w} h={h} />;
      case "table": case "alfresco": return <TableRound w={w} h={h} chairs={4} />;
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

      <text x={-PAD + 6} y={H / 2} fontSize="6" letterSpacing="2.4" fill={INK_SOFT} style={F} textAnchor="middle" transform={`rotate(-90 ${-PAD + 6} ${H / 2})`}>{labels.bow}</text>
      <text x={W + PAD - 6} y={H / 2} fontSize="6" letterSpacing="2.4" fill={INK_SOFT} style={F} textAnchor="middle" transform={`rotate(90 ${W + PAD - 6} ${H / 2})`}>{labels.stern}</text>
      <text x={W / 2} y={-14} fontSize="6" letterSpacing="2.4" fill={INK_SOFT} style={F} textAnchor="middle">{labels.port}</text>
      <text x={W / 2} y={H + 19} fontSize="6" letterSpacing="2.4" fill={INK_SOFT} style={F} textAnchor="middle">{labels.starboard}</text>

      {deck === "main" ? (
        <g><path d={hull} fill="url(#hullGrad)" stroke={INK} strokeWidth="1.1" filter="url(#hullShadow)" /><path d={hull} fill="url(#planks)" pointerEvents="none" /></g>
      ) : (
        <g><path d={hull} fill="none" stroke={INK_SOFT} strokeWidth=".7" strokeDasharray="3 3" opacity=".7" /><path d={slab} fill="url(#hullGrad)" stroke={INK} strokeWidth="1.1" filter="url(#hullShadow)" /><path d={slab} fill="url(#planks)" pointerEvents="none" /></g>
      )}

      {amen.map((a) => {
        const x = s(a.x), y = s(a.y), w = s(a.w), h = s(a.h), cx = x + w / 2, cy = y + h / 2, nm = a.name[L].toUpperCase();
        const small = <text x={cx} y={cy + 1.6} fontSize="3.6" letterSpacing=".9" fill={INK_SOFT} style={F} textAnchor="middle" pointerEvents="none">{nm}</text>;
        switch (a.kind) {
          case "pool": return <g key={a.id}><Pool a={a} /><text x={cx} y={cy + 2} fontSize="5.4" letterSpacing="2.2" fill="#2f6b74" style={F} textAnchor="middle" pointerEvents="none">{nm}</text></g>;
          case "stage": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="2" fill="url(#stageGrad)" stroke={INK_SOFT} strokeWidth=".6" /><rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx="1.5" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth=".5" strokeDasharray="2 2" /><text x={cx} y={y + h - 5} fontSize="5" letterSpacing="2.2" fill={INK_SOFT} style={F} textAnchor="middle">{nm}</text></g>;
          case "dj": return <g key={a.id} pointerEvents="none" filter="url(#lift)"><rect x={x} y={y} width={w} height={h} rx="1.4" fill="#cdbfa2" stroke={INK} strokeWidth=".5" />{[0.25, 0.5, 0.75].map((k) => <circle key={k} cx={x + w * k} cy={cy} r="2.2" fill="#f6efe2" stroke={INK} strokeWidth=".4" />)}<text x={cx} y={y - 2} fontSize="3.8" letterSpacing="1.4" fill={INK} style={F} textAnchor="middle">{nm}</text></g>;
          case "bar": return <g key={a.id}><Bar a={a} /><text x={cx} y={cy + 1.6} fontSize="4.2" letterSpacing="1.6" fill={INK} style={F} textAnchor="middle" pointerEvents="none">{nm}</text></g>;
          case "stairs": return <Stairs key={a.id} a={a} />;
          case "arrival": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="#dbe7ea" stroke="#7fa3ab" strokeWidth=".5" /><path d={`M${cx - 4},${cy} h8 m-3,-3 l3,3 l-3,3`} fill="none" stroke="#2f6b74" strokeWidth=".9" /></g>;
          case "boh": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="#ece5d7" stroke="#b9ae9c" strokeWidth=".5" /><rect x={x} y={y} width={w} height={h} rx="1.2" fill="url(#hatch)" />{small}</g>;
          case "canopy": return <g key={a.id} pointerEvents="none"><rect x={x} y={y} width={w} height={h} rx="1.2" fill="#ece6d9" stroke="#c4b9a4" strokeWidth=".5" strokeDasharray="2.5 2" />{small}</g>;
          case "label": return <g key={a.id} pointerEvents="none">{a.id === "void" && <rect x={x} y={y} width={w} height={h} rx="2" fill="none" stroke={INK_SOFT} strokeWidth=".5" strokeDasharray="3 2.5" />}{small}</g>;
          case "restroom": return <g key={a.id}><Room a={a} icon={<g><circle cx={cx} cy={cy - 4} r="1.6" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><path d={`M${cx - 3},${cy + 3.5} a3,3 0 0 1 6,0`} fill="none" stroke={INK_SOFT} strokeWidth=".5" /></g>} /><text x={cx} y={y + h - 3.5} fontSize="3.4" letterSpacing=".8" fill={INK_SOFT} style={F} textAnchor="middle" pointerEvents="none">{nm}</text></g>;
          case "salon": return <g key={a.id}><Room a={a} icon={<g><rect x={cx - 7} y={cy - 6} width="5" height="5" rx="1.2" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><rect x={cx + 2} y={cy - 6} width="5" height="5" rx="1.2" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><circle cx={cx - 4.5} cy={cy + 3} r="1.4" fill="none" stroke={INK_SOFT} strokeWidth=".5" /><circle cx={cx + 4.5} cy={cy + 3} r="1.4" fill="none" stroke={INK_SOFT} strokeWidth=".5" /></g>} /><text x={cx} y={y + h - 3.5} fontSize="3.2" letterSpacing=".7" fill={INK_SOFT} style={F} textAnchor="middle" pointerEvents="none">{nm}</text></g>;
          default: return null;
        }
      })}

      {units.map((u) => {
        const x = s(u.x), y = s(u.y), w = s(u.w), h = s(u.h), st = stateOf(u.id), round = !!u.r && u.r >= u.w / 2;
        const lifted = u.type === "cabana" || u.type === "upper-cabana" || u.type === "lounge" || u.type === "vip-booth";
        const chipW = u.label.length > 2 ? 10 : 8;
        return (
          <g key={u.id} className={`seat-g ${st}`} transform={`translate(${x} ${y})`} filter={lifted ? "url(#lift)" : undefined}>
            {round
              ? <circle className={`seat ${u.type} ${st}`} data-seat={u.id} cx={w / 2} cy={h / 2} r={w / 2} fill={fillFor(u)} stroke={INK} strokeWidth=".5" />
              : <rect className={`seat ${u.type} ${st}`} data-seat={u.id} x="0" y="0" width={w} height={h} rx={u.r ? s(u.r) : 2} fill={fillFor(u)} stroke={INK} strokeWidth=".5" />}
            <Symbol u={u} w={w} h={h} />
            <g pointerEvents="none" transform={round ? `translate(${w / 2 - chipW / 2} ${h / 2 + 5.5})` : `translate(2 2)`}>
              <rect width={chipW} height="5.2" rx="1" fill="#fff" fillOpacity=".92" stroke={INK} strokeWidth=".3" />
              <text x={chipW / 2} y="3.9" fontSize="3.6" letterSpacing=".3" fill={INK} style={F} textAnchor="middle" fontWeight="600">{u.label}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
