"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "./api";

/**
 * Stripe returns the guest here after payment. The webhook confirms the booking server-side,
 * so this page polls the status until it settles (confirmed / expired-and-refunded / failed).
 */
export default function Confirmation() {
  const t = useTranslations("booking");
  const locale = useLocale();
  const params = useSearchParams();
  const pi = params.get("payment_intent");
  const redirectStatus = params.get("redirect_status");
  const [state, setState] = useState<{ ref?: string; status: string; total?: number; ticket?: string }>({ status: "checking" });

  useEffect(() => {
    document.body.classList.add("booking-page");
    return () => document.body.classList.remove("booking-page");
  }, []);

  useEffect(() => {
    if (!pi) { setState({ status: "unknown" }); return; }
    if (redirectStatus === "failed") { setState({ status: "failed" }); return; }
    let tries = 0, stop = false;
    const tick = async () => {
      try {
        const s = await api.status(pi);
        if (stop) return;
        setState(s);
        if (s.status === "confirmed" || s.status === "expired" || s.status === "refunded" || s.status === "cancelled") { sessionStorage.removeItem("noa-cart-v2"); return; }
      } catch { if (stop) return; }
      if (++tries < 40) setTimeout(tick, 1500); // ~60 s
    };
    void tick();
    return () => { stop = true; };
  }, [pi, redirectStatus]);

  const body =
    state.status === "confirmed" ? t("confirmedBody")
    : state.status === "expired" || state.status === "refunded" ? t("lateBody")
    : state.status === "failed" ? t("paymentFailed")
    : state.status === "pending" || state.status === "checking" ? t("pendingBody")
    : t("paymentFailed");

  return (
    <main className="bk-result">
      <div className="bk-confirm">
        <h2>{state.status === "confirmed" ? t("confirmed.title") : state.status === "checking" || state.status === "pending" ? t("checking") : t("paymentFailed")}</h2>
        <p>{body}</p>
        {state.ref && <p>{t("confirmed.ref")}: <strong>{state.ref}</strong></p>}
        {state.status === "confirmed" && state.ticket && (
          <div className="ticket-inline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/bookings/qr/${state.ticket}.svg`} alt="" width={180} height={180} />
            <p className="ticket-note"><a href={`/${locale}/booking/ticket?t=${state.ticket}`}>{locale === "ar" ? "افتح سوار الدخول" : "Open your wristband code"}</a> · {locale === "ar" ? "اعرضه عند مكتب الرصيف" : "show it at the pier desk"}</p>
          </div>
        )}
        <Link href={state.status === "confirmed" ? "/" : "/booking"} className="pkg-btn" style={{ background: "#1a1a1a", color: "#fff", display: "inline-block" }} lang={locale}>
          {state.status === "confirmed" ? t("confirmed.back") : t("bookNow")}
        </Link>
      </div>
    </main>
  );
}
