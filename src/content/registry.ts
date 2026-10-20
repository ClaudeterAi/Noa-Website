import { resolveVenueTokens, venueSnapshot } from "@/lib/venue";
import type { Href, L, Locale, Page, PageId, Registry } from "./types";
import { events, faqs, media, packages, settings } from "./entities";
import { nav, pages } from "./pages";

/**
 * Day 1 data source: this module. Day 2: the same functions read Postgres
 * (me-central-1) and nothing above this file changes.
 */
export const registry: Registry = { settings, media, packages, events, faqs, pages, nav };

export function getPage(id: PageId): Page {
  const p = registry.pages.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown page: ${id}`);
  return p;
}

export function getPageBySlug(slug: string): Page | undefined {
  return registry.pages.find((x) => x.slug === slug);
}

/** pages that resolve through /[locale]/[slug] (home and booking have their own routes) */
export const slugPages = (): Page[] => registry.pages.filter((p) => p.slug !== "" && p.id !== "booking");

/** Copy in the visitor's language, with venue facts ({{pier}}, {{afternoon.time}}, …) filled from Admin → Settings → Venue. */
export function pick(l: L, locale: Locale): string {
  return resolveVenueTokens(locale === "ar" ? l.ar : l.en, venueSnapshot(), locale === "ar" ? "ar" : "en");
}

/** locale-less path; next-intl's Link adds the /en or /ar prefix */
export function hrefPath(h: Href): string {
  if ("url" in h) return h.url;
  const page = getPage(h.page);
  const base = page.slug === "" ? "/" : `/${page.slug}`;
  return h.hash ? `${base}#${h.hash}` : base;
}

export function mediaUrl(id: string): string | null {
  return registry.media[id]?.url ?? null;
}
