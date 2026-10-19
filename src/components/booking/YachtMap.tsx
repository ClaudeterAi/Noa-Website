"use client";

import type { MouseEvent } from "react";

export interface YachtLabels {
  upperDeck: string; stairs: string; sundeck: string; jacuzzi: string; vipLounge: string;
  balcony: string; dj: string; pool: string; poolSub: string; entry: string;
}

interface Props {
  labels: YachtLabels;
  /** unit ids that are booked (Day 2: booked OR held by another guest) */
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

/**
 * The 52-unit yacht plan, geometry ported verbatim from legacy-static/booking.html
 * (branch feat/two-decks). Interaction uses event delegation on the <svg>, so the
 * drawing itself stays a plain, editable SVG.
 */
export default function YachtMap({ labels, taken, mine, reserved, closed, onSeatClick, onSeatMove, onSeatLeave }: Props) {
  const sc = (base: string, id: string) => (taken.has(id) ? `${base} taken` : mine?.has(id) ? `${base} mine` : closed?.has(id) ? `${base} closed` : reserved?.has(id) ? `${base} reserved` : base);
  const seatOf = (e: MouseEvent): string | null =>
    (e.target as Element).closest?.("[data-seat]")?.getAttribute("data-seat") ?? null;
  const onClick = (e: MouseEvent) => { const id = seatOf(e); if (id && !taken.has(id)) onSeatClick(id); };
  const onMove = (e: MouseEvent) => { const id = seatOf(e); if (id && !taken.has(id)) onSeatMove?.(id, e); else onSeatLeave?.(); };
  const onLeave = () => onSeatLeave?.();
  return (
<svg className="yacht-map" onClick={onClick} onMouseMove={onMove} onMouseLeave={onLeave} viewBox="0 0 1400 1000" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Diagonal hatching for daybed stripes */}
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#1a1a1a" strokeWidth=".6" opacity=".55"/>
        </pattern>
        {/* Subtle deck-plank texture overlaid on the hull */}
        <pattern id="deckwood" patternUnits="userSpaceOnUse" width="180" height="34">
          <rect width="180" height="34" fill="transparent"/>
          <line x1="0"   y1="0"  x2="180" y2="0"  stroke="#d9cba8" strokeWidth=".4" opacity=".7"/>
          <line x1="0"   y1="17" x2="180" y2="17" stroke="#d9cba8" strokeWidth=".3" opacity=".5"/>
          <line x1="60"  y1="0"  x2="60"  y2="34" stroke="#d9cba8" strokeWidth=".25" opacity=".5"/>
          <line x1="140" y1="0"  x2="140" y2="34" stroke="#d9cba8" strokeWidth=".25" opacity=".5"/>
        </pattern>
        {/* Pool water gradient */}
        <linearGradient id="poolGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="#b3d4dc"/>
          <stop offset="55%"  stopColor="#cae2e9"/>
          <stop offset="100%" stopColor="#dceaee"/>
        </linearGradient>
        {/* Cabana inner shadow / linen feel */}
        <linearGradient id="cabFabric" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#dbac79"/>
          <stop offset="100%" stopColor="#c89865"/>
        </linearGradient>
        <linearGradient id="frontCabFabric" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#4a3d34"/>
          <stop offset="100%" stopColor="#2e2620"/>
        </linearGradient>
        {/* Jacuzzi water gradient */}
        <linearGradient id="jacuzziGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="#9ec5d0"/>
          <stop offset="100%" stopColor="#cfe2e8"/>
        </linearGradient>
        {/* VIP lounge fabric — darker, premium tone */}
        <linearGradient id="vipFabric" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#c4956c"/>
          <stop offset="100%" stopColor="#a87c52"/>
        </linearGradient>
      </defs>

      {/* ============================================================
           UPPER DECK — raised platform on top of the main yacht
           Drawn at y=20-310, sits above the main deck hull which
           begins at y=370 inside the main-deck transform group.
           ============================================================ */}
      <g className="upper-deck-strip">
        {/* "UPPER DECK" header */}
        <text x="700" y="22" fontFamily="Josefin Sans" fontSize="11" letterSpacing="6" textAnchor="middle" fill="#1a1a1a" pointerEvents="none">{labels.upperDeck}</text>

        {/* Raised platform — slightly different deck tone to read as elevated */}
        <rect x="100" y="30" width="1240" height="280" rx="14" fill="#f3e8c9" stroke="#1a1a1a" strokeWidth="1.5"/>
        <rect x="100" y="30" width="1240" height="280" rx="14" fill="url(#deckwood)" opacity=".55" pointerEvents="none"/>
        {/* Drop-shadow lines under the platform to suggest elevation */}
        <line x1="106" y1="316" x2="1334" y2="316" stroke="#1a1a1a" strokeWidth="1.2" opacity=".4" pointerEvents="none"/>
        <line x1="110" y1="320" x2="1330" y2="320" stroke="#1a1a1a" strokeWidth=".6" opacity=".25" pointerEvents="none"/>

        {/* STAIRS at left edge */}
        <g pointerEvents="none">
          <rect x="130" y="80" width="65" height="180" rx="3" fill="#f5ecd9" stroke="#1a1a1a" strokeWidth=".8"/>
          <line x1="135" y1="100" x2="190" y2="100" stroke="#8a7c66" strokeWidth=".6"/>
          <line x1="135" y1="120" x2="190" y2="120" stroke="#8a7c66" strokeWidth=".6"/>
          <line x1="135" y1="140" x2="190" y2="140" stroke="#8a7c66" strokeWidth=".6"/>
          <line x1="135" y1="160" x2="190" y2="160" stroke="#8a7c66" strokeWidth=".6"/>
          <line x1="135" y1="180" x2="190" y2="180" stroke="#8a7c66" strokeWidth=".6"/>
          <line x1="135" y1="200" x2="190" y2="200" stroke="#8a7c66" strokeWidth=".6"/>
          <line x1="135" y1="220" x2="190" y2="220" stroke="#8a7c66" strokeWidth=".6"/>
          <line x1="135" y1="240" x2="190" y2="240" stroke="#8a7c66" strokeWidth=".6"/>
          <text x="162" y="290" textAnchor="middle" fontFamily="Josefin Sans" fontSize="7" letterSpacing="2" fill="#8a7c66">{labels.stairs}</text>
        </g>

        {/* SUNDECK — 6 sunbeds in a row across the top */}
        <g>
          <text x="465" y="74" fontFamily="Josefin Sans" fontSize="9" letterSpacing="4" textAnchor="middle" fill="#8a7c66" pointerEvents="none">{labels.sundeck}</text>
          <rect className={sc("seat sunbed", "sunbed-1")} data-seat="sunbed-1" x="220" y="85" width="75" height="55" rx="4" fill="#ead8b8"/>
          <rect x="220" y="85" width="75" height="55" rx="4" fill="url(#hatch)" pointerEvents="none" opacity=".55"/>
          <text className="seat-lbl sm" x="257" y="118" pointerEvents="none">S1</text>

          <rect className={sc("seat sunbed", "sunbed-2")} data-seat="sunbed-2" x="305" y="85" width="75" height="55" rx="4" fill="#ead8b8"/>
          <rect x="305" y="85" width="75" height="55" rx="4" fill="url(#hatch)" pointerEvents="none" opacity=".55"/>
          <text className="seat-lbl sm" x="342" y="118" pointerEvents="none">S2</text>

          <rect className={sc("seat sunbed", "sunbed-3")} data-seat="sunbed-3" x="390" y="85" width="75" height="55" rx="4" fill="#ead8b8"/>
          <rect x="390" y="85" width="75" height="55" rx="4" fill="url(#hatch)" pointerEvents="none" opacity=".55"/>
          <text className="seat-lbl sm" x="427" y="118" pointerEvents="none">S3</text>

          <rect className={sc("seat sunbed", "sunbed-4")} data-seat="sunbed-4" x="475" y="85" width="75" height="55" rx="4" fill="#ead8b8"/>
          <rect x="475" y="85" width="75" height="55" rx="4" fill="url(#hatch)" pointerEvents="none" opacity=".55"/>
          <text className="seat-lbl sm" x="512" y="118" pointerEvents="none">S4</text>

          <rect className={sc("seat sunbed", "sunbed-5")} data-seat="sunbed-5" x="560" y="85" width="75" height="55" rx="4" fill="#ead8b8"/>
          <rect x="560" y="85" width="75" height="55" rx="4" fill="url(#hatch)" pointerEvents="none" opacity=".55"/>
          <text className="seat-lbl sm" x="597" y="118" pointerEvents="none">S5</text>

          <rect className={sc("seat sunbed", "sunbed-6")} data-seat="sunbed-6" x="645" y="85" width="75" height="55" rx="4" fill="#ead8b8"/>
          <rect x="645" y="85" width="75" height="55" rx="4" fill="url(#hatch)" pointerEvents="none" opacity=".55"/>
          <text className="seat-lbl sm" x="682" y="118" pointerEvents="none">S6</text>
        </g>

        {/* JACUZZI — oval hot tub in middle-left */}
        <g>
          <text x="360" y="170" fontFamily="Josefin Sans" fontSize="10" letterSpacing="5" textAnchor="middle" fill="#8a7c66" pointerEvents="none">{labels.jacuzzi}</text>
          <ellipse className={sc("seat jacuzzi", "jacuzzi-1")} data-seat="jacuzzi-1" cx="360" cy="225" rx="135" ry="48" fill="url(#jacuzziGrad)" stroke="#1a1a1a" strokeWidth="1.2"/>
          <ellipse cx="360" cy="225" rx="123" ry="36" fill="#dceaee" stroke="#7fb1bf" strokeWidth=".5" opacity=".75" pointerEvents="none"/>
          <g pointerEvents="none" stroke="#7fb1bf" strokeWidth=".5" fill="none" opacity=".5">
            <circle cx="310" cy="220" r="2.5"/>
            <circle cx="350" cy="240" r="2"/>
            <circle cx="380" cy="215" r="2.5"/>
            <circle cx="410" cy="235" r="2"/>
            <circle cx="330" cy="245" r="2"/>
          </g>
        </g>

        {/* VIP LOUNGES — 2 premium lounges centre-right */}
        <g>
          <text x="615" y="170" fontFamily="Josefin Sans" fontSize="10" letterSpacing="5" textAnchor="middle" fill="#8a7c66" pointerEvents="none">{labels.vipLounge}</text>
          <rect className={sc("seat vip-lounge", "vip-lounge-1")} data-seat="vip-lounge-1" x="540" y="185" width="100" height="95" rx="5" fill="url(#vipFabric)"/>
          <line x1="540" y1="200" x2="640" y2="200" stroke="#1a1a1a" strokeWidth=".5" opacity=".5" pointerEvents="none"/>
          <line x1="540" y1="265" x2="640" y2="265" stroke="#1a1a1a" strokeWidth=".5" opacity=".5" pointerEvents="none"/>
          <text className="seat-lbl light sm" x="590" y="240" pointerEvents="none">V1</text>

          <rect className={sc("seat vip-lounge", "vip-lounge-2")} data-seat="vip-lounge-2" x="655" y="185" width="100" height="95" rx="5" fill="url(#vipFabric)"/>
          <line x1="655" y1="200" x2="755" y2="200" stroke="#1a1a1a" strokeWidth=".5" opacity=".5" pointerEvents="none"/>
          <line x1="655" y1="265" x2="755" y2="265" stroke="#1a1a1a" strokeWidth=".5" opacity=".5" pointerEvents="none"/>
          <text className="seat-lbl light sm" x="705" y="240" pointerEvents="none">V2</text>
        </g>

        {/* BALCONY — 5 sofas along the right side of the platform */}
        <g>
          <text x="1020" y="170" fontFamily="Josefin Sans" fontSize="10" letterSpacing="5" textAnchor="middle" fill="#8a7c66" pointerEvents="none">{labels.balcony}</text>
          <rect className={sc("seat balcony-sofa", "balcony-1")} data-seat="balcony-1" x="800" y="185" width="85" height="95" rx="5" fill="#7ba1a3"/>
          <line x1="800" y1="220" x2="885" y2="220" stroke="#1a1a1a" strokeWidth=".4" opacity=".4" pointerEvents="none"/>
          <text className="seat-lbl light sm" x="842" y="240" pointerEvents="none">B1</text>

          <rect className={sc("seat balcony-sofa", "balcony-2")} data-seat="balcony-2" x="895" y="185" width="85" height="95" rx="5" fill="#7ba1a3"/>
          <line x1="895" y1="220" x2="980" y2="220" stroke="#1a1a1a" strokeWidth=".4" opacity=".4" pointerEvents="none"/>
          <text className="seat-lbl light sm" x="937" y="240" pointerEvents="none">B2</text>

          <rect className={sc("seat balcony-sofa", "balcony-3")} data-seat="balcony-3" x="990" y="185" width="85" height="95" rx="5" fill="#7ba1a3"/>
          <line x1="990" y1="220" x2="1075" y2="220" stroke="#1a1a1a" strokeWidth=".4" opacity=".4" pointerEvents="none"/>
          <text className="seat-lbl light sm" x="1032" y="240" pointerEvents="none">B3</text>

          <rect className={sc("seat balcony-sofa", "balcony-4")} data-seat="balcony-4" x="1085" y="185" width="85" height="95" rx="5" fill="#7ba1a3"/>
          <line x1="1085" y1="220" x2="1170" y2="220" stroke="#1a1a1a" strokeWidth=".4" opacity=".4" pointerEvents="none"/>
          <text className="seat-lbl light sm" x="1127" y="240" pointerEvents="none">B4</text>

          <rect className={sc("seat balcony-sofa", "balcony-5")} data-seat="balcony-5" x="1180" y="185" width="85" height="95" rx="5" fill="#7ba1a3"/>
          <line x1="1180" y1="220" x2="1265" y2="220" stroke="#1a1a1a" strokeWidth=".4" opacity=".4" pointerEvents="none"/>
          <text className="seat-lbl light sm" x="1222" y="240" pointerEvents="none">B5</text>
        </g>
      </g>

      {/* ============================================================
           DECK DIVIDER — short stair indicators between upper & main
           ============================================================ */}
      <g className="deck-divider" pointerEvents="none">
        <path d="M 162 312 Q 162 332 142 350" stroke="#1a1a1a" strokeWidth=".8" fill="none" opacity=".45"/>
        <path d="M 182 312 Q 182 332 162 350" stroke="#1a1a1a" strokeWidth=".8" fill="none" opacity=".45"/>
      </g>

      {/* ============================================================
           MAIN DECK — full yacht hull, shifted down by 330px so the
           upper-deck strip sits above it. All original coordinates
           inside this group are preserved.
           ============================================================ */}
      <g className="main-deck" transform="translate(0, 330)">

      {/* ===== HULL ===== */}
      {/* Main deck (warm cream + wood texture) */}
      <path className="hull-fill" d="M 80 40 H 1100 Q 1300 40 1370 350 Q 1300 660 1100 660 H 80 Z"
            fill="#fdfaf3" stroke="#1a1a1a" strokeWidth="2"/>
      <path d="M 80 40 H 1100 Q 1300 40 1370 350 Q 1300 660 1100 660 H 80 Z"
            fill="url(#deckwood)" opacity=".65" pointerEvents="none"/>
      {/* Stern swim platform */}
      <path className="hull-fill" d="M 80 660 L 80 692 L 1100 692 L 1100 660"
            fill="#f3ede0" stroke="#1a1a1a" strokeWidth="1.4"/>
      {/* Swim ladder rungs (decorative) */}
      <g stroke="#1a1a1a" strokeWidth=".8" opacity=".6" pointerEvents="none">
        <line x1="280" y1="690" x2="280" y2="700"/>
        <line x1="300" y1="690" x2="300" y2="700"/>
        <line x1="320" y1="690" x2="320" y2="700"/>
      </g>
      {/* Inner deck rail line — depth */}
      <path d="M 100 60 H 1095 Q 1278 60 1350 350 Q 1278 640 1095 640 H 100 Z"
            fill="none" stroke="#1a1a1a" strokeWidth=".4" opacity=".3" pointerEvents="none"/>
      {/* Subtle walkway dividers */}
      <line x1="735" y1="80"  x2="735" y2="620" stroke="#1a1a1a" strokeDasharray="2 5" strokeWidth=".4" opacity=".25" pointerEvents="none"/>
      <line x1="995" y1="80"  x2="995" y2="620" stroke="#1a1a1a" strokeDasharray="2 5" strokeWidth=".4" opacity=".25" pointerEvents="none"/>

      {/* ===== SECTION LABELS — rendered last so they sit on top of pool/bar ===== */}

      {/* ===== TOP CABANAS ===== */}
      <g>
        <rect className={sc("seat cabana", "cabana-1")} data-seat="cabana-1" x="140" y="80" width="130" height="90" rx="5" fill="url(#cabFabric)"/>
        <line x1="140" y1="95" x2="270" y2="95" stroke="#a47e4d" strokeWidth=".5" opacity=".7" pointerEvents="none"/>
        <text className="seat-lbl" x="205" y="135" pointerEvents="none">C1</text>

        <rect className={sc("seat cabana", "cabana-2")} data-seat="cabana-2" x="290" y="80" width="130" height="90" rx="5" fill="url(#cabFabric)"/>
        <line x1="290" y1="95" x2="420" y2="95" stroke="#a47e4d" strokeWidth=".5" opacity=".7" pointerEvents="none"/>
        <text className="seat-lbl" x="355" y="135" pointerEvents="none">C2</text>

        <rect className={sc("seat cabana", "cabana-3")} data-seat="cabana-3" x="440" y="80" width="130" height="90" rx="5" fill="url(#cabFabric)"/>
        <line x1="440" y1="95" x2="570" y2="95" stroke="#a47e4d" strokeWidth=".5" opacity=".7" pointerEvents="none"/>
        <text className="seat-lbl" x="505" y="135" pointerEvents="none">C3</text>

        <rect className={sc("seat front-cabana", "front-cabana-1")} data-seat="front-cabana-1" x="590" y="80" width="130" height="90" rx="5" fill="url(#frontCabFabric)"/>
        <line x1="590" y1="95" x2="720" y2="95" stroke="#1a1a1a" strokeWidth=".5" opacity=".5" pointerEvents="none"/>
        <text className="seat-lbl light" x="655" y="135" pointerEvents="none">V1</text>
      </g>

      {/* ===== TOP DAYBEDS ===== */}
      <g>
        <rect className={sc("seat daybed", "daybed-t-1")} data-seat="daybed-t-1" x="200" y="200" width="70" height="50" rx="3" fill="#f1e7d2"/>
        <rect x="200" y="200" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".85"/>
        <text className="seat-lbl sm" x="235" y="232" pointerEvents="none">D1</text>

        <rect className={sc("seat daybed", "daybed-t-2")} data-seat="daybed-t-2" x="285" y="200" width="70" height="50" rx="3" fill="#f1e7d2"/>
        <rect x="285" y="200" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".85"/>
        <text className="seat-lbl sm" x="320" y="232" pointerEvents="none">D2</text>

        <rect className={sc("seat daybed", "daybed-t-3")} data-seat="daybed-t-3" x="370" y="200" width="70" height="50" rx="3" fill="#f1e7d2"/>
        <rect x="370" y="200" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".85"/>
        <text className="seat-lbl sm" x="405" y="232" pointerEvents="none">D3</text>

        <rect className={sc("seat daybed", "daybed-t-4")} data-seat="daybed-t-4" x="455" y="200" width="70" height="50" rx="3" fill="#f1e7d2"/>
        <rect x="455" y="200" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".85"/>
        <text className="seat-lbl sm" x="490" y="232" pointerEvents="none">D4</text>

        <rect className={sc("seat daybed", "daybed-t-5")} data-seat="daybed-t-5" x="540" y="200" width="70" height="50" rx="3" fill="#f1e7d2"/>
        <rect x="540" y="200" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".85"/>
        <text className="seat-lbl sm" x="575" y="232" pointerEvents="none">D5</text>

        <rect className={sc("seat daybed", "daybed-t-6")} data-seat="daybed-t-6" x="625" y="200" width="70" height="50" rx="3" fill="#f1e7d2"/>
        <rect x="625" y="200" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".85"/>
        <text className="seat-lbl sm" x="660" y="232" pointerEvents="none">D6</text>
      </g>

      {/* ===== POOL ===== */}
      <rect className="pool" x="190" y="270" width="520" height="140" rx="10" fill="url(#poolGrad)" stroke="#1a1a1a" strokeWidth="1.2"/>
      <rect x="205" y="285" width="490" height="110" rx="6" fill="#dceaee" stroke="#7fb1bf" strokeWidth=".5" opacity=".85" pointerEvents="none"/>
      {/* Pool ripples (decorative wavy lines) */}
      <g stroke="#7fb1bf" strokeWidth=".6" opacity=".5" fill="none" pointerEvents="none">
        <path d="M 235 320 Q 290 314 345 320 T 455 320 T 565 320 T 665 320"/>
        <path d="M 235 350 Q 290 344 345 350 T 455 350 T 565 350 T 665 350"/>
        <path d="M 235 380 Q 290 374 345 380 T 455 380 T 565 380 T 665 380"/>
      </g>

      {/* ===== BOTTOM DAYBEDS (front-row) ===== */}
      <g>
        <rect className={sc("seat front-daybed", "daybed-b-1")} data-seat="daybed-b-1" x="200" y="430" width="70" height="50" rx="3" fill="#d9b67f"/>
        <rect x="200" y="430" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".7"/>
        <text className="seat-lbl sm" x="235" y="462" pointerEvents="none">F1</text>

        <rect className={sc("seat front-daybed", "daybed-b-2")} data-seat="daybed-b-2" x="285" y="430" width="70" height="50" rx="3" fill="#d9b67f"/>
        <rect x="285" y="430" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".7"/>
        <text className="seat-lbl sm" x="320" y="462" pointerEvents="none">F2</text>

        <rect className={sc("seat front-daybed", "daybed-b-3")} data-seat="daybed-b-3" x="370" y="430" width="70" height="50" rx="3" fill="#d9b67f"/>
        <rect x="370" y="430" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".7"/>
        <text className="seat-lbl sm" x="405" y="462" pointerEvents="none">F3</text>

        <rect className={sc("seat front-daybed", "daybed-b-4")} data-seat="daybed-b-4" x="455" y="430" width="70" height="50" rx="3" fill="#d9b67f"/>
        <rect x="455" y="430" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".7"/>
        <text className="seat-lbl sm" x="490" y="462" pointerEvents="none">F4</text>

        <rect className={sc("seat front-daybed", "daybed-b-5")} data-seat="daybed-b-5" x="540" y="430" width="70" height="50" rx="3" fill="#d9b67f"/>
        <rect x="540" y="430" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".7"/>
        <text className="seat-lbl sm" x="575" y="462" pointerEvents="none">F5</text>

        <rect className={sc("seat front-daybed", "daybed-b-6")} data-seat="daybed-b-6" x="625" y="430" width="70" height="50" rx="3" fill="#d9b67f"/>
        <rect x="625" y="430" width="70" height="50" rx="3" fill="url(#hatch)" pointerEvents="none" opacity=".7"/>
        <text className="seat-lbl sm" x="660" y="462" pointerEvents="none">F6</text>
      </g>

      {/* ===== BOTTOM CABANAS (lower deck) ===== */}
      <g>
        <rect className={sc("seat cabana", "lower-cabana-1")} data-seat="lower-cabana-1" x="140" y="520" width="130" height="90" rx="5" fill="url(#cabFabric)"/>
        <line x1="140" y1="535" x2="270" y2="535" stroke="#a47e4d" strokeWidth=".5" opacity=".7" pointerEvents="none"/>
        <text className="seat-lbl" x="205" y="575" pointerEvents="none">C4</text>

        <rect className={sc("seat cabana", "lower-cabana-2")} data-seat="lower-cabana-2" x="290" y="520" width="130" height="90" rx="5" fill="url(#cabFabric)"/>
        <line x1="290" y1="535" x2="420" y2="535" stroke="#a47e4d" strokeWidth=".5" opacity=".7" pointerEvents="none"/>
        <text className="seat-lbl" x="355" y="575" pointerEvents="none">C5</text>

        <rect className={sc("seat cabana", "lower-cabana-3")} data-seat="lower-cabana-3" x="440" y="520" width="130" height="90" rx="5" fill="url(#cabFabric)"/>
        <line x1="440" y1="535" x2="570" y2="535" stroke="#a47e4d" strokeWidth=".5" opacity=".7" pointerEvents="none"/>
        <text className="seat-lbl" x="505" y="575" pointerEvents="none">C6</text>

        <rect className={sc("seat front-cabana", "lower-cabana-vip")} data-seat="lower-cabana-vip" x="590" y="520" width="130" height="90" rx="5" fill="url(#frontCabFabric)"/>
        <line x1="590" y1="535" x2="720" y2="535" stroke="#1a1a1a" strokeWidth=".5" opacity=".5" pointerEvents="none"/>
        <text className="seat-lbl light" x="655" y="575" pointerEvents="none">V2</text>
      </g>

      {/* ===== GENERAL ENTRY + CENTRAL DJ BOOTH ===== */}
      <g>
        {/* Row 1: entries 1-4 */}
        <circle className={sc("seat entry", "entry-1")} data-seat="entry-1"  cx="780" cy="210" r="15"/>
        <text className="seat-lbl xs" x="780" y="214" pointerEvents="none">1</text>
        <circle className={sc("seat entry", "entry-2")} data-seat="entry-2"  cx="830" cy="210" r="15"/>
        <text className="seat-lbl xs" x="830" y="214" pointerEvents="none">2</text>
        <circle className={sc("seat entry", "entry-3")} data-seat="entry-3"  cx="880" cy="210" r="15"/>
        <text className="seat-lbl xs" x="880" y="214" pointerEvents="none">3</text>
        <circle className={sc("seat entry", "entry-4")} data-seat="entry-4"  cx="930" cy="210" r="15"/>
        <text className="seat-lbl xs" x="930" y="214" pointerEvents="none">4</text>
        {/* Row 2: entries 5-8 (15px gap from row 1) */}
        <circle className={sc("seat entry", "entry-5")} data-seat="entry-5"  cx="780" cy="255" r="15"/>
        <text className="seat-lbl xs" x="780" y="259" pointerEvents="none">5</text>
        <circle className={sc("seat entry", "entry-6")} data-seat="entry-6"  cx="830" cy="255" r="15"/>
        <text className="seat-lbl xs" x="830" y="259" pointerEvents="none">6</text>
        <circle className={sc("seat entry", "entry-7")} data-seat="entry-7"  cx="880" cy="255" r="15"/>
        <text className="seat-lbl xs" x="880" y="259" pointerEvents="none">7</text>
        <circle className={sc("seat entry", "entry-8")} data-seat="entry-8"  cx="930" cy="255" r="15"/>
        <text className="seat-lbl xs" x="930" y="259" pointerEvents="none">8</text>

        {/* Central DJ booth — oriented so DJ faces the pool (left).
             Decks (turntables + mixer) sit on the LEFT edge facing pool;
             DJ standing-space is on the right. 15px gap from rows 2 and 3. */}
        <rect x="810" y="285" width="100" height="80" rx="4" fill="#2e2620" stroke="#1a1a1a" strokeWidth="1"/>
        {/* Subtle gold strip on left edge marks "front of booth" (toward pool) */}
        <rect x="810" y="285" width="3" height="80" fill="#c9a875" opacity=".6" pointerEvents="none"/>
        {/* Upper turntable (pool-facing edge) */}
        <circle cx="832" cy="305" r="11" fill="#1a1a1a" stroke="#c9a875" strokeWidth=".8" pointerEvents="none"/>
        <circle cx="832" cy="305" r="2.5" fill="#c9a875" pointerEvents="none"/>
        {/* Mixer between turntables (vertical orientation since booth is rotated) */}
        <rect x="822" y="320" width="20" height="10" rx="1" fill="#1a1a1a" stroke="#c9a875" strokeWidth=".5" pointerEvents="none"/>
        {/* Lower turntable */}
        <circle cx="832" cy="345" r="11" fill="#1a1a1a" stroke="#c9a875" strokeWidth=".8" pointerEvents="none"/>
        <circle cx="832" cy="345" r="2.5" fill="#c9a875" pointerEvents="none"/>
        {/* "DJ" header inside booth, on the right (DJ standing-space side) */}
        <text x="880" y="329" textAnchor="middle" fontFamily="Josefin Sans" fontSize="10" letterSpacing="4" fill="#c9a875" pointerEvents="none">{labels.dj}</text>

        {/* Row 3: entries 9-12 (15px gap from booth) */}
        <circle className={sc("seat entry", "entry-9")} data-seat="entry-9"  cx="780" cy="395" r="15"/>
        <text className="seat-lbl xs" x="780" y="399" pointerEvents="none">9</text>
        <circle className={sc("seat entry", "entry-10")} data-seat="entry-10" cx="830" cy="395" r="15"/>
        <text className="seat-lbl xs" x="830" y="399" pointerEvents="none">10</text>
        <circle className={sc("seat entry", "entry-11")} data-seat="entry-11" cx="880" cy="395" r="15"/>
        <text className="seat-lbl xs" x="880" y="399" pointerEvents="none">11</text>
        <circle className={sc("seat entry", "entry-12")} data-seat="entry-12" cx="930" cy="395" r="15"/>
        <text className="seat-lbl xs" x="930" y="399" pointerEvents="none">12</text>
        {/* Row 4: entries 13-16 (15px gap from row 3) */}
        <circle className={sc("seat entry", "entry-13")} data-seat="entry-13" cx="780" cy="440" r="15"/>
        <text className="seat-lbl xs" x="780" y="444" pointerEvents="none">13</text>
        <circle className={sc("seat entry", "entry-14")} data-seat="entry-14" cx="830" cy="440" r="15"/>
        <text className="seat-lbl xs" x="830" y="444" pointerEvents="none">14</text>
        <circle className={sc("seat entry", "entry-15")} data-seat="entry-15" cx="880" cy="440" r="15"/>
        <text className="seat-lbl xs" x="880" y="444" pointerEvents="none">15</text>
        <circle className={sc("seat entry", "entry-16")} data-seat="entry-16" cx="930" cy="440" r="15"/>
        <text className="seat-lbl xs" x="930" y="444" pointerEvents="none">16</text>
      </g>

      {/* ===== BALCONY SOFAS moved to UPPER DECK ===== */}

      {/* ===== BOW LOUNGES (J1/J2) — DJ booth moved to centre, lounges stay as bow seating ===== */}
      <g>
        <path className={sc("seat dj-lounge", "dj-lounge-1")} data-seat="dj-lounge-1"
              d="M 1130 230 Q 1140 215 1200 218 L 1235 248 Q 1230 280 1175 282 L 1130 282 Q 1110 270 1115 248 Z"
              fill="#c9a875"/>
        <text className="seat-lbl sm" x="1175" y="258" pointerEvents="none">J1</text>

        <path className={sc("seat dj-lounge", "dj-lounge-2")} data-seat="dj-lounge-2"
              d="M 1130 410 Q 1140 395 1200 398 L 1235 428 Q 1230 460 1175 462 L 1130 462 Q 1110 450 1115 428 Z"
              fill="#c9a875"/>
        <text className="seat-lbl sm" x="1175" y="438" pointerEvents="none">J2</text>
      </g>

      {/* ===== BOW DECORATIONS — palm-plant clusters and accents ===== */}
      <g pointerEvents="none">
        {/* Top-right cluster */}
        <circle cx="1295" cy="195" r="9" fill="#6d8c54" opacity=".85"/>
        <circle cx="1305" cy="210" r="6" fill="#7ea463" opacity=".85"/>
        <circle cx="1283" cy="213" r="5" fill="#5a7747" opacity=".85"/>
        {/* Mid-bow accents (lemon / decorative pots) */}
        <circle cx="1335" cy="350" r="11" fill="#fdf6df" stroke="#1a1a1a" strokeWidth=".5"/>
        <circle cx="1335" cy="350" r="6"  fill="#6d8c54" opacity=".7"/>
        {/* Bottom-right cluster */}
        <circle cx="1295" cy="505" r="9" fill="#6d8c54" opacity=".85"/>
        <circle cx="1305" cy="490" r="6" fill="#7ea463" opacity=".85"/>
        <circle cx="1283" cy="487" r="5" fill="#5a7747" opacity=".85"/>
      </g>

      {/* ===== STERN ACCENTS — palm cluster at top-left + bottom-left ===== */}
      <g pointerEvents="none">
        <circle cx="110" cy="100" r="8" fill="#6d8c54" opacity=".85"/>
        <circle cx="125" cy="115" r="5" fill="#7ea463" opacity=".85"/>
        <circle cx="110" cy="600" r="8" fill="#6d8c54" opacity=".85"/>
        <circle cx="125" cy="585" r="5" fill="#7ea463" opacity=".85"/>
      </g>

      {/* ===== SECTION LABELS — top layer so they sit above pool/bar ===== */}
      <g className="section-lbl" pointerEvents="none" fontFamily="Josefin Sans" fill="#8a7c66" fontWeight="400">
        <text x="450" y="345" fontSize="20" letterSpacing="10" textAnchor="middle" fill="#5a7480" opacity=".75">{labels.pool}</text>
        <text x="450" y="365" fontSize="8"  letterSpacing="3"  textAnchor="middle" fill="#5a7480" opacity=".55">{labels.poolSub}</text>
        <text x="865" y="190" fontSize="11" letterSpacing="6"  textAnchor="middle">{labels.entry}</text>
      </g>
      </g>
    </svg>
  );
}
