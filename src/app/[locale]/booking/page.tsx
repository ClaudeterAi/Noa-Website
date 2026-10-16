import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getPage, pick } from "@/content/registry";
import BookingApp from "@/components/booking/BookingApp";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const page = getPage("booking");
  return { title: { absolute: pick(page.title, locale as Locale) }, description: pick(page.metaDescription, locale as Locale) };
}

export default async function BookingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BookingApp />;
}
