"use client";

import Link from "next/link";
import { useState } from "react";

export type DeckPanel = { id: string; img: string; alt: string; heading: string; sub: string; caption?: string; href?: string; cta: string };

/**
 * The decks as an elastic row (accordion). One panel is open (flex 4), the others are spines (flex 1).
 * Every panel is always the same element, so flex, filter, scale and fades animate instead of snapping.
 * Open panel: image settles from 1.1 to 1, gradient fades in, copy rises in after a short delay, spine text shrinks away.
 * Closed panels: dimmed; brighten on hover. Hover or tap/click opens; a click on an already open panel follows its link.
 */
export default function ElasticDecks({ panels, rtl }: { panels: DeckPanel[]; rtl?: boolean }) {
  const [active, setActive] = useState(Math.min(1, panels.length - 1));
  return (
    <div className="ed-elastic" dir={rtl ? "rtl" : undefined}>
      {panels.map((p, i) => {
        const open = i === active;
        return (
          <Link
            key={p.id}
            href={p.href ?? "#"}
            className={`ed-elastic-panel${open ? " open" : ""}`}
            aria-label={p.heading}
            aria-current={open ? "true" : undefined}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={(e) => { if (!open || !p.href) { e.preventDefault(); setActive(i); } }}
          >
            <div className="ed-elastic-img" style={{ backgroundImage: `url('${p.img}')` }} role="img" aria-label={p.alt} />
            <div className="ed-elastic-shade" />
            <div className="ed-elastic-spine" aria-hidden="true"><span>{p.heading}</span></div>
            <div className="ed-elastic-copy">
              {p.caption && <div className="ed-elastic-cap">{p.caption}</div>}
              <div className="ed-elastic-h">{p.heading}</div>
              <div className="ed-elastic-sub">{p.sub}</div>
              {p.href && <div className="ed-elastic-cta">{p.cta} <span aria-hidden="true">→</span></div>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
