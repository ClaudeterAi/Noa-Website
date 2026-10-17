import Stripe from "stripe";

let client: Stripe | null = null;

/** Stripe is optional at build time; routes return 503 until keys are configured. */
export function stripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return (client ??= new Stripe(key, { typescript: true }));
}

export const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET;
