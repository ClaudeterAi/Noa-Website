import type { MetadataRoute } from "next";
import { registry } from "@/content/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://noa-dubai.com").replace(/\/$/, "");
  return registry.pages.flatMap((p) => ["en", "ar"].map((l) => ({
    url: `${base}/${l}${p.slug ? `/${p.slug}` : ""}`, lastModified: new Date(), changeFrequency: p.id === "events" || p.id === "home" ? "daily" as const : "weekly" as const, priority: p.id === "home" ? 1 : p.id === "booking" ? 0.9 : 0.7,
    alternates: { languages: { en: `${base}/en${p.slug ? `/${p.slug}` : ""}`, ar: `${base}/ar${p.slug ? `/${p.slug}` : ""}` } },
  })));
}
