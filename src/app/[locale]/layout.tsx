import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { DIR, routing, type Locale } from "@/i18n/routing";
import { hrefPath, getPage, pick, registry } from "@/content/registry";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Effects from "@/components/layout/Effects";
import Motion from "@/components/layout/Motion";
import Scroll from "@/components/layout/Scroll";
import LiquidGlass from "@/components/layout/LiquidGlass";
import SignInDialog from "@/components/account/SignInDialog";
import ChatConcierge from "@/components/concierge/ChatConcierge";
import VoiceConcierge from "@/components/concierge/VoiceConcierge";
import { barlow, naskh, plexArabic } from "@/fonts";
import "@/styles/globals.css";


export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const loc = (hasLocale(routing.locales, locale) ? locale : routing.defaultLocale) as Locale;
  const home = getPage("home");
  return {
    title: { default: pick(home.title, loc), template: loc === "ar" ? "%s — نوا" : "%s — NOA" },
    description: pick(home.metaDescription, loc),
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const loc = locale as Locale;
  const messages = await getMessages();

  const toLink = (id: (typeof registry.nav.main)[number], menu = false) => {
    const p = getPage(id);
    const label = (menu ? p.menuLabel : undefined) ?? p.navLabel ?? p.title;
    return { href: hrefPath({ page: id }), label: pick(label, loc) };
  };
  const booking = getPage("booking");
  /** phone menu: these pages show as photo tiles (media slot per page), the rest as rows */
  const MENU_TILES: Partial<Record<string, string>> = { "afternoon-package": "pkg-afternoon", "night-package": "pkg-night", cabana: "pkg-cabana", events: "party-1" };

  return (
    <html lang={loc} dir={DIR[loc]} className={`${barlow.variable} ${plexArabic.variable} ${naskh.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Effects />
          <Scroll />
          <LiquidGlass />
          <Motion />
          <Nav
            main={registry.nav.main.map((id) => toLink(id))}
            mobile={registry.nav.mobile.map((id) => {
              const l = toLink(id, true), slot = MENU_TILES[id];
              return slot === undefined ? l : { ...l, image: registry.media[slot]?.url ?? null };
            })}
            book={{ href: hrefPath({ page: "booking" }), label: pick(booking.navLabel ?? booking.title, loc) }}
          />
          {children}
          <Footer locale={loc} />
          <SignInDialog />
          <VoiceConcierge />
          <ChatConcierge />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
