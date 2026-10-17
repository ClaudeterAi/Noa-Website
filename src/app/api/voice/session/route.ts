import { getOrSetCartToken } from "@/server/cart-cookie";
import { getCurrentGuest } from "@/server/guest-session";
import { cart } from "@/server/concierge/tools";
import { error, json } from "@/server/http";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/**
 * Starts a voice session: returns either a signed URL (private agent, server-side API key) or the public
 * agent id, plus the dynamic variables the agent needs (cart token, locale, page, guest context).
 */
export async function POST(req: Request) {
  const agentId = process.env.ELEVENLABS_AGENT_ID ?? process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  if (!agentId) return error(503, "VOICE_NOT_CONFIGURED", "The voice concierge is not configured on this deployment yet");
  const body = (await req.json().catch(() => ({}))) as { locale?: "en" | "ar"; page?: string };
  const locale = body.locale === "ar" ? "ar" : "en";
  const cartToken = await getOrSetCartToken(req);
  const me = await getCurrentGuest();
  const c = await cart({ cartToken, locale, tier: me?.tier ?? "guest" });
  const dynamicVariables: Record<string, string | number | boolean> = {
    cart_token: cartToken, locale, current_page: body.page ?? "/", today: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(new Date()),
    guest_name: me?.name ?? "", guest_tier: me?.tier ?? "guest", cart_items: c.items.length, cart_total_aed: c.total_aed,
    guest_session: (await cookies()).get("noa_guest")?.value ?? "",
  };
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (apiKey) {
    const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`, { headers: { "xi-api-key": apiKey }, cache: "no-store" });
    if (!r.ok) return error(502, "VOICE_UPSTREAM", `ElevenLabs signed-url failed (${r.status})`);
    const { signed_url } = (await r.json()) as { signed_url: string };
    return json({ signedUrl: signed_url, dynamicVariables });
  }
  return json({ agentId, dynamicVariables });
}
