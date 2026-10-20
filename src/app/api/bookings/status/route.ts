import { ticketToken } from "@/server/ticket";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings } from "@/db/schema";
import { getCartToken } from "@/server/cart-cookie";
import { error, handle, json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Booking status after the Stripe redirect — only for the browser that owns the cart. */
export async function GET(req: Request) {
  try {
    const pi = new URL(req.url).searchParams.get("payment_intent");
    if (!pi || !/^pi_[A-Za-z0-9_]+$/.test(pi)) return error(422, "VALIDATION_ERROR", "payment_intent is required");
    const cartToken = await getCartToken();
    if (!cartToken) return error(403, "NO_CART", "No cart for this browser");
    const [b] = await db.select({ ref: bookings.ref, status: bookings.status, total: bookings.total, locale: bookings.locale })
      .from(bookings).where(and(eq(bookings.stripePaymentIntentId, pi), eq(bookings.cartToken, cartToken))).limit(1);
    if (!b) return error(404, "NOT_FOUND", "Booking not found");
    return json({ ...b, ticket: b.status === "confirmed" ? ticketToken(b.ref) : undefined }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return handle(e); }
}
