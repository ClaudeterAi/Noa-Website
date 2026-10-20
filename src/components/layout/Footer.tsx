"use client";

import type { Locale } from "@/content/types";
import { hrefPath, pick, registry } from "@/content/registry";
import { Link } from "@/i18n/navigation";
import BeamWordmarkFooter, { type FooterSocial, type SocialIcon } from "@/components/ui/BeamWordmarkFooter";

/** Content keys in settings.socials → the footer's built-in icon set and a readable name. */
const SOCIAL: Record<string, { icon: SocialIcon; name: string }> = {
  IG: { icon: "instagram", name: "Instagram" },
  TK: { icon: "tiktok", name: "TikTok" },
  FB: { icon: "facebook", name: "Facebook" },
  YT: { icon: "youtube", name: "YouTube" },
  X: { icon: "x", name: "X" },
};

const LEGAL = [
  { href: "/privacy", en: "Privacy Policy", ar: "سياسة الخصوصية" },
  { href: "/terms", en: "Terms & Conditions", ar: "الشروط والأحكام" },
  { href: "/cookies", en: "Cookie Policy", ar: "سياسة ملفات تعريف الارتباط" },
];

/**
 * Site footer: the beam wordmark footer fed from the content registry.
 * The wordmark reads "NOA" in both languages until the logo artwork arrives.
 * Social links are shown as inert placeholders while their URLs are "#".
 */
export default function Footer({ locale }: { locale: Locale }) {
  const { settings, nav } = registry;
  const socials: FooterSocial[] = settings.socials.map((s) => ({
    label: SOCIAL[s.label]?.name ?? s.label,
    href: s.href,
    icon: SOCIAL[s.label]?.icon ?? s.label,
  }));
  return (
    <BeamWordmarkFooter
      brand={settings.brand}
      wordmark="NOA"
      copyright={pick(settings.copyright, locale)}
      socials={socials}
      credits={[{ lead: pick(settings.tagline, locale), label: "" }]}
      legal={LEGAL.map((l) => ({ href: l.href, label: locale === "ar" ? l.ar : l.en }))}
      columns={nav.footer.map((col) => ({
        title: pick(col.heading, locale),
        links: col.links.map((l) => ({ label: pick(l.label, locale), href: hrefPath(l.href) })),
      }))}
      LinkComponent={Link}
      dir={locale === "ar" ? "rtl" : "ltr"}
      glass
    />
  );
}
