import { registry } from "@/content/registry";
import type { Locale } from "@/content/types";

/**
 * The navigation surface the agents can drive: every page, its sections (anchors) and the
 * phrases a guest might use. Generated from the content registry, so a sitemap change in the
 * registry changes what the voice agent can navigate to — nothing is hand-maintained.
 */
export interface NavTarget { page: string; path: string; title: string; aliases: string[]; sections: { id: string; label: string }[] }

export function navTargets(locale: Locale): NavTarget[] {
  return registry.pages.map((p) => ({
    page: p.id,
    path: `/${locale}${p.slug ? `/${p.slug}` : ""}`,
    title: locale === "ar" ? p.title.ar : p.title.en,
    aliases: p.voiceAliases.map((a) => (locale === "ar" ? a.ar : a.en)),
    sections: p.sections.filter((s) => "heading" in s).map((s) => ({ id: s.id, label: locale === "ar" ? (s as { heading: { ar: string } }).heading.ar : (s as { heading: { en: string } }).heading.en })).map((s) => ({ ...s, label: s.label.replace("\n", " ").replace(/\*/g, "") })),
  }));
}

export const pageIds = () => registry.pages.map((p) => p.id);
