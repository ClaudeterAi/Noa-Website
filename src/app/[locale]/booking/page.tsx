import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage, pick } from "@/content/registry";
import { Link } from "@/i18n/navigation";
import BookingApp from "@/components/booking/BookingApp";
import MovingBorder from "@/components/ui/MovingBorder";
import { loadVenue } from "@/server/venue";
import { venueSnapshot, venueText } from "@/lib/venue";

export const dynamic = "force-dynamic"; // the "open soon" / live decision is made per request, not baked at build

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  await loadVenue();
  const page = getPage("booking");
  return { title: { absolute: pick(page.title, locale as Locale) }, description: pick(page.metaDescription, locale as Locale) };
}

/**
 * Until the production database exists, /booking shows an honest "reservations open soon" state
 * instead of a seat map that cannot hold seats. Flips to the live engine the moment DATABASE_URL is set.
 */
export default async function BookingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await loadVenue();
  if (!process.env.DATABASE_URL) return <ReservationsSoon locale={locale as Locale} />;
  return <BookingApp />;
}

function ReservationsSoon({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const vt = venueText(venueSnapshot(), ar ? "ar" : "en");
  return (
    <main className="cta" style={{ paddingTop: 200, minHeight: "70vh" }}>
      <div className="cta-pre">{ar ? "الحجوزات" : "Reservations"}</div>
      <div className="cta-h">{ar ? <>تُفتح الحجوزات<br />قريباً</> : <>Reservations<br />open soon</>}</div>
      <p className="cta-body">{ar ? "خريطة المقاعد والدفع الإلكتروني في طريقهما إلى هنا. حتى ذلك الحين، يسعد فريقنا بحجز مقعدك مباشرة." : "The seat map and online payment are on their way here. Until then, our team will gladly hold your seat directly."}</p>
      <div className="cta-row">
        <Link href="/contact"><MovingBorder><button type="button" className="pkg-btn mb-btn">{ar ? "تواصل مع الفريق" : "Contact the team"}</button></MovingBorder></Link>
        <Link href="/morning-package" className="pkg-more">{ar ? "اطّلع على الباقات" : "See the packages"}</Link>
      </div>
      <p className="form-meta" style={{ marginTop: 28 }}><a href={vt.phoneHref} style={{ borderBottom: "1px solid", color: "#1a1a1a" }}>{vt.phone}</a> · <a href={`mailto:${vt.email}`} style={{ borderBottom: "1px solid", color: "#1a1a1a" }}>{vt.email}</a></p>
    </main>
  );
}
