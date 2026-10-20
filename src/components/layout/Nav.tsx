"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export interface NavLink { href: string; label: string; /** menu tile photo; links with one show as tiles in the phone menu */ image?: string | null; }

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

  // phone menu: lock page scroll, close on Escape, move focus in and back out
  const hamRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement, prev = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => sheetRef.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true }), 60);
    const ham = hamRef.current;
    return () => { root.style.overflow = prev; window.removeEventListener("keydown", onKey); clearTimeout(t); ham?.focus({ preventScroll: true }); };
  }, [open]);

  const onEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    const a = e.currentTarget, box = items.current;
    if (!box) return;
    const r = a.getBoundingClientRect(), b = box.getBoundingClientRect();
    setHl({ x: r.left - b.left, w: r.width });
  };

  const other: Locale = locale === "en" ? "ar" : "en";
  const switchLabel = other === "ar" ? "العربية" : "English";
  const cls = [stuck && "stuck", floating && "floating", open && "menu-open"].filter(Boolean).join(" ") || undefined;
  const tiles = mobile.filter((l) => l.image !== undefined), rows = mobile.filter((l) => l.image === undefined);
  const current = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  const T = locale === "ar"
    ? { menu: "القائمة", experience: "التجربة", info: "معلومات", language: "اللغة" }
    : { menu: "Menu", experience: "Experience", info: "Information", language: "Language" };

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
        <button type="button" ref={hamRef} className="nav-ham" aria-label={open ? "Close menu" : "Menu"} aria-expanded={open} aria-controls="mobmenu" onClick={() => setOpen(!open)}>
          {open
            ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>}
        </button>
      </div>
      <div className={`mm${open ? " open" : ""}`} id="mobmenu" ref={sheetRef} role="dialog" aria-modal="true" aria-label={T.menu} aria-hidden={!open} inert={!open}>
        <div className="mm-scroll">
          <p className="mm-label" style={{ "--i": 0 } as CSSProperties}>{T.experience}</p>
          <div className="mm-tiles">
            {tiles.map((l, i) => (
              <Link key={l.href} href={l.href} className="mm-tile" aria-current={current(l.href) ? "page" : undefined} style={{ "--i": i + 1 } as CSSProperties} onClick={() => setOpen(false)}>
                {l.image ? <img src={l.image} alt="" loading="lazy" decoding="async" /> : null}
                <span>{l.label}</span>
              </Link>
            ))}
          </div>
          <p className="mm-label" style={{ "--i": tiles.length + 1 } as CSSProperties}>{T.info}</p>
          <ul className="mm-rows">
            {rows.map((l, i) => (
              <li key={l.href} style={{ "--i": tiles.length + 2 + i } as CSSProperties}>
                <Link href={l.href} aria-current={current(l.href) ? "page" : undefined} onClick={() => setOpen(false)}>
                  <span>{l.label}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mm-dock">
          <div className="mm-lang" role="group" aria-label={T.language}>
            <Link href={pathname} locale="en" lang="en" aria-current={locale === "en" ? "true" : undefined} onClick={() => setOpen(false)}>English</Link>
            <Link href={pathname} locale="ar" lang="ar" aria-current={locale === "ar" ? "true" : undefined} onClick={() => setOpen(false)}>العربية</Link>
          </div>
          <Link href={book.href} className="mm-book" onClick={() => setOpen(false)}>{book.label}</Link>
        </div>
      </div>
    </nav>
  );
}
