import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Cormorant, IBM_Plex_Sans_Arabic, Josefin_Sans, Noto_Naskh_Arabic } from "next/font/google";
import { DIR, routing, type Locale } from "@/i18n/routing";
import { hrefPath, getPage, pick, registry } from "@/content/registry";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Effects from "@/components/layout/Effects";
import "@/styles/globals.css";

const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["200", "300", "400"], variable: "--font-josefin", display: "swap" });
const cormorant = Cormorant({ subsets: ["latin"], weight: ["300", "400"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["200", "300", "400"], variable: "--font-plex-arabic", display: "swap" });
const naskh = Noto_Naskh_Arabic({ subsets: ["arabic"], weight: ["400", "500"], variable: "--font-naskh", display: "swap" });

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

  return (
    <html lang={loc} dir={DIR[loc]} className={`${josefin.variable} ${cormorant.variable} ${plexArabic.variable} ${naskh.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Effects />
          <Nav
            main={registry.nav.main.map((id) => toLink(id))}
            mobile={registry.nav.mobile.map((id) => toLink(id, true))}
            book={{ href: hrefPath({ page: "booking" }), label: pick(booking.navLabel ?? booking.title, loc) }}
          />
          {children}
          <Footer locale={loc} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
