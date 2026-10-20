import { z } from "zod";
import { cookies } from "next/headers";
import { getCurrentGuest } from "@/server/guest-session";
import { requestDeletion } from "@/server/guest-account";
import { CHANNELS, recordConsent } from "@/server/consent";
import { error, json, parseBody } from "@/server/http";

export const runtime = "nodejs";
const Body = z.object({ reason: z.string().trim().max(500).optional() });

/**
 * Delete-my-account request. Marketing on every channel is withdrawn at once and the guest is signed out; the request
 * lands in the admin audit log (guest.delete_request) for staff, because booking and payment records may have to be
 * kept for tax purposes and a person decides what is erased.
 */
export async function POST(req: Request) {
  const me = await getCurrentGuest();
  if (!me) return error(401, "SIGNED_OUT", "Sign in to request deletion");
  let reason: string | undefined;
  try { ({ reason } = await parseBody(req, Body)); } catch { reason = undefined; }
  if (!(await requestDeletion(me.id, reason ?? null))) return error(404, "NOT_FOUND", "Account not found");
  for (const ch of CHANNELS) await recordConsent(me.id, ch, false, "delete_request", req);
  (await cookies()).delete("noa_guest");
  return json({ ok: true });
}
