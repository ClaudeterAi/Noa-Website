import { cache } from "react";
import { db } from "@/db/client";
import { contentFields as contentFieldsTable } from "@/db/schema";
import { applyContentOverrides, appliedContentOverrides, type ContentOverrides } from "@/lib/content";

/** Load the saved page edits and lay them over the code's copy. A database hiccup keeps the last edits loaded. */
export const loadContent = cache(async (): Promise<ContentOverrides> => {
  if (!process.env.DATABASE_URL) return appliedContentOverrides();
  try {
    const rows = await db.select().from(contentFieldsTable);
    const o: ContentOverrides = Object.fromEntries(rows.map((r) => [r.path, { en: r.valueEn, ar: r.valueAr, reviewed: r.arReviewed }]));
    applyContentOverrides(o);
    return o;
  } catch {
    return appliedContentOverrides();
  }
});
