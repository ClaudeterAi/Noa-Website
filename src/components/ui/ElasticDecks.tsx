"use client";

import Link from "next/link";
import { useState } from "react";

export type DeckPanel = { id: string; img: string; alt: string; heading: string; sub: string; caption?: string; href?: string; cta: string };

/**
 * The decks as an elastic row: one panel open wide, the others as narrow spines with their names set vertically.
 * Hover or tap a spine to open it. On phones the row becomes a stack of landscape tiles.
 */
export default function ElasticDecks({ panels, rtl }: { panels: DeckPanel[]; rtl?: boolean }) {
  const [active, setActive] = useState(0);
  return (
    <div className="ed-elastic" dir={rtl ? "rtl" : undefined}>
      {panels.map((p, i) => {
        const open = i === active;
        const Body = (
          <>
            <div className="ed-elastic-img" style={{ backgroundImage: `url('${p.img}')` }} role="img" aria-label={p.alt} />
            <div className="ed-elastic-shade" />
            <div className="ed-elastic-spine" aria-hidden="true"><span>{p.heading}</span></div>
            <div className="ed-elastic-copy">
              {p.caption && <div className="ed-elastic-cap">{p.caption}</div>}
              <div className="ed-elastic-h">{p.heading}</div>
              <div className="ed-elastic-sub">{p.sub}</div>
              {p.href && <div className="ed-elastic-cta">{p.cta} <span aria-hidden="true">→</span></div>}
            </div>
          </>
        );
        const cls = `ed-elastic-panel${open ? " open" : ""}`;
        const common = { onMouseEnter: () => setActive(i), onFocus: () => setActive(i), onClick: () => setActive(i) };
        return p.href && open ? (
          <Link key={p.id} href={p.href} className={cls} {...common} aria-label={p.heading}>{Body}</Link>
        ) : (
          <div key={p.id} className={cls} {...common} role="button" tabIndex={0} aria-pressed={open} aria-label={p.heading}
               onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(i); } }}>{Body}</div>
        );
      })}
    </div>
  );
}
