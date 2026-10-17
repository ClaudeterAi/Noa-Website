"use client";

import { useEffect, useState } from "react";
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

/** Port of #nav / .nav-mob from the static site, plus an EN | AR switch. */
export default function Nav({ main, mobile, book, bookingPage }: Props) {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const locale = useLocale() as Locale;
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => { setOpen(false); }, [pathname]);

  const other: Locale = locale === "en" ? "ar" : "en";
  const switchLabel = other === "ar" ? "العربية" : "English";

  return (
    <>
      <nav id="nav" className={stuck ? "stuck" : undefined} data-booking={bookingPage ? "" : undefined}>
        <Link href="/" className="logo">NOA</Link>
        <div className="nav-links">
          {main.map((l) => <Link key={l.href + l.label} href={l.href}>{l.label}</Link>)}
          <Link href={pathname} locale={other} className="nav-lang" lang={other} aria-label={switchLabel}>{switchLabel}</Link>
          <Link href={book.href} className="nav-book">{book.label}</Link>
        </div>
        <button type="button" className="nav-ham" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <span /><span /><span />
        </button>
      </nav>
      <div className={`nav-mob${open ? " open" : ""}`} id="mobmenu" aria-hidden={!open}>
        <button type="button" className="nav-mob-close" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        {mobile.map((l) => <Link key={l.href + l.label} href={l.href}>{l.label}</Link>)}
        <Link href={pathname} locale={other} lang={other}>{switchLabel}</Link>
        <Link href={book.href}><button type="button">{book.label}</button></Link>
      </div>
    </>
  );
}
