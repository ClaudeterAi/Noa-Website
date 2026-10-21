/**
 * NOA content model.
 *
 * Every text field is bilingual. Day 1 serves this model from a typed module
 * (src/content/registry.ts); Day 2 serves the same shapes from Postgres in
 * me-central-1. Components never know which — they only receive these types.
 *
 * arStatus: "draft" = machine or author draft awaiting a native reviewer,
 *           "reviewed" = approved Arabic. Public pages render either; the
 *           admin shows a badge until reviewed.
 */

export type Locale = "en" | "ar";

export interface L {
  en: string;
  ar: string;
  arStatus?: "draft" | "reviewed";
}

export type MediaSource = "placeholder" | "noa";

export interface MediaSlot {
  id: string;
  kind: "image" | "video";
  /** null = nothing uploaded yet; the component renders its placeholder state */
  url: string | null;
  source: MediaSource;
  alt?: L;
}

export type PageId =
  | "home"
  | "morning-package"
  | "afternoon-package"
  | "night-package"
  | "cabana"
  | "events"
  | "about"
  | "location"
  | "faq"
  | "contact"
  | "booking"
  | "privacy"
  | "terms"
  | "cookies";

export type Href = { page: PageId; hash?: string } | { url: string };

export interface CtaLink {
  label: L;
  href: Href;
}

export type IconId =
  | "pool"
  | "bar"
  | "dining"
  | "cabana"
  | "dj"
  | "rooftop"
  | "daybed"
  | "shuttle";

/* ---------- Entities (one table each on Day 2) ---------- */

export interface Package {
  id: string;
  number: string;
  name: L;
  vibe: L;
  time: L;
  desc: L;
  media: string;
  more: CtaLink;
  book: CtaLink;
}

export interface EventItem {
  id: string;
  /** ISO date; placeholder data until NOA confirms the programme */
  date: string;
  dateLabel: L;
  shortDate: L;
  name: L;
  artist: L;
  media?: string;
  isPlaceholder: boolean;
  /** from the database: regular | main | highlight, and published | past */
  kind?: string;
  status?: string;
  /** bookable session and hours, from the database */
  session?: "morning" | "afternoon" | "night" | "full";
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface Faq {
  id: string;
  q: L;
  a: L;
}

export interface Settings {
  brand: string;
  tagline: L;
  contact: { phoneDisplay: string; phoneHref: string; email: string };
  hours: L;
  departure: L;
  socials: { label: string; href: string }[];
  copyright: L;
}

/* ---------- Sections (rows in page_sections on Day 2) ---------- */

interface Base {
  id: string;
}

export type Section =
  | (Base & { type: "hero"; media: string; quiet?: boolean })
  /* editorial home (design pass 2) */
  | (Base & { type: "editorialIntro"; eyebrow: L; heading: L; paragraphs: L[]; facts: { label: L; lines: L[] }[]; link?: CtaLink; media: string[] })
  | (Base & { type: "tileCarousels"; tiles: { media: string[]; heading: L; sub: L; caption?: L; href?: Href }[] })
  | (Base & { type: "packageEditorial"; packageId: string; flip?: boolean })
  | (Base & { type: "galleryCarousel"; heading: L; sub: L; media: string[]; link?: CtaLink })
  | (Base & { type: "textPortrait"; heading: L; sub: L; paragraphs: L[]; media: string; link?: CtaLink; flip?: boolean })
  | (Base & { type: "posterCarousel"; heading: L; sub?: L; source: "upcoming" | "highlights"; aspect: "2/3" | "1/1"; href: Href; fallbackMedia: string[] })
  | (Base & { type: "newsletter"; kicker: L; heading: L; body: L })
  | (Base & { type: "ticker"; items: L[] })
  | (Base & { type: "split"; cells: { media: string; heading: L; sub: L; href?: Href }[] })
  | (Base & { type: "package"; packageId: string; flip?: boolean })
  | (Base & { type: "restaurant"; heading: L; sub: L; media: string[] })
  | (Base & { type: "eventsGrid"; heading: L; eventIds: string[]; cardHref: Href; all?: CtaLink })
  | (Base & { type: "eventStrip"; heading: L; eventIds: string[]; href: Href; cta: L; noTopBorder?: boolean })
  | (Base & { type: "amenities"; heading: L; items: { icon: IconId; name: L; desc: L }[] })
  | (Base & { type: "location"; heading: L; label: L; rows: { label: L; value: L }[] })
  | (Base & {
      type: "faq";
      heading: L;
      faqIds: string[];
      openFirst?: boolean;
      more?: CtaLink;
      noTopBorder?: boolean;
    })
  | (Base & { type: "cta"; pre: L; heading: L; body: L; primary: CtaLink; secondary: CtaLink })
  | (Base & { type: "subhero"; media: string; kicker: L; heading: L; sub: L })
  | (Base & { type: "prose"; kicker: L; heading: L; paragraphs: L[]; media?: string })
  | (Base & { type: "map"; kicker: L; heading: L; query: string; address: L; note: L })
  | (Base & { type: "eventsProgramme"; kicker: L; heading: L; sub: L; empty: L })
  | (Base & {
      type: "splitProse";
      media: string;
      num: L;
      heading: L;
      paragraphs: L[];
      flip?: boolean;
      link?: CtaLink;
    })
  | (Base & { type: "specs"; heading: L; sub: L; items: { n: string; small?: string; label: L }[] })
  | (Base & { type: "included"; heading: L; sub: L; rows: { label: L; value: L }[] })
  | (Base & {
      type: "tariff";
      heading: L;
      sub: L;
      cards: { name: L; price: string; desc: L; cap: L; media?: string }[];
      note?: { before: L; linkLabel: L; after: L; href: Href };
    })
  | (Base & { type: "contactStrip"; cells: { label: L; value: L; href?: string }[] })
  | (Base & { type: "contactForm"; heading: L; sub: L; reasons: L[]; countries: L[] })
  | (Base & { type: "text"; heading: L; paragraphs: L[]; isPlaceholder?: boolean });

export interface Page {
  id: PageId;
  slug: string;
  title: L;
  metaDescription: L;
  inNav?: boolean;
  navLabel?: L;
  /** label in the mobile menu when it differs from navLabel (e.g. "Morning Package" vs "Packages") */
  menuLabel?: L;
  /** phrases a guest might say to the voice concierge to reach this page */
  voiceAliases: L[];
  sections: Section[];
}

export interface Registry {
  settings: Settings;
  media: Record<string, MediaSlot>;
  packages: Record<string, Package>;
  events: Record<string, EventItem>;
  faqs: Record<string, Faq>;
  pages: Page[];
  /** mobile menu + footer are explicit lists so NOA can reorder them in admin */
  nav: { main: PageId[]; mobile: PageId[]; footer: { heading: L; links: { label: L; href: Href }[] }[] };
}
