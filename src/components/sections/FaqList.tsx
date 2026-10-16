"use client";

import { useState } from "react";

export interface FaqItem { id: string; q: string; a: string; }

/** Accordion — one open at a time, as in legacy faqToggle(). */
export default function FaqList({ items, openFirst }: { items: FaqItem[]; openFirst?: boolean }) {
  const [open, setOpen] = useState<string | null>(openFirst && items[0] ? items[0].id : null);
  return (
    <div className="rv d1">
      {items.map((f) => (
        <div key={f.id} className={`faq-item${open === f.id ? " open" : ""}`}>
          <div className="faq-q" role="button" tabIndex={0}
            onClick={() => setOpen(open === f.id ? null : f.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(open === f.id ? null : f.id); } }}>
            {f.q} <div className="faq-plus">+</div>
          </div>
          <div className="faq-ans"><p>{f.a}</p></div>
        </div>
      ))}
    </div>
  );
}
