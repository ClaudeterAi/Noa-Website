import type { BookingContext, Locale, RenderedEmail, RenderedWhatsApp, Template } from "./types";
import { buildIcs } from "./ics";

/**
 * Bilingual message copy. Arabic is a draft pending a native reviewer (same rule as the site).
 * WhatsApp bodies are the *fallback text* that mirrors the Meta-approved template; the template
 * itself lives in Twilio Content and is referenced by SID from env (see providers/whatsapp.ts).
 */
const PIER = { en: "Dubai Marina Pier, Berth 7", ar: "رصيف مرسى دبي، المرسى 7" };
const SLOT = { morning: { en: "Morning · 9:30 AM – 2:00 PM", ar: "الصباح · 9:30 ص – 2:00 م" }, afternoon: { en: "Afternoon · 2:00 PM – 9:30 PM", ar: "بعد الظهر · 2:00 م – 9:30 م" } };
const CHECKIN = { en: "Check in at the Marina Pier lounge 30 minutes before your arrival time.", ar: "سجّل وصولك في صالة رصيف المرسى قبل 30 دقيقة من موعد وصولك." };

const fmtDate = (d: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" }).format(new Date(`${d}T12:00:00+04:00`));
const aed = (n: number) => `AED ${n.toLocaleString("en-US")}`;
const dir = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

function itemLines(ctx: BookingContext) {
  return ctx.items.map((i) => ctx.locale === "ar"
    ? `• ${i.unitName} — ${fmtDate(i.date, "ar")} — ${SLOT[i.slot].ar} — ${i.guests} ضيف — الوصول ${i.arrivalTime}`
    : `• ${i.unitName} — ${fmtDate(i.date, "en")} — ${SLOT[i.slot].en} — ${i.guests} guest${i.guests > 1 ? "s" : ""} — arrive ${i.arrivalTime}`);
}

function wrapHtml(locale: Locale, title: string, lines: string[]) {
  const body = lines.map((l) => `<p style="margin:0 0 12px;line-height:1.6">${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("");
  return `<!doctype html><html lang="${locale}" dir="${dir(locale)}"><body style="font-family:Georgia,serif;color:#1a1a1a;background:#fff;padding:32px;max-width:560px;margin:auto">
<div style="letter-spacing:.45em;font-size:20px;margin-bottom:28px">NOA</div><h1 style="font-weight:300;font-size:26px;margin:0 0 20px">${title}</h1>${body}
<p style="margin-top:32px;font-size:12px;color:#777">${PIER[locale]} · +971 4 840 0000 · hello@noa-dubai.com</p></body></html>`;
}

export function renderEmail(template: Template, ctx: BookingContext): RenderedEmail {
  const L = ctx.locale;
  const items = itemLines(ctx);
  const first = ctx.items[0];
  switch (template) {
    case "booking_confirmed": {
      const title = L === "ar" ? `تم تأكيد حجزك — ${ctx.ref}` : `Your reservation is confirmed — ${ctx.ref}`;
      const lines = L === "ar"
        ? [`مرحباً ${ctx.guestName}،`, "تم تأكيد مقاعدك في نوا:", ...items, `الإجمالي المدفوع: ${aed(ctx.total)}`, CHECKIN.ar, `الرقم المرجعي: ${ctx.ref}`, "دعوة التقويم مرفقة."]
        : [`Dear ${ctx.guestName},`, "Your seats at NOA are confirmed:", ...items, `Total paid: ${aed(ctx.total)}`, CHECKIN.en, `Reference: ${ctx.ref}`, "A calendar invite is attached."];
      const ics = first ? buildIcs({ uid: ctx.ref, date: first.date, slot: first.slot, summary: `NOA — ${ctx.ref}`, description: items.join("\n"), location: PIER.en, url: ctx.manageUrl }) : undefined;
      return { subject: title, text: lines.join("\n"), html: wrapHtml(L, title, lines), ics: ics ? { filename: `NOA-${ctx.ref}.ics`, content: ics } : undefined };
    }
    case "booking_reminder_24h": {
      const title = L === "ar" ? `نراك غداً في نوا — ${ctx.ref}` : `See you tomorrow at NOA — ${ctx.ref}`;
      const lines = L === "ar"
        ? [`مرحباً ${ctx.guestName}،`, "تذكير بحجزك غداً:", ...items, CHECKIN.ar, "تنطلق القوارب كل 30 دقيقة. أحضر هوية سارية؛ جلسة بعد الظهر للبالغين فقط (+18)."]
        : [`Dear ${ctx.guestName},`, "A reminder of your reservation tomorrow:", ...items, CHECKIN.en, "Shuttles run every 30 minutes. Bring valid ID; the afternoon session is 18+."];
      return { subject: title, text: lines.join("\n"), html: wrapHtml(L, title, lines) };
    }
    case "booking_late_refunded": {
      const title = L === "ar" ? `تم استرداد دفعتك — ${ctx.ref}` : `Your payment has been refunded — ${ctx.ref}`;
      const lines = L === "ar"
        ? [`مرحباً ${ctx.guestName}،`, "وصلت دفعتك بعد انتهاء مهلة حجز المقعد، وتم حجز المقعد لضيف آخر في هذه الأثناء.", `تم استرداد ${aed(ctx.total)} تلقائياً إلى وسيلة الدفع نفسها (3–10 أيام عمل).`, "يسعدنا مساعدتك في اختيار مقعد آخر — رد على هذه الرسالة أو احجز مجدداً على الموقع."]
        : [`Dear ${ctx.guestName},`, "Your payment arrived after the seat hold had expired, and the seat was reserved by another guest in the meantime.", `${aed(ctx.total)} has been refunded automatically to the same payment method (3–10 business days).`, "We would love to help you pick another seat — reply to this email or book again on the site."];
      return { subject: title, text: lines.join("\n"), html: wrapHtml(L, title, lines) };
    }
    case "shuttle_alert": {
      const title = L === "ar" ? `قاربك إلى نوا — ${ctx.ref}` : `Your shuttle to NOA — ${ctx.ref}`;
      const lines = L === "ar" ? [`مرحباً ${ctx.guestName}،`, `قاربك ينطلق من ${PIER.ar}.`, CHECKIN.ar] : [`Dear ${ctx.guestName},`, `Your shuttle departs from ${PIER.en}.`, CHECKIN.en];
      return { subject: title, text: lines.join("\n"), html: wrapHtml(L, title, lines) };
    }
  }
}

/** Twilio Content SIDs are per template × language; configured as env JSON so NOA's approved SIDs can be set without a deploy. */
export function whatsappContentSid(template: Template, locale: Locale): string | null {
  try {
    const map = JSON.parse(process.env.WHATSAPP_CONTENT_SIDS ?? "{}") as Record<string, string>;
    return map[`${template}:${locale}`] ?? map[`${template}:en`] ?? null;
  } catch { return null; }
}

export function renderWhatsApp(template: Template, ctx: BookingContext): RenderedWhatsApp | null {
  const sid = whatsappContentSid(template, ctx.locale);
  if (!sid) return null;
  const first = ctx.items[0];
  const when = first ? `${fmtDate(first.date, ctx.locale)} · ${SLOT[first.slot][ctx.locale]}` : "";
  const email = renderEmail(template, ctx);
  // Variables are positional in Meta templates: {{1}} name, {{2}} reference, {{3}} date/slot, {{4}} total
  return { contentSid: sid, variables: { "1": ctx.guestName, "2": ctx.ref, "3": when, "4": aed(ctx.total) }, fallbackText: email.text };
}
