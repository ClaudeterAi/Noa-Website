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
    let guest: Awaited<ReturnType<typeof verifyEmailCode>>;
    try { guest = await verifyEmailCode(email, code, session); }
    catch (e) {
      const rejected = e instanceof Error && /Code not accepted|NotAuthorized|CodeMismatch|Expired/i.test(e.message);
      if (!rejected) console.error("guest verify failed", e);
      return error(401, "CODE_REJECTED", rejected ? "That code was not accepted. Request a new one." : "Sign-in failed. Request a new code.");
    }
    // the code is spent once Cognito accepts it: establish the session first, so nothing after this can undo the sign-in
    await setGuestSessionCookie(guest.id, new URL(req.url).protocol === "https:");
    if (marketing) {
      try { await recordConsent(guest.id, "email", true, source, req); }
      catch (e) { console.error("consent not recorded at sign-in", { guestId: guest.id, source }, e); }   // logged so the opt-in is not lost silently
    }
    return json({ ok: true, guest: { name: guest.name, email: guest.email, phone: guest.phone, tier: guest.tier } });
  } catch (e) { return error(422, "VALIDATION_ERROR", e instanceof Error && e.name === "ZodError" ? "Check the email and the 6-digit code." : "Invalid request"); }
}
