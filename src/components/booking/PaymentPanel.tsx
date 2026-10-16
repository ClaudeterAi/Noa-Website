"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

export const paymentsConfigured = !!pk;

interface Props { clientSecret: string; amountLabel: string; returnUrl: string; labels: { pay: string; paying: string; failed: string }; locale: "en" | "ar" }

/** Stripe Payment Element: cards, Apple Pay, Google Pay; 3-D Secure handled by Stripe. No card data touches our servers. */
export default function PaymentPanel(props: Props) {
  if (!stripePromise) return null;
  return (
    <Elements stripe={stripePromise} options={{ clientSecret: props.clientSecret, locale: props.locale, appearance: { theme: "flat", variables: { colorPrimary: "#1a1a1a", fontFamily: "inherit", borderRadius: "0" } } }}>
      <Inner {...props} />
    </Elements>
  );
}

function Inner({ amountLabel, returnUrl, labels }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true); setErr(null);
    const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl } });
    if (error) { setErr(error.message ?? labels.failed); setBusy(false); }
    // on success Stripe redirects to return_url; the webhook confirms the booking server-side
  };
  return (
    <div className="bk-pay-detail show">
      <PaymentElement options={{ layout: "tabs" }} />
      {err && <p className="form-meta" role="alert" style={{ color: "#a33" }}>{err}</p>}
      <button type="button" className="bk-confirm-btn" disabled={!stripe || busy} onClick={pay}>{busy ? labels.paying : labels.pay.replace("{amount}", amountLabel)}</button>
    </div>
  );
}
