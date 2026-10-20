import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { guests, unitTypes } from "@/db/schema";
import { getCurrentGuest } from "@/server/guest-session";
import { getAccount } from "@/server/guest-account";
import { CHANNELS, currentConsents, recordConsent } from "@/server/consent";
import { error, json, parseBody } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { headers: { "Cache-Control": "no-store" } };

/** The signed-in guest's profile, consents and bookings. */
export async function GET() {
  const me = await getCurrentGuest();
  if (!me) return error(401, "SIGNED_OUT", "Sign in to see your account");
  const account = await getAccount(me.id);
  return account ? json(account, NO_STORE) : error(404, "NOT_FOUND", "Account not found");
}

const Patch = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/).nullable().optional(),
  locale: z.enum(["en", "ar"]).optional(),
  preferredUnitType: z.string().max(60).nullable().optional(),
  birthdayMonth: z.number().int().min(1).max(12).nullable().optional(),
  consents: z.object({ email: z.boolean().optional(), whatsapp: z.boolean().optional(), sms: z.boolean().optional() }).optional(),
});

/** Update details and preferences. Consent changes are recorded only when they actually change. */
export async function PATCH(req: Request) {
  const me = await getCurrentGuest();
  if (!me) return error(401, "SIGNED_OUT", "Sign in to update your account");
  let body: z.infer<typeof Patch>;
  try { body = await parseBody(req, Patch); } catch (e) { return error(422, "VALIDATION_ERROR", e instanceof Error ? e.message : "Invalid"); }
  if (body.preferredUnitType) {
    const [u] = await db.select({ id: unitTypes.id }).from(unitTypes).where(eq(unitTypes.id, body.preferredUnitType));
    if (!u) return error(422, "VALIDATION_ERROR", "Unknown seat type");
  }
  const set: Partial<typeof guests.$inferInsert> = {};
  if (body.name !== undefined) set.name = body.name;
  if (body.phone !== undefined) set.phone = body.phone ? body.phone.replace(/[ ()-]/g, "") : null;
  if (body.locale !== undefined) set.locale = body.locale;
  if (body.preferredUnitType !== undefined) set.preferredUnitType = body.preferredUnitType;
  if (body.birthdayMonth !== undefined) set.birthdayMonth = body.birthdayMonth;
  if (Object.keys(set).length) await db.update(guests).set(set).where(eq(guests.id, me.id));
  if (body.consents) {
    const now = await currentConsents(me.id);
    for (const ch of CHANNELS) { const want = body.consents[ch]; if (want !== undefined && want !== now[ch]) await recordConsent(me.id, ch, want, "account", req); }
  }
  return json({ ok: true }, NO_STORE);
}
