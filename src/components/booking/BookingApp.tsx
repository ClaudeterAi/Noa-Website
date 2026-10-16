"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { pick, registry } from "@/content/registry";
import YachtMap from "./YachtMap";
import { ARRIVALS, DAY_IMG, mockTaken, priceFor, unitType, type Slot } from "./inventory";

/* ---------- helpers ---------- */
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const aed = (n: number, locale: string) => `AED ${n.toLocaleString(locale === "ar" ? "ar-AE-u-nu-latn" : "en-US")}`;

interface CartItem {
  id: number; unitId: string; date: string; slot: Slot; guests: number; arrival: string; price: number;
}
const CART_KEY = "noa-cart";

export default function BookingApp() {
  const t = useTranslations("booking");
  const locale = useLocale() as Locale;
  const fmtLocale = locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB";
  const today = useMemo(() => startOfDay(new Date()), []);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [dayModal, setDayModal] = useState<string | null>(null);
  const [pendingSlot, setPendingSlot] = useState<Slot | null>(null);
  const [seatModal, setSeatModal] = useState<string | null>(null);
  const [guests, setGuests] = useState(1);
  const [arrival, setArrival] = useState("");
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [details, setDetails] = useState({ name: "", email: "", phone: "" });
  const [payMethod, setPayMethod] = useState<"card" | null>(null);
  const [done, setDone] = useState<{ ref: string; email: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /* body class drives the opaque nav (legacy body.booking-page) */
  useEffect(() => {
    document.body.classList.add("booking-page");
    return () => document.body.classList.remove("booking-page");
  }, []);

  /* cart persistence — same key as the static mock */
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]") as CartItem[];
      if (Array.isArray(saved) && saved.length) { setCart(saved); setStep(3); }
    } catch { /* ignore corrupt storage */ }
  }, []);
  useEffect(() => { try { sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ } }, [cart]);

  useEffect(() => { document.body.style.overflow = dayModal || seatModal ? "hidden" : ""; }, [dayModal, seatModal]);

  const taken = useMemo(() => (date ? mockTaken(fromIso(date)) : new Set<string>()), [date]);

  /* ---------- calendar ---------- */
  const monthLabel = new Intl.DateTimeFormat(fmtLocale, { month: "long", year: "numeric" }).format(new Date(view.y, view.m, 1));
  const prevDisabled = view.y < today.getFullYear() || (view.y === today.getFullYear() && view.m <= today.getMonth());
  const shift = (n: number) => { const d = new Date(view.y, view.m + n, 1); setView({ y: d.getFullYear(), m: d.getMonth() }); };
  const weekdays = t.raw("weekdays") as string[];
  const firstDow = new Date(view.y, view.m, 1).getDay();
  const offset = (firstDow + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const eventsByDate = useMemo(() => Object.fromEntries(Object.values(registry.events).map((e) => [e.date, e])), []);
  const dayLabel = (d: Date) => {
    const ev = eventsByDate[iso(d)];
    if (ev) return pick(ev.name, locale).replace("\n", " ");
    const wd = new Intl.DateTimeFormat(fmtLocale, { weekday: "long" }).format(d);
    return locale === "ar" ? `نوا ${wd}` : `NOA ${wd}S`;
  };
  const longDate = (s: string) => new Intl.DateTimeFormat(fmtLocale, { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(fromIso(s));
  const shortDate = (s: string) => new Intl.DateTimeFormat(fmtLocale, { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(fromIso(s));

  const goStep = (n: 1 | 2 | 3) => { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

  /* ---------- seat modal ---------- */
  const openSeat = (id: string) => {
    const ty = unitType(id);
    setSeatModal(id); setGuests(ty.pax); setArrival(ARRIVALS[slot!][0]); setTip(null);
  };
  const seatType = seatModal ? unitType(seatModal) : null;
  const seatPrice = seatType && slot ? priceFor(seatType, slot) : 0;
  const seatTotal = seatType?.perPerson ? seatPrice * guests : seatPrice;

  const addToCart = () => {
    if (!seatModal || !date || !slot) return;
    setCart((c) => [...c, { id: Date.now(), unitId: seatModal, date, slot, guests, arrival, price: seatTotal }]);
    setSeatModal(null);
    goStep(3);
  };

  const subtotal = cart.reduce((s, c) => s + c.price, 0);
  const vat = Math.round(subtotal * 0.05);
  const total = subtotal + vat;
  const totalGuests = cart.reduce((s, c) => s + c.guests, 0);

  const onTipMove = (id: string, e: MouseEvent) => {
    setTip({ id, x: Math.min(e.clientX + 18, window.innerWidth - 300), y: Math.min(e.clientY + 18, window.innerHeight - 250) });
  };

  const confirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payMethod) { setNotice(t("choosePayment")); return; }
    const ref = "NOA-" + Date.now().toString(36).toUpperCase();
    setDone({ ref, email: details.email });
    setCart([]);
    sessionStorage.removeItem(CART_KEY);
  };

  const slotLabel = (s: Slot) => (s === "morning" ? `${t("morning")} · ${t("morningTime")}` : `${t("afternoon")} · ${t("afternoonTime")}`);
  const legend: [string, React.CSSProperties][] = [
    ["cabana", { background: "#d9b78b" }], ["frontCabana", { background: "#5d4d44" }],
    ["daybed", { backgroundImage: "repeating-linear-gradient(45deg,#1a1a1a 0,#1a1a1a 1px,#ede4d3 1px,#ede4d3 4px)" }],
    ["sunbed", { backgroundImage: "repeating-linear-gradient(45deg,#1a1a1a 0,#1a1a1a 1px,#ead8b8 1px,#ead8b8 4px)" }],
    ["jacuzzi", { background: "#cfe2e8", borderRadius: "50%" }], ["vip", { background: "#b08866" }],
    ["balcony", { background: "#7aa6a8" }], ["dj", { background: "#c9a875" }],
    ["entry", { background: "#fff", border: "1px dashed #1a1a1a", borderRadius: "50%" }],
    ["sold", { background: "#d8d8d8", border: "1px solid #999", opacity: 0.55 }],
  ];
  const yachtLabels = locale === "ar"
    ? { upperDeck: "السطح العلوي", stairs: "الدرج ↓", sundeck: "سطح الشمس", jacuzzi: "جاكوزي", vipLounge: "صالة VIP", balcony: "الشرفة", dj: "دي جيه", pool: "المسبح", poolSub: "22 م · مياه مالحة · حافة لا متناهية", entry: "الدخول" }
    : { upperDeck: "UPPER DECK", stairs: "STAIRS ↓", sundeck: "SUNDECK", jacuzzi: "JACUZZI", vipLounge: "VIP LOUNGE", balcony: "BALCONY", dj: "DJ", pool: "POOL", poolSub: "22m · saltwater · infinity edge", entry: "ENTRY" };

  return (
    <main>
      {/* progress */}
      <div className="bk-progress">
        {(["date", "seats", "pay"] as const).map((k, i) => (
          <div key={k} className={`bk-step-dot${step === i + 1 ? " active" : step > i + 1 ? " done" : ""}`}><div className="dot" /><div className="lbl">{t(`steps.${k}`)}</div></div>
        ))}
      </div>

      {/* STEP 1 — calendar */}
      <section id="bkStep1" className={`bk-step-section${step === 1 ? " active" : ""}`}>
        <h1 className="bk-h1">{t("chooseDay")}</h1>
        <div className="bk-month-bar">
          <div className="bk-month-sel"><span>{monthLabel.toUpperCase()}</span><span className="arrow">⌄</span></div>
          <div className="bk-month-nav">
            <button type="button" onClick={() => shift(-1)} disabled={prevDisabled}>{t("prev")}</button>
            <button type="button" onClick={() => shift(1)}>{t("next")}</button>
          </div>
        </div>
        <div className="bk-cal-head">{weekdays.map((w) => <div key={w}>{w}</div>)}</div>
        <div className="bk-cal">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} className="bk-day empty" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = new Date(view.y, view.m, i + 1);
            const past = d < today;
            const ev = eventsByDate[iso(d)];
            return (
              <div key={i} className={`bk-day${past ? " disabled" : ""}`} role={past ? undefined : "button"} tabIndex={past ? -1 : 0}
                onClick={() => { if (!past) { setDayModal(iso(d)); setPendingSlot(null); } }}
                onKeyDown={(e) => { if (!past && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setDayModal(iso(d)); setPendingSlot(null); } }}>
                <div className="bk-day-n">{String(i + 1).padStart(2, "0")}</div>
                <div className="bk-day-ev" style={{ backgroundImage: `url('${(ev?.media && registry.media[ev.media]?.url) || DAY_IMG[d.getDay()]}')` }} />
                <div className="bk-day-ev-label">{dayLabel(d).toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* STEP 2 — seat map */}
      <section id="bkStep2" className={`bk-step-section${step === 2 ? " active" : ""}`}>
        <div className="bk-floor-head">
          <button type="button" className="bk-floor-back" onClick={() => goStep(1)}>{t("changeDate")}</button>
          <h2 className="bk-floor-h">{t("hoverMap")}</h2>
          <div className="bk-floor-date">{date && slot ? `${shortDate(date).toUpperCase()} · ${slotLabel(slot).toUpperCase()}` : ""}</div>
        </div>
        <div className="bk-map-wrap">
          <YachtMap labels={yachtLabels} taken={taken} onSeatClick={openSeat} onSeatMove={onTipMove} onSeatLeave={() => setTip(null)} />
        </div>
        <div className="bk-legend">
          {legend.map(([k, style]) => <span key={k}><span className="bk-legend-swatch" style={style} />{t(`legend.${k}`)}</span>)}
        </div>
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <button type="button" className="bk-floor-next" onClick={() => (cart.length ? goStep(3) : setNotice(t("pickSeatFirst")))}>{t("proceed")}</button>
        </div>
      </section>

      {/* STEP 3 — review & pay */}
      <section id="bkStep3" className={`bk-step-section${step === 3 ? " active" : ""}`}>
        <div style={{ maxWidth: 1100, margin: "0 auto 30px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button type="button" className="bk-floor-back" onClick={() => (date && slot ? goStep(2) : goStep(1))}>{t("addAnother")}</button>
          <h2 className="bk-floor-h" style={{ flex: 1, textAlign: "center" }}>{t("reviewPay")}</h2>
          <span />
        </div>
        <div className="bk-review-wrap">
          {done ? (
            <div className="bk-confirm" style={{ gridColumn: "1/-1" }}>
              <h2>{t("confirmed.title")}</h2>
              <p>{t("confirmed.body", { email: done.email })} {t("confirmed.ref")}: <strong>{done.ref}</strong></p>
              <p className="form-meta">{t("confirmed.mock")}</p>
              <Link href="/" className="pkg-btn" style={{ background: "#1a1a1a", color: "#fff", display: "inline-block" }}>{t("confirmed.back")}</Link>
            </div>
          ) : (
            <>
              <div>
                {cart.length === 0 ? (
                  <div className="bk-cart-empty">{t("cartEmpty")}</div>
                ) : cart.map((c, i) => {
                  const ty = unitType(c.unitId);
                  return (
                    <div className="bk-cart-item" key={c.id}>
                      <div className="bk-cart-img" style={{ backgroundImage: `url('${ty.img}')` }} />
                      <div>
                        <div className="bk-cart-name">{pick(ty.name, locale)}</div>
                        <div className="bk-cart-meta">{shortDate(c.date).toUpperCase()} · {(c.slot === "morning" ? t("morning") : t("afternoon")).toUpperCase()} · {t("guest", { count: c.guests })} · {t("arrive")} {c.arrival}</div>
                      </div>
                      <div style={{ textAlign: "end" }}>
                        <div className="bk-cart-price">{aed(c.price, locale)}</div>
                        <a className="bk-cart-remove" role="button" tabIndex={0} onClick={() => setCart((cc) => cc.filter((_, j) => j !== i))}>{t("remove")}</a>
                      </div>
                    </div>
                  );
                })}
              </div>
              <aside className="bk-pay-panel">
                <h3 className="bk-pay-h">{t("orderSummary")}</h3>
                <div className="bk-pay-line"><span>{t("subtotal")}</span><span>{aed(subtotal, locale)}</span></div>
                <div className="bk-pay-line"><span>{t("vat")}</span><span>{aed(vat, locale)}</span></div>
                <div className="bk-pay-line"><span>{t("guests")}</span><span>{totalGuests}</span></div>
                <div className="bk-pay-line bk-pay-total"><span>{t("total")}</span><span>{aed(total, locale)}</span></div>
                <form className="bk-pay-form" onSubmit={confirm}>
                  <h4 className="bk-section-h">{t("yourDetails")}</h4>
                  <input type="text" name="name" placeholder={t("fullName")} required value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
                  <input type="email" name="email" placeholder={t("email")} required value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                  <input type="tel" name="phone" placeholder={t("phone")} required value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
                  <h4 className="bk-section-h">{t("paymentMethod")}</h4>
                  <div className="bk-pay-methods">
                    <button type="button" className={`bk-pay-opt${payMethod === "card" ? " selected" : ""}`} onClick={() => { setPayMethod("card"); setNotice(null); }}>
                      <div className="bk-pay-opt-icon">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                      </div>
                      <div className="bk-pay-opt-text">
                        <div className="bk-pay-opt-lbl">{t("card")}</div>
                        <div className="bk-pay-opt-sub">{t("cardSub")}</div>
                      </div>
                    </button>
                  </div>
                  <div className={`bk-pay-detail${payMethod === "card" ? " show" : ""}`}>
                    {/* Day 2 mounts the Stripe Payment Element here. No card data is ever typed into this site. */}
                    <p className="form-meta" data-stripe-mount="payment-element">{t("cardNote")}</p>
                  </div>
                  {notice && <p className="form-meta" role="alert" style={{ color: "#a33" }}>{notice}</p>}
                  <button type="submit" className="bk-confirm-btn" disabled={cart.length === 0}>{t("confirm")}</button>
                </form>
              </aside>
            </>
          )}
        </div>
      </section>

      {/* tooltip */}
      {tip && slot && (() => {
        const ty = unitType(tip.id);
        return (
          <div className="bk-tooltip show" style={{ left: tip.x, top: tip.y }}>
            <div className="bk-tt-img" style={{ backgroundImage: `url('${ty.img}')` }} />
            <div className="bk-tt-row">
              <div className="bk-tt-name">{pick(ty.name, locale).toUpperCase()}</div>
              <div className="bk-tt-pax">{ty.pax} <span style={{ opacity: 0.55 }}>👤</span></div>
              <div className="bk-tt-price">{priceFor(ty, slot).toLocaleString("en-US")}</div>
            </div>
            <div className="bk-tt-btn">{t("viewMore")}</div>
          </div>
        );
      })()}

      {/* day modal */}
      {dayModal && (
        <div className="bk-modal open" onClick={(e) => { if (e.target === e.currentTarget) setDayModal(null); }}>
          <div className="bk-modal-inner">
            <button type="button" className="bk-modal-close" onClick={() => setDayModal(null)}>×</button>
            <div className="bk-modal-img" style={{ backgroundImage: `url('${DAY_IMG[fromIso(dayModal).getDay()]}')` }} />
            <div className="bk-modal-body">
              <div className="bk-modal-tag">{longDate(dayModal).toUpperCase()}</div>
              <h3 className="bk-modal-event">{dayLabel(fromIso(dayModal)).toUpperCase()}</h3>
              <div className="bk-modal-avail"><span className="ok">{t("ticketsAvailable")}</span><span className="warn">{t("fewLeft")}</span></div>
              <div className="bk-modal-tim-lbl">{t("selectTiming")}</div>
              <div className="bk-time-opts">
                {(["morning", "afternoon"] as const).map((s) => {
                  const soldOut = s === "morning" && fromIso(dayModal).getDay() === 0; // mock rule carried over from the static site
                  return (
                    <button key={s} type="button" className={`bk-time${pendingSlot === s ? " selected" : ""}${soldOut ? " sold-out" : ""}`} disabled={soldOut} onClick={() => setPendingSlot(s)}>
                      <div className="top">{t(s)}</div>
                      <div className="bot">{soldOut ? t("soldOut") : t(`${s}Time`)}</div>
                    </button>
                  );
                })}
              </div>
              <button type="button" className="bk-modal-cta" disabled={!pendingSlot} onClick={() => { setDate(dayModal); setSlot(pendingSlot); setDayModal(null); goStep(2); }}>{t("bookNow")}</button>
            </div>
          </div>
        </div>
      )}

      {/* seat modal */}
      {seatModal && seatType && slot && date && (
        <div className="bk-modal open" onClick={(e) => { if (e.target === e.currentTarget) setSeatModal(null); }}>
          <div className="bk-seat-modal-inner">
            <button type="button" className="bk-modal-close" onClick={() => setSeatModal(null)}>×</button>
            <div className="bk-seat-img-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={seatType.img} alt="" />
              <div className="bk-seat-img-desc">
                <div className="bk-seat-img-name">{pick(seatType.name, locale)}</div>
                <div className="bk-seat-img-date">{longDate(date).toUpperCase()}</div>
                <p className="bk-seat-img-text">{pick(seatType.desc, locale)}</p>
              </div>
            </div>
            <div className="bk-seat-info-col">
              <div className="bk-pkg-row">
                <div>
                  <div className="bk-pkg-name">{slot === "morning" ? t("morningPkg") : t("afternoonPkg")}</div>
                  <div className="bk-pkg-time">{slot === "morning" ? t("morningTime") : t("afternoonTime")}</div>
                </div>
                <div className="bk-pkg-vibe"><span>{slot === "morning" ? t("chill") : t("party")}</span></div>
              </div>
              <div className="bk-detail-row">
                <div>
                  <div className="bk-detail-name">{pick(seatType.name, locale)}</div>
                  <div className="bk-detail-fb">{seatType.perPerson ? t("noMinimum") : t("includesCredit", { amount: (seatPrice / 2).toLocaleString("en-US") })}</div>
                </div>
                <div className="bk-field">
                  <label htmlFor="sm-guest">{t("guestLabel")}</label>
                  <select id="sm-guest" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                    {Array.from({ length: seatType.pax }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </div>
                <div className="bk-field">
                  <label htmlFor="sm-arrival">{t("arrivalTime")}</label>
                  <select id="sm-arrival" value={arrival} onChange={(e) => setArrival(e.target.value)}>
                    {ARRIVALS[slot].map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div className="bk-price-row"><div className="bk-price-lbl">{t("price")}</div><div className="bk-price-val">{aed(seatPrice, locale)}</div></div>
              <div className="bk-addon"><span>{t("addons")}</span><span>⌄</span></div>
              <div className="bk-total-row">
                <div><div className="bk-total-lbl">{t("total")}</div><div className="bk-total-pax">{t("guestsCount", { count: guests })}</div></div>
                <div className="bk-total-val">{aed(seatTotal, locale)}</div>
              </div>
              <button type="button" className="bk-add-cart" onClick={addToCart}>{t("addToCart")}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
