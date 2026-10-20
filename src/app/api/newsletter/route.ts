import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { guests } from "@/db/schema";
import { error, json, parseBody } from "@/server/http";
import { recordConsent } from "@/server/consent";

export const runtime = "nodejs";
const Body = z.object({ email: z.string().trim().toLowerCase().email(), locale: z.enum(["en", "ar"]).default("en") });

/** Newsletter: marketing consent on the guest record (created if new). Same reply for new and known addresses. */
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) return json({ ok: true });
  try {
    let parsed: { email: string; locale: "en" | "ar" };
    try { parsed = await parseBody(req, Body); } catch { return error(422, "VALIDATION_ERROR", "Enter a valid email address."); }
    // opt-in and its history row commit together, or neither does
    await db.transaction(async (tx) => {
      const [g] = await tx.insert(guests).values({ email: parsed.email, locale: parsed.locale, marketingOptIn: true, consentAt: sql`now()` })
        .onConflictDoUpdate({ target: guests.email, set: { marketingOptIn: true, consentAt: sql`now()` } }).returning({ id: guests.id });
      if (g) await recordConsent(g.id, "email", true, "newsletter", req, tx);
    });
    return json({ ok: true });
  } catch (e) { console.error("newsletter signup failed", e); return error(500, "INTERNAL", "We couldn't sign you up just now. Try again in a moment."); }
}
