import type Stripe from "stripe";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, payments, webhookEvents } from "@/db/schema";
import { confirmBookingByPaymentIntent } from "@/server/booking";
import { enqueueBookingMessages } from "@/server/notifications/outbox";
import { stripe } from "@/server/stripe";

export const runtime = "nodejs";

/**
 * Stripe → NOA. Signature-verified, idempotent (webhook_events PK), never trusts the payload's amount.
 * payment_intent.succeeded → confirm; if the booking's holds expired meanwhile ("late"), refund automatically.
 */
export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return new Response("not configured", { status: 503 });

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(raw, sig ?? "", secret);
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  const inserted = await db.insert(webhookEvents).values({ provider: "stripe", eventId: event.id, type: event.type })
    .onConflictDoNothing().returning({ id: webhookEvents.eventId });
  if (!inserted.length) return new Response("duplicate", { status: 200 });

  try {
    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const [b] = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.stripePaymentIntentId, pi.id));
      if (b) {
        await db.insert(payments).values({
          bookingId: b.id, provider: "stripe", providerId: `${pi.id}:${event.id}`, kind: "charge", amount: pi.amount,
          status: event.type === "payment_intent.succeeded" ? "succeeded" : "failed", raw: pi as unknown as Record<string, unknown>,
        }).onConflictDoNothing();
      }
      if (event.type === "payment_intent.succeeded") {
        const outcome = await confirmBookingByPaymentIntent(pi.id);
        if (outcome === "late") {
          const refund = await s.refunds.create({ payment_intent: pi.id, reason: "requested_by_customer", metadata: { reason: "hold_expired" } }, { idempotencyKey: `late-${pi.id}` });
          if (b) await db.insert(payments).values({ bookingId: b.id, provider: "stripe", providerId: refund.id, kind: "refund", amount: refund.amount, status: "refunded", raw: refund as unknown as Record<string, unknown> }).onConflictDoNothing();
        }
        if (b && outcome === "confirmed") await enqueueBookingMessages(b.id, "booking_confirmed");
        if (b && outcome === "late") await enqueueBookingMessages(b.id, "booking_late_refunded");
      }
    }
    await db.update(webhookEvents).set({ processedAt: sql`now()` }).where(eq(webhookEvents.eventId, event.id));
    return new Response("ok", { status: 200 });
  } catch (e) {
    await db.update(webhookEvents).set({ error: String(e) }).where(eq(webhookEvents.eventId, event.id));
    return new Response("error", { status: 500 }); // Stripe retries with backoff
  }
}
