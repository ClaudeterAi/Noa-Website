import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import ManageBooking from "@/components/booking/ManageBooking";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: { absolute: locale === "ar" ? "حجزي — نوا" : "My reservation — NOA" }, robots: { index: false } };
}
export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ ref?: string }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const { ref } = await searchParams;
  return <ManageBooking initialRef={ref ?? ""} />;
}
