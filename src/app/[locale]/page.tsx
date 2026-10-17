import { setRequestLocale } from "next-intl/server";

export const revalidate = 60; // event publishes also call revalidatePath; this is the safety net
import type { Locale } from "@/i18n/routing";
import { getPage } from "@/content/registry";
import { SectionRenderer } from "@/components/sections";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = getPage("home");
  return <main>{page.sections.map((s) => <SectionRenderer key={s.id} section={s} locale={locale as Locale} />)}</main>;
}
