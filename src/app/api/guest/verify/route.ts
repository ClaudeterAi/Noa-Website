import { z } from "zod";
import { verifyEmailCode } from "@/server/guest-auth";
import { setGuestSessionCookie } from "@/server/guest-session";
import { error, json, parseBody } from "@/server/http";
import { recordConsent } from "@/server/consent";

export const runtime = "nodejs";
const Body = z.object({
  email: z.string().trim().toLowerCase().email(), code: z.string().trim().regex(/^\d{6,8}$/), session: z.string().min(10),
  /** the marketing box on the sign-in card; recorded only when ticked (an unticked box is not a withdrawal) */
  marketing: z.boolean().optional(),
  source: z.enum(["popup", "checkout"]).default("popup"),
});

/** Step 2: verify the code → signed guest cookie (30 days). */
export async function POST(req: Request) {
  try {
    const { email, code, session, marketing, source } = await parseBody(req, Body);
    const guest = await verifyEmailCode(email, code, session);
    if (marketing) await recordConsent(guest.id, "email", true, source, req);
    await setGuestSessionCookie(guest.id, new URL(req.url).protocol === "https:");
    return json({ ok: true, guest: { name: guest.name, email: guest.email, phone: guest.phone, tier: guest.tier } });
  } catch (e) { return error(401, "CODE_REJECTED", e instanceof Error && /Code not accepted|NotAuthorized|CodeMismatch|Expired/i.test(e.message) ? "That code was not accepted. Request a new one." : e instanceof Error ? e.message : "Sign-in failed"); }
}
