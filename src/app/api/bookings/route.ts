import { z } from "zod";
import { attachPaymentIntent, cancelBooking, createPendingBooking } from "@/server/booking";
import { getCartToken } from "@/server/cart-cookie";
import { error, handle, json, parseBody } from "@/server/http";
import { stripe } from "@/server/stripe";

export const runtime = "nodejs";

const Body = z.object({
  lines: z.array(z.object({
    holdId: z.string().uuid(),
    guests: z.number().int().min(1).max(12),
    arrivalTime: z.string().regex(/^\d{2}:\d{2}$/),
  })).min(1).max(10),
  guest: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().min(6).max(30),
    marketingOptIn: z.boolean().optional(),
  }),
  locale: z.enum(["en", "ar"]).default("en"),
});

/**
 * Cart → pending booking → Stripe PaymentIntent (AED). Prices come from the DB, never the client.
 * Returns the client secret for the Payment Element. The webhook confirms the booking.
 */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, Body);
    const cartToken = await getCartToken();
    if (!cartToken) return error(403, "NO_CART", "No cart for this browser");
    const s = stripe();
    if (!s) return error(503, "PAYMENTS_NOT_CONFIGURED", "Payments are not configured on this deployment yet");

    const pending = await createPendingBooking(cartToken, body.lines, { ...body.guest, locale: body.locale }, "web");
    try {
      const pi = await s.paymentIntents.create({
        amount: pending.total * 100,                 // AED is a 2-decimal currency; Stripe wants fils
        currency: "aed",
        automatic_payment_methods: { enabled: true }, // cards, Apple Pay, Google Pay; 3-D Secure via Radar
        receipt_email: body.guest.email,
        description: `NOA reservation ${pending.ref}`,
        metadata: { booking_id: pending.bookingId, ref: pending.ref, cart_token: cartToken },
      }, { idempotencyKey: `booking-${pending.bookingId}` });
      await attachPaymentIntent(pending.bookingId, pi.id);
      return json({
        bookingId: pending.bookingId, ref: pending.ref, total: pending.total, subtotal: pending.subtotal, vat: pending.vat,
        currency: "AED", clientSecret: pi.client_secret, holdsExtendedUntil: pending.holdsExtendedUntil,
      }, { status: 201 });
    } catch (e) {
      await cancelBooking(pending.bookingId, "cancelled"); // free the seats if Stripe failed
      throw e;
    }
  } catch (e) { return handle(e); }
}
