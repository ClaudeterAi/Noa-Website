"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export interface NavLink { href: string; label: string; }

interface Props {
  main: NavLink[];
  mobile: NavLink[];
  book: NavLink;
  bookingPage?: boolean;
}

/**
 * Resizable navbar (Aceternity port, NOA colours, plain CSS, no animation library).
 * Past 100px of scroll the bar becomes a floating pill (desktop: 40%, min 800px, 20px down; mobile: 90% card).
 * The state flips once; CSS transitions do the movement, so nothing runs per frame (Safari).
 * Over the home film it stays transparent with white text, as before.
 */
export default function Nav({ main, mobile, book, bookingPage }: Props) {
  const [stuck, setStuck] = useState(false);
  const [floating, setFloating] = useState(false);
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState<{ x: number; w: number } | null>(null);
  const items = useRef<HTMLDivElement>(null);
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  useEffect(() => {
    // pages without a full-bleed hero (booking, confirmation…) start with the solid bar, so the logo never sits white on sand
    const hasHero = () => !!document.querySelector(".hero");   // sub-page heroes are framed on sand now, so the bar starts solid there
    const onScroll = () => {
      const y = window.scrollY;
      setStuck(y > 40 || !hasHero());
      setFloating(y > 100);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const onEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    const a = e.currentTarget, box = items.current;
    if (!box) return;
    const r = a.getBoundingClientRect(), b = box.getBoundingClientRect();
    setHl({ x: r.left - b.left, w: r.width });
  };

  const other: Locale = locale === "en" ? "ar" : "en";
  const switchLabel = other === "ar" ? "العربية" : "English";
  const cls = [stuck && "stuck", floating && "floating", open && "menu-open"].filter(Boolean).join(" ") || undefined;

  return (
    <nav id="nav" className={cls} data-booking={bookingPage ? "" : undefined}>
      <div className="nav-body">
        <Link href="/" className="logo">NOA</Link>
        <div className="nav-links" ref={items} onMouseLeave={() => setHl(null)}>
          <span className="nav-hl" aria-hidden="true" style={hl ? { opacity: 1, width: hl.w, transform: `translateX(${hl.x}px)` } : { opacity: 0 }} />
          {main.map((l) => <Link key={l.href + l.label} href={l.href} onMouseEnter={onEnter}>{l.label}</Link>)}
        </div>
        <div className="nav-actions">
          <Link href={pathname} locale={other} className="nav-lang" lang={other} aria-label={switchLabel}>{switchLabel}</Link>
          <Link href={book.href} className="nav-book">{book.label}</Link>
        </div>
        <button type="button" className="nav-ham" aria-label={open ? "Close menu" : "Menu"} aria-expanded={open} aria-controls="mobmenu" onClick={() => setOpen(!open)}>
          {open
            ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>}
        </button>
        <div className={`nav-drop${open ? " open" : ""}`} id="mobmenu" aria-hidden={!open}>
          {mobile.map((l) => <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>)}
          <Link href={pathname} locale={other} lang={other} onClick={() => setOpen(false)}>{switchLabel}</Link>
          <Link href={book.href} className="nav-drop-book" onClick={() => setOpen(false)}>{book.label}</Link>
        </div>
      </div>
    </nav>
  );
}
