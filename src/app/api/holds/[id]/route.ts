import { releaseHold } from "@/server/booking";
import { getCartToken } from "@/server/cart-cookie";
import { error, handle, json } from "@/server/http";

export const runtime = "nodejs";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const cartToken = await getCartToken();
    if (!cartToken) return error(403, "NO_CART", "No cart for this browser");
    const ok = await releaseHold(id, cartToken);
    return ok ? json({ released: true }) : error(404, "HOLD_NOT_FOUND", "Hold not found, not yours, or already attached to a booking");
  } catch (e) { return handle(e); }
}
