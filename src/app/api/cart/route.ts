import { cart } from "@/server/concierge/tools";
import { getCartToken } from "@/server/cart-cookie";
import { getCurrentGuest } from "@/server/guest-session";
import { json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The browser's live holds (server truth) — lets /booking restore a cart filled by chat or voice. */
export async function GET(req: Request) {
  const cartToken = await getCartToken();
  const locale = new URL(req.url).searchParams.get("locale") === "ar" ? "ar" : "en";
  if (!cartToken) return json({ items: [], subtotal_aed: 0, vat_aed: 0, total_aed: 0, expires_at: null });
  const me = await getCurrentGuest();
  return json(await cart({ cartToken, locale, tier: me?.tier ?? "guest" }), { headers: { "Cache-Control": "no-store" } });
}
