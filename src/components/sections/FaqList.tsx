"use client";

import { useState } from "react";

export interface FaqItem { id: string; q: string; a: string; }

/** Accordion: one open at a time, as in legacy faqToggle(). Card style (design pass), chevron rotates when open. */
export default function FaqList({ items, openFirst }: { items: FaqItem[]; openFirst?: boolean }) {
  const [open, setOpen] = useState<string | null>(openFirst && items[0] ? items[0].id : null);
  const toggle = (id: string) => setOpen(open === id ? null : id);
  return (
    <div className="rv d1 faq-list">
      {items.map((f) => {
        const isOpen = open === f.id;
        return (
          <div key={f.id} className={`faq-item${isOpen ? " open" : ""}`}>
            <button type="button" className="faq-q" aria-expanded={isOpen} aria-controls={`faq-ans-${f.id}`} onClick={() => toggle(f.id)}>
              <span className="faq-q-text">{f.q}</span>
              <svg className="faq-chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div className="faq-ans" id={`faq-ans-${f.id}`} role="region"><p>{f.a}</p></div>
          </div>
        );
      })}
    </div>
  );
}
