import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import Confirmation from "@/components/booking/Confirmation";

/** Reads ?payment_intent from the Stripe redirect — client-only, so it is wrapped in Suspense for prerendering. */
export default async function ConfirmationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Suspense fallback={<main className="bk-result" />}><Confirmation /></Suspense>;
}
