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
    <Elements stripe={stripePromise} options={{
      clientSecret: props.clientSecret, locale: props.locale,
      // the card form inside Stripe's frame, in the checkout's own look: Barlow, ink, sea focus, rounded fields
      fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&display=swap" }],
      appearance: {
        theme: "stripe",
        variables: { colorPrimary: "#187A80", colorText: "#10384A", colorTextSecondary: "rgba(16,56,74,0.64)", colorBackground: "#ffffff", colorDanger: "#A3392E", fontFamily: "Barlow, system-ui, sans-serif", fontSizeBase: "16px", borderRadius: "14px", spacingUnit: "4px" },
        rules: { ".Input": { border: "1px solid rgba(16,56,74,0.18)", boxShadow: "none", padding: "14px 16px" }, ".Input:focus": { borderColor: "#27A0A1", boxShadow: "0 0 0 4px rgba(39,160,161,0.16)" }, ".Label": { fontWeight: "500" }, ".Tab": { border: "1px solid rgba(16,56,74,0.18)", boxShadow: "none" }, ".Tab--selected": { borderColor: "#10384A", boxShadow: "0 0 0 1px #10384A" } },
      },
    }}>
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
      {err && <p className="form-meta" role="alert" style={{ color: "#A3392E" }}>{err}</p>}
      <button type="button" className="bk-confirm-btn" disabled={!stripe || busy} onClick={pay}>{busy ? labels.paying : labels.pay.replace("{amount}", amountLabel)}</button>
    </div>
  );
}
