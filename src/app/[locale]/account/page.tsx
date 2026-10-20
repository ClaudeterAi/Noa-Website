import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import AccountApp from "@/components/account/AccountApp";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: { absolute: locale === "ar" ? "حسابي — نوا" : "My account — NOA" }, robots: { index: false } };
}
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; setRequestLocale(locale);
  return <AccountApp />;
}
