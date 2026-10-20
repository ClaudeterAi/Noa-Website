import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { guestConsents, guests } from "@/db/schema";

/**
 * Marketing consent, recorded as history: every grant or withdrawal is a row in guest_consents with the channel,
 * where it happened, and the request's IP and browser. The latest row per channel is the guest's current choice.
 * guests.marketing_opt_in mirrors the latest EMAIL choice so the existing readers (exports, notifications) keep working.
 */
export type Channel = "email" | "whatsapp" | "sms";
export type ConsentSource = "popup" | "account" | "checkout" | "newsletter" | "delete_request";
export const CHANNELS: Channel[] = ["email", "whatsapp", "sms"];
type Conn = Pick<typeof db, "insert" | "update" | "select">;

export function requestMeta(req?: Request): { ip: string | null; userAgent: string | null } {
  if (!req) return { ip: null, userAgent: null };
  const fwd = req.headers.get("x-forwarded-for");
  return { ip: fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip"), userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? null };
}

export async function recordConsent(guestId: string, channel: Channel, granted: boolean, source: ConsentSource, req?: Request, conn: Conn = db) {
  const { ip, userAgent } = requestMeta(req);
  await conn.insert(guestConsents).values({ guestId, channel, granted, source, ip, userAgent });
  if (channel === "email") await conn.update(guests).set({ marketingOptIn: granted, consentAt: sql`now()` }).where(eq(guests.id, guestId));
}

/** Current choice per channel. Email falls back to guests.marketing_opt_in for guests who consented before 0006. */
export async function currentConsents(guestId: string): Promise<Record<Channel, boolean>> {
  const out: Record<Channel, boolean> = { email: false, whatsapp: false, sms: false };
  for (const ch of CHANNELS) {
    const [row] = await db.select({ granted: guestConsents.granted }).from(guestConsents)
      .where(and(eq(guestConsents.guestId, guestId), eq(guestConsents.channel, ch))).orderBy(desc(guestConsents.at)).limit(1);
    if (row) out[ch] = row.granted;
    else if (ch === "email") { const [g] = await db.select({ m: guests.marketingOptIn }).from(guests).where(eq(guests.id, guestId)); out.email = !!g?.m; }
  }
  return out;
}
