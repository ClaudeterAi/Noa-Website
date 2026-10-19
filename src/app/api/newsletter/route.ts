import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { guests } from "@/db/schema";
import { error, json, parseBody } from "@/server/http";

export const runtime = "nodejs";
const Body = z.object({ email: z.string().trim().toLowerCase().email(), locale: z.enum(["en", "ar"]).default("en") });

/** Newsletter: marketing consent on the guest record (created if new). Same reply for new and known addresses. */
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) return json({ ok: true });
  try {
    const { email, locale } = await parseBody(req, Body);
    await db.insert(guests).values({ email, locale, marketingOptIn: true, consentAt: sql`now()` })
      .onConflictDoUpdate({ target: guests.email, set: { marketingOptIn: true, consentAt: sql`now()` } });
    return json({ ok: true });
  } catch (e) { return error(422, "VALIDATION_ERROR", e instanceof Error ? e.message : "Invalid"); }
}
