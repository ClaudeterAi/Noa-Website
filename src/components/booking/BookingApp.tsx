"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { pick, registry } from "@/content/registry";
import YachtMap from "./YachtMap";
import PaymentPanel, { paymentsConfigured } from "./PaymentPanel";
import { api, isApiError, type CalendarEvent, type UnitAvailability, type UnitTypeInfo } from "./api";
import { useLiveSeats } from "./useLiveSeats";
import GuestSignIn, { useMe, type Me } from "./GuestSignIn";
import { ARRIVALS, DAY_IMG, unitTypes as placeholderTypes, type Slot } from "./inventory";

/* ---------- helpers ---------- */
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromIso = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const aed = (n: number, locale: string) => `AED ${n.toLocaleString(locale === "ar" ? "ar-AE-u-nu-latn" : "en-US")}`;
const mmss = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };

interface CartItem { holdId: string; unitId: string; typeId: string; name: string; img: string; date: string; slot: Slot; guests: number; arrival: string; price: number; expiresAt: string }
const CART_KEY = "noa-cart-v2";

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
  const [avail, setAvail] = useState<Map<string, UnitAvailability>>(new Map());
  const [seatModal, setSeatModal] = useState<{ unitId: string; holdId: string; expiresAt: string } | null>(null);
  const [holding, setHolding] = useState<string | null>(null);
  const [guests, setGuests] = useState(1);
  const [arrival, setArrival] = useState("");
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [details, setDetails] = useState({ name: "", email: "", phone: "" });
  const [me, setMe] = useMe();
  useEffect(() => { if (me?.signedIn && me.guest) setDetails((d) => ({ name: d.name || me.guest!.name || "", email: d.email || me.guest!.email, phone: d.phone || me.guest!.phone || "" })); }, [me]);
  const welcome = (m: Me) => { setMe(m); void refresh(); };   // tier may unlock members-priority seats → re-read availability
  const [payment, setPayment] = useState<{ clientSecret: string; total: number; ref: string; until: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [holdMinutes, setHoldMinutes] = useState(7);
  const [types, setTypes] = useState<Record<string, UnitTypeInfo>>({});
  const skew = useRef(0); // serverTime − clientTime, so the countdown follows the server clock

  /* body class drives the opaque nav (legacy body.booking-page) */
  useEffect(() => { document.body.classList.add("booking-page"); return () => document.body.classList.remove("booking-page"); }, []);
  // deep link from an event or a concierge card: /booking?date=YYYY-MM-DD&slot=night opens the deck plan for that session
  useEffect(() => {
    const q = new URLSearchParams(window.location.search); const d = q.get("date"); const sl = q.get("slot") as Slot | null;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(new Date());
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= today && sl && ["morning", "afternoon", "night", "full"].includes(sl)) { setDate(d); setSlot(sl); setStep(2); }
  }, []);

  /* cart = the server's live holds for this browser (chat and voice fill the same cart); sessionStorage only keeps guest count / arrival choices */
  useEffect(() => {
    (async () => {
      let saved: CartItem[] = [];
      try { saved = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]") as CartItem[]; } catch { /* ignore */ }
      try {
        const r = await fetch(`/api/cart?locale=${locale}`, { credentials: "same-origin", cache: "no-store" });
        const c = (await r.json()) as { items: { hold_id: string; unit_id: string; seat: string; date: string; session: string; price_aed: number; expires_at: string }[] };
        const live: CartItem[] = c.items.map((i) => {
          const prev = saved.find((s) => s.holdId === i.hold_id);
          const slotOf: Slot = /9:30|صباح|Morning/.test(i.session) ? "morning" : "afternoon";
          return prev ? { ...prev, expiresAt: i.expires_at } : { holdId: i.hold_id, unitId: i.unit_id, typeId: "", name: i.seat, img: "", date: i.date, slot: slotOf, guests: 1, arrival: ARRIVALS[slotOf][0], price: i.price_aed, expiresAt: i.expires_at };
        });
        if (live.length) { setCart(live); setDate(live[0].date); setSlot(live[0].slot); setStep(3); }
      } catch { /* offline: keep whatever is in sessionStorage */ }
    })();
  }, [locale]);
  useEffect(() => { try { sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* ignore */ } }, [cart]);
  useEffect(() => { document.body.style.overflow = dayModal || seatModal ? "hidden" : ""; }, [dayModal, seatModal]);

  /* 1-second tick for countdowns */
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const serverNow = now + skew.current;

  /* ---------- availability (poll every 10 s on the map; Day 3 replaces polling with WebSockets) ---------- */
  const refresh = useCallback(async () => {
    if (!date || !slot) return;
    try {
      const r = await api.availability(date, slot);
      skew.current = new Date(r.serverTime).getTime() - Date.now();
      setHoldMinutes(r.holdMinutes);
      setTypes(r.types);
      setAvail(new Map(r.units.map((u) => [u.unitId, u])));
    } catch { /* keep last known state */ }
  }, [date, slot]);
  const inCart = useMemo(() => new Set(cart.map((c) => c.unitId)), [cart]);
  const inCartRef = useRef(inCart); inCartRef.current = inCart;
  /* live pushes: apply seat changes instantly; on reconnect, resync from the server */
  const live = useLiveSeats(step >= 2 ? date : null, step >= 2 ? slot : null, (p) => {
    skew.current = new Date(p.serverTime).getTime() - Date.now();
    setAvail((prev) => {
      const next = new Map(prev);
      for (const c of p.changes) {
        const u = next.get(c.unitId); if (!u) continue;
        const mine = inCartRef.current.has(c.unitId);
        next.set(c.unitId, { ...u, state: mine ? "yours" : c.state, heldUntil: c.heldUntil ?? (c.state === "free" ? undefined : u.heldUntil) });
      }
      return next;
    });
  }, () => void refresh());
  const liveRef = useRef(live); liveRef.current = live;
  useEffect(() => {
    if (step !== 2) return;
    void refresh();
    // poll every 4 s without a live socket, every 30 s with one (safety net)
    const id = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, liveRef.current ? 30_000 : 4_000);
    const onVis = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [step, refresh, live]);

  /** Seat → type info from the database. Images are placeholders keyed by type until media slots are filled (Day 4). */
  const infoOf = useCallback((unitId: string) => {
    const typeId = avail.get(unitId)?.unitTypeId ?? cart.find((c) => c.unitId === unitId)?.typeId;
    const ty = typeId ? types[typeId] : undefined;
    const img = typeId ? placeholderTypes[typeId]?.img ?? "" : "";
    return ty ? { ...ty, name: locale === "ar" ? ty.nameAr : ty.nameEn, desc: locale === "ar" ? ty.descAr : ty.descEn, img } : null;
  }, [avail, cart, types, locale]);
  const taken = useMemo(() => new Set([...avail.values()].filter((u) => (u.state === "held" || u.state === "booked") && !inCart.has(u.unitId)).map((u) => u.unitId)), [avail, inCart]);
  const reserved = useMemo(() => new Set([...avail.values()].filter((u) => u.state === "reserved").map((u) => u.unitId)), [avail]);
  const closed = useMemo(() => new Set([...avail.values()].filter((u) => u.state === "closed").map((u) => u.unitId)), [avail]);

  /* ---------- hold expiry: drop expired items, tell the guest ---------- */
  useEffect(() => {
    const deadline = payment ? new Date(payment.until).getTime() : null;
    const expired = cart.filter((c) => (deadline ?? new Date(c.expiresAt).getTime()) <= serverNow);
    if (!expired.length) return;
    setCart((cc) => cc.filter((c) => !expired.includes(c)));
    setPayment(null);
    setNotice(t("holdExpired"));
    void refresh();
    if (seatModal && expired.some((c) => c.holdId === seatModal.holdId)) setSeatModal(null);
  }, [serverNow, cart, payment, refresh, seatModal, t]);

  const earliest = cart.length ? Math.min(...cart.map((c) => new Date(payment?.until ?? c.expiresAt).getTime())) : null;
  const countdown = earliest ? mmss(earliest - serverNow) : null;

  /* ---------- calendar ---------- */
  const monthLabel = new Intl.DateTimeFormat(fmtLocale, { month: "long", year: "numeric" }).format(new Date(view.y, view.m, 1));
  const prevDisabled = view.y < today.getFullYear() || (view.y === today.getFullYear() && view.m <= today.getMonth());
  const shift = (n: number) => { const d = new Date(view.y, view.m + n, 1); setView({ y: d.getFullYear(), m: d.getMonth() }); };
  const weekdays = t.raw("weekdays") as string[];
  const offset = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const eventsByDate = useMemo(() => Object.fromEntries(Object.values(registry.events).map((e) => [e.date, e])), []);
  const [liveEvents, setLiveEvents] = useState<Record<string, CalendarEvent[]>>({});
  useEffect(() => {
    const month = `${view.y}-${String(view.m + 1).padStart(2, "0")}`;
    api.calendar(month).then((r) => setLiveEvents((prev) => ({ ...prev, ...Object.fromEntries(r.events.reduce((m, e) => m.set(e.date, [...(m.get(e.date) ?? []), e]), new Map<string, CalendarEvent[]>())) }))).catch(() => undefined);
  }, [view.y, view.m]);
  const liveEventTitle = (d: string) => { const e = liveEvents[d]?.[0]; return e ? (locale === "ar" ? e.titleAr ?? e.titleEn : e.titleEn) : null; };
  const dayLabel = (d: Date) => {
    const liveT = liveEventTitle(iso(d)); if (liveT) return liveT;
    const ev = eventsByDate[iso(d)];
    if (ev) return pick(ev.name, locale).replace("\n", " ");
    const wd = new Intl.DateTimeFormat(fmtLocale, { weekday: "long" }).format(d);
    return locale === "ar" ? `نوا ${wd}` : `NOA ${wd}S`;
  };
  const longDate = (s: string) => new Intl.DateTimeFormat(fmtLocale, { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(fromIso(s));
  const shortDate = (s: string) => new Intl.DateTimeFormat(fmtLocale, { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(fromIso(s));
  const goStep = (n: 1 | 2 | 3) => { setStep(n); setNotice(null); window.scrollTo({ top: 0, behavior: "smooth" }); };

  /* ---------- seat → hold → modal ---------- */
  const releaseLabel = (iso: string) => new Intl.DateTimeFormat(fmtLocale, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }).format(new Date(iso));
  const onSeat = async (unitId: string) => {
    if (!date || !slot || holding) return;
    if (inCart.has(unitId)) { goStep(3); return; }
    const u = avail.get(unitId);
    if (u?.state === "closed") { setNotice(t("seatClosed")); return; }
    if (u?.state === "reserved" && u.releaseAt) { setNotice(t("seatReserved", { time: releaseLabel(u.releaseAt) })); return; }
    setTip(null); setHolding(unitId); setNotice(null);
    try {
      const h = await api.hold(date, slot, unitId);
      skew.current = new Date(h.serverTime).getTime() - Date.now();
      const ty = infoOf(unitId);
      setSeatModal({ unitId, holdId: h.holdId, expiresAt: h.expiresAt });
      setGuests(ty?.pax ?? 1); setArrival(ARRIVALS[slot][0]);
    } catch (e) {
      const r = e as { code?: string; message: string };
      const d = (e as { details?: { opensAt?: string } }).details;
      setNotice(r.code === "UNIT_UNAVAILABLE" ? t("seatTaken") : r.code === "UNIT_RESERVED" ? t("seatReserved", { time: u?.releaseAt ? releaseLabel(u.releaseAt) : "" }) : r.code === "CART_LIMIT" ? t("cartLimit")
        : r.code === "SALES_NOT_OPEN" ? t("salesNotOpen", { time: d?.opensAt ? releaseLabel(d.opensAt) : "" }) : r.code === "SALES_CLOSED" ? t("salesClosed") : r.code === "SOLD_OUT" ? t("soldOut") : r.code === "TYPE_NOT_ON_SALE" ? t("seatClosed") : r.message);
      void refresh();
    } finally { setHolding(null); }
  };
  const closeSeatModal = async () => {
    if (!seatModal) return;
    const h = seatModal; setSeatModal(null);
    try { await api.release(h.holdId); } catch { /* already gone */ }
    void refresh();
  };
  const seatType = seatModal ? infoOf(seatModal.unitId) : null;
  const seatPrice = seatModal ? (avail.get(seatModal.unitId)?.price ?? 0) : 0;
  const seatTotal = seatType?.perPerson ? seatPrice * guests : seatPrice;
  const addToCart = () => {
    if (!seatModal || !date || !slot) return;
    const ty = infoOf(seatModal.unitId);
    setCart((c) => [...c, { holdId: seatModal.holdId, unitId: seatModal.unitId, typeId: ty?.id ?? "", name: ty?.name ?? seatModal.unitId, img: ty?.img ?? "", date, slot, guests, arrival, price: seatTotal, expiresAt: seatModal.expiresAt }]);
    setSeatModal(null);
    goStep(3);
  };
  const removeItem = async (c: CartItem) => {
    setCart((cc) => cc.filter((x) => x.holdId !== c.holdId));
    setPayment(null);
    try { await api.release(c.holdId); } catch { /* already gone */ }
  };

  /* ---------- checkout ---------- */
  const subtotal = cart.reduce((s, c) => s + c.price, 0);
  const vat = Math.round(subtotal * 0.05);
  const total = subtotal + vat;
  const totalGuests = cart.reduce((s, c) => s + c.guests, 0);

  const checkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length || busy) return;
    if (!paymentsConfigured) { setNotice(t("paymentsOff")); return; }
    setBusy(true); setNotice(null);
    try {
      const r = await api.book(cart.map((c) => ({ holdId: c.holdId, guests: c.guests, arrivalTime: c.arrival })), details, locale);
      setPayment({ clientSecret: r.clientSecret, total: r.total, ref: r.ref, until: r.holdsExtendedUntil });
    } catch (e) {
      if (isApiError(e, "PAYMENTS_NOT_CONFIGURED")) setNotice(t("paymentsOff"));
      else if (isApiError(e, "UNIT_UNAVAILABLE")) { setNotice(t("seatTaken")); void refresh(); }
      else setNotice((e as Error).message);
    } finally { setBusy(false); }
  };

  const onTipMove = (id: string, e: MouseEvent) => setTip({ id, x: Math.min(e.clientX + 18, window.innerWidth - 300), y: Math.min(e.clientY + 18, window.innerHeight - 250) });
  const slotLabel = (s: Slot) => (s === "morning" ? `${t("morning")} · ${t("morningTime")}` : `${t("afternoon")} · ${t("afternoonTime")}`);
  const legend: [string, React.CSSProperties][] = [
    ["vipBooth", { background: "linear-gradient(#c9a26e,#a67e4e)", borderRadius: "50%" }],
    ["upperCabana", { background: "linear-gradient(#dcb07c,#c99a66)" }],
    ["lounge", { background: "linear-gradient(#d2a776,#bb8f5c)", borderRadius: "8px 8px 2px 2px" }],
    ["cabana", { background: "linear-gradient(#dcb07c,#c99a66)" }],
    ["alfresco", { background: "#f1e8d8", border: "1px solid #5a4a36", borderRadius: "50%" }],
    ["daybed", { background: "linear-gradient(#efe4cf,#e4d5b9)", border: "1px solid #5a4a36" }],
    ["table", { background: "#f1e8d8", border: "1px solid #5a4a36", borderRadius: "50%" }],
    ["sunbed", { background: "linear-gradient(#efe4cf,#e4d5b9)", border: "1px solid #5a4a36", width: 22 }],
    ["entry", { background: "transparent", border: "1px dashed #5a4a36", borderRadius: "50%" }],
    ["sold", { background: "#d8d8d8", border: "1px solid #999", opacity: 0.55 }],
    ["reserved", { background: "#fff", border: "1px solid #5a4a36", backgroundImage: "repeating-linear-gradient(135deg,#5a4a36 0,#5a4a36 1px,#fff 1px,#fff 5px)", opacity: 0.6 }],
  ];
  const yachtLabels = locale === "ar"
    ? { bow: "المقدمة", stern: "المؤخرة", port: "الجانب الأيسر", starboard: "الجانب الأيمن", main: "السطح الرئيسي", upper: "السطح العلوي", locale: "ar" as const }
    : { bow: "BOW", stern: "STERN", port: "PORT", starboard: "STARBOARD", main: "MAIN DECK", upper: "UPPER DECK", locale: "en" as const };
  const [deck, setDeck] = useState<"main" | "upper">("main");

  return (
    <main>
      <div className="bk-progress">
        {(["date", "seats", "pay"] as const).map((k, i) => (
          <div key={k} className={`bk-step-dot${step === i + 1 ? " active" : step > i + 1 ? " done" : ""}`}><div className="dot" /><div className="lbl">{t(`steps.${k}`)}</div></div>
        ))}
      </div>

      {countdown && step !== 1 && (
        <div className="bk-hold-bar" role="status" aria-live="polite">{t("holdTimer", { time: countdown })}</div>
      )}

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
            const open = () => { if (!past) { setDayModal(iso(d)); setPendingSlot(null); } };
            return (
              <div key={i} className={`bk-day${past ? " disabled" : ""}`} role={past ? undefined : "button"} tabIndex={past ? -1 : 0}
                onClick={open} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}>
                <div className="bk-day-n">{String(i + 1).padStart(2, "0")}</div>
                <div className="bk-day-ev" style={{ backgroundImage: `url('${liveEvents[iso(d)]?.[0]?.poster || (ev?.media && registry.media[ev.media]?.url) || DAY_IMG[d.getDay()]}')` }} />
                {liveEvents[iso(d)]?.length ? <div className="bk-day-badge">{liveEvents[iso(d)][0].session === "night" ? t("night") : liveEvents[iso(d)][0].session === "full" ? t("full") : t("event")}</div> : null}
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
        {notice && step === 2 && <p className="form-meta bk-notice" role="alert">{notice}</p>}
        <div className={`bk-map-wrap${holding ? " is-holding" : ""}`}>
          <div className="bk-decks" role="tablist" aria-label={yachtLabels.main + " / " + yachtLabels.upper}>
            {(["main", "upper"] as const).map((d) => <button key={d} type="button" role="tab" aria-selected={deck === d} className={`bk-deck${deck === d ? " on" : ""}`} onClick={() => setDeck(d)}>{d === "main" ? yachtLabels.main : yachtLabels.upper}</button>)}
          </div>
          <YachtMap deck={deck} labels={yachtLabels} taken={taken} mine={inCart} reserved={reserved} closed={closed} onSeatClick={(id) => void onSeat(id)} onSeatMove={onTipMove} onSeatLeave={() => setTip(null)} />
        </div>
        <div className="bk-legend">
          {legend.map(([k, style]) => <span key={k}><span className="bk-legend-swatch" style={style} />{t(`legend.${k}`)}</span>)}
        </div>
        <p className="form-meta" style={{ textAlign: "center", marginTop: 18 }}>{t("holdNote", { minutes: holdMinutes })}</p>
        <div style={{ textAlign: "center", marginTop: 24 }}>
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
          <div>
            {cart.length === 0 ? (
              <div className="bk-cart-empty">{t("cartEmpty")}</div>
            ) : cart.map((c) => {
              return (
                <div className="bk-cart-item" key={c.holdId}>
                  <div className="bk-cart-img" style={{ backgroundImage: `url('${c.img}')` }} />
                  <div>
                    <div className="bk-cart-name">{c.name}</div>
                    <div className="bk-cart-meta">{shortDate(c.date).toUpperCase()} · {(c.slot === "morning" ? t("morning") : t("afternoon")).toUpperCase()} · {t("guest", { count: c.guests })} · {t("arrive")} {c.arrival}</div>
                  </div>
                  <div style={{ textAlign: "end" }}>
                    <div className="bk-cart-price">{aed(c.price, locale)}</div>
                    {!payment && <a className="bk-cart-remove" role="button" tabIndex={0} onClick={() => void removeItem(c)}>{t("remove")}</a>}
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
            <div className="bk-pay-line bk-pay-total"><span>{t("total")}</span><span>{aed(payment?.total ?? total, locale)}</span></div>
            {payment ? (
              <div className="bk-pay-form">
                <h4 className="bk-section-h">{t("paymentMethod")} · {payment.ref}</h4>
                <PaymentPanel clientSecret={payment.clientSecret} amountLabel={aed(payment.total, locale)} locale={locale}
                  returnUrl={`${window.location.origin}/${locale}/booking/confirmation`}
                  labels={{ pay: t("payNow", { amount: "{amount}" }), paying: t("paying"), failed: t("paymentFailed") }} />
              </div>
            ) : (
              <form className="bk-pay-form" onSubmit={checkout}>
                {me?.signedIn && me.guest ? (
                  <p className="bk-cart-meta" style={{ marginBottom: 10 }}>{t("welcomeBack", { name: me.guest.name || me.guest.email })}{me.guest.tier !== "guest" ? ` · ${t(me.guest.tier === "vip" ? "tierVip" : "tierPreferred")}` : ""}{me.lastBooking ? ` · ${t("lastTime", { seat: locale === "ar" ? me.lastBooking.unitNameAr : me.lastBooking.unitName })}` : ""}</p>
                ) : me && !me.signedIn ? <GuestSignIn compact onSignedIn={welcome} /> : null}
                <h4 className="bk-section-h">{t("yourDetails")}</h4>
                <input type="text" name="name" placeholder={t("fullName")} required minLength={2} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
                <input type="email" name="email" placeholder={t("email")} required value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
                <input type="tel" name="phone" placeholder={t("phone")} required minLength={6} value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
                <p className="form-meta">{t("cardSub")}</p>
                {notice && step === 3 && <p className="form-meta" role="alert" style={{ color: "#a33" }}>{notice}</p>}
                <button type="submit" className="bk-confirm-btn" disabled={cart.length === 0 || busy}>{busy ? t("paying") : t("confirm")}</button>
              </form>
            )}
          </aside>
        </div>
      </section>

      {/* tooltip */}
      {tip && slot && infoOf(tip.id) && (() => {
        const ty = infoOf(tip.id)!;
        return (
          <div className="bk-tooltip show" style={{ left: tip.x, top: tip.y }}>
            <div className="bk-tt-img" style={{ backgroundImage: `url('${ty.img}')` }} />
            <div className="bk-tt-row">
              <div className="bk-tt-name">{ty.name.toUpperCase()}</div>
              <div className="bk-tt-pax">{ty.pax} <span style={{ opacity: 0.55 }}>👤</span></div>
              <div className="bk-tt-price">{(avail.get(tip.id)?.price ?? 0).toLocaleString("en-US")}</div>
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
              <div className="bk-modal-tim-lbl">{t("selectTiming")}</div>
              <div className="bk-time-opts">
                {([...(["morning", "afternoon"] as const), ...((liveEvents[dayModal] ?? []).map((e) => e.session).filter((x) => x === "night" || x === "full") as Slot[])] as Slot[]).map((s) => (
                  <button key={s} type="button" className={`bk-time${pendingSlot === s ? " selected" : ""}`} onClick={() => setPendingSlot(s)}>
                    <div className="top">{(s === "night" || s === "full") && liveEvents[dayModal]?.find((e) => e.session === s) ? (locale === "ar" ? liveEvents[dayModal].find((e) => e.session === s)!.titleAr ?? liveEvents[dayModal].find((e) => e.session === s)!.titleEn : liveEvents[dayModal].find((e) => e.session === s)!.titleEn) : t(s)}</div>
                    <div className="bot">{(() => { const e = liveEvents[dayModal]?.find((x) => x.session === s); return e?.startsAt ? `${e.startsAt}${e.endsAt ? ` – ${e.endsAt}` : ""}` : t(`${s}Time`); })()}</div>
                  </button>
                ))}
              </div>
              <button type="button" className="bk-modal-cta" disabled={!pendingSlot} onClick={() => { setDate(dayModal); setSlot(pendingSlot); setDayModal(null); goStep(2); }}>{t("bookNow")}</button>
            </div>
          </div>
        </div>
      )}

      {/* seat modal — the seat is already held for this guest while it is open */}
      {seatModal && seatType && slot && date && (
        <div className="bk-modal open" onClick={(e) => { if (e.target === e.currentTarget) void closeSeatModal(); }}>
          <div className="bk-seat-modal-inner">
            <button type="button" className="bk-modal-close" onClick={() => void closeSeatModal()}>×</button>
            <div className="bk-seat-img-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={seatType.img} alt="" />
              <div className="bk-seat-img-desc">
                <div className="bk-seat-img-name">{seatType.name}</div>
                <div className="bk-seat-img-date">{longDate(date).toUpperCase()}</div>
                <p className="bk-seat-img-text">{seatType.desc}</p>
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
                  <div className="bk-detail-name">{seatType.name}</div>
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
              <div className="bk-total-row">
                <div><div className="bk-total-lbl">{t("total")}</div><div className="bk-total-pax">{t("guestsCount", { count: guests })} · {t("holdTimer", { time: mmss(new Date(seatModal.expiresAt).getTime() - serverNow) })}</div></div>
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
