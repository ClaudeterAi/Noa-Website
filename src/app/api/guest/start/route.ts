import { z } from "zod";
import { guestAuthConfigured, startEmailCode } from "@/server/guest-auth";
import { error, json, parseBody } from "@/server/http";

export const runtime = "nodejs";
const Body = z.object({ email: z.string().trim().toLowerCase().email() });

/** Passwordless sign-in, step 1: Cognito emails a one-time code. Same reply whether or not the email is known. */
export async function POST(req: Request) {
  if (!guestAuthConfigured()) return error(503, "NOT_CONFIGURED", "Guest sign-in is not configured on this deployment yet");
  try {
    const { email } = await parseBody(req, Body);
    const { session } = await startEmailCode(email);
    return json({ ok: true, session });
  } catch (e) { return error(422, "VALIDATION_ERROR", e instanceof Error ? e.message : "Invalid request"); }
}
