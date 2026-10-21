import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 60; // event publishes also call revalidatePath; this is the safety net
import { routing, type Locale } from "@/i18n/routing";
import { getPageBySlug, pick, slugPages } from "@/content/registry";
import { SectionRenderer } from "@/components/sections";
import { loadSite } from "@/server/site";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => slugPages().map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  await loadSite();
  const page = getPageBySlug(slug);
  if (!page) return {};
  const loc = locale as Locale;
  return { title: { absolute: pick(page.title, loc) }, description: pick(page.metaDescription, loc) };
}

export default async function RegistryPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  await loadSite();
  setRequestLocale(locale);
  const page = getPageBySlug(slug);
  if (!page || page.id === "booking" || page.slug === "") notFound();
  return <main data-page={page.id}>{page.sections.map((s) => <SectionRenderer key={s.id} section={s} locale={locale as Locale} />)}</main>;
}
