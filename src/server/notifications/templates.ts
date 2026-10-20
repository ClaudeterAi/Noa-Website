import type { BookingContext, Locale, RenderedEmail, RenderedWhatsApp, Template } from "./types";
import { buildIcs } from "./ics";

/**
 * Bilingual message copy. Arabic is a draft pending a native reviewer (same rule as the site).
 * WhatsApp bodies are the *fallback text* that mirrors the Meta-approved template; the template
 * itself lives in Twilio Content and is referenced by SID from env (see providers/whatsapp.ts).
 */
const PIER = { en: "Dubai Marina Pier, Berth 7", ar: "رصيف مرسى دبي، المرسى 7" };
const SLOT = { morning: { en: "Morning · 9:30 AM – 2:00 PM", ar: "الصباح · 9:30 ص – 2:00 م" }, afternoon: { en: "Afternoon · 2:00 PM – 9:30 PM", ar: "بعد الظهر · 2:00 م – 9:30 م" }, night: { en: "Night session", ar: "الجلسة الليلية" }, full: { en: "Full day", ar: "يوم كامل" } } as const;
const CHECKIN = { en: "Check in at the NOA desk on Dubai Marina Pier, Berth 7, twenty minutes before your session.", ar: "سجّل وصولك عند مكتب نوا على رصيف مرسى دبي، المرسى 7، قبل جلستك بعشرين دقيقة." };

const fmtDate = (d: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" }).format(new Date(`${d}T12:00:00+04:00`));
const aed = (n: number) => `AED ${n.toLocaleString("en-US")}`;
const dir = (l: Locale) => (l === "ar" ? "rtl" : "ltr");

function itemLines(ctx: BookingContext) {
  return ctx.items.map((i) => ctx.locale === "ar"
    ? `• ${i.unitName} · ${fmtDate(i.date, "ar")} · ${SLOT[i.slot].ar} · ${i.guests} ضيف · الوصول ${i.arrivalTime}`
    : `• ${i.unitName} · ${fmtDate(i.date, "en")} · ${SLOT[i.slot].en} · ${i.guests} guest${i.guests > 1 ? "s" : ""} · arrive ${i.arrivalTime}`);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** The ticket, email-safe (tables, inline styles): small event image and title, date, time, seats, QR, venue, rules. */
/** Short HTML intro used above the ticket (the ticket itself carries the details). */
function ticketIntro(ctx: BookingContext, kind: "confirmed" | "reminder"): string[] {
  const ar = ctx.locale === "ar";
  if (kind === "confirmed") return ar ? [`عزيزي ${ctx.guestName}،`, "تم تأكيد مقاعدك في نوا. تذكرتك أدناه، احتفظ بها لعرضها عند الرصيف.", `المبلغ المدفوع: ${aed(ctx.total)}. دعوة التقويم مرفقة.`]
    : [`Dear ${ctx.guestName},`, "Your seats at NOA are confirmed. Your ticket is below; keep it to show at the pier.", `Total paid: ${aed(ctx.total)}. A calendar invite is attached.`];
  return ar ? [`عزيزي ${ctx.guestName}،`, "نراك غداً. تذكرتك أدناه."] : [`Dear ${ctx.guestName},`, "See you tomorrow. Your ticket is below."];
}

function ticketHtml(ctx: BookingContext): string {
  const t = ctx.ticket; if (!t) return qrBlock(ctx);
  const ar = t.locale === "ar"; const al = ar ? "right" : "left";
  const L = ar ? { date: "التاريخ", time: "الوقت", seats: "المقاعد", guests: "الضيوف", venue: "المكان", rules: "قبل أن تأتي", show: "اعرض هذا الرمز عند مكتب الرصيف", open: "افتح التذكرة", map: "الخريطة" }
               : { date: "Date", time: "Time", seats: "Seats", guests: "Guests", venue: "Venue", rules: "Before you come", show: "Show this code at the pier desk", open: "Open ticket", map: "Map" };
  const cell = (k: string, v: string) => `<td valign="top" style="padding:0 0 14px;width:50%;text-align:${al}"><div style="font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:#7a8a90;margin-bottom:3px">${k}</div><div style="font-size:14px;color:#10384A;line-height:1.35">${esc(v)}</div></td>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0;border:1px solid #e5ded2;border-radius:12px;border-collapse:separate;overflow:hidden" dir="${ar ? "rtl" : "ltr"}">
<tr><td style="padding:20px 20px 12px"><table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td width="84" valign="top"><img src="${esc(t.image)}" width="76" height="96" alt="" style="display:block;width:76px;height:96px;object-fit:cover;border-radius:6px;border:0" /></td>
<td valign="middle" style="padding-${ar ? "right" : "left"}:14px;text-align:${al}"><div style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#7a8a90">NOA · ${esc(t.slotLabel)}</div>
<div style="font-size:20px;letter-spacing:.08em;text-transform:uppercase;color:#156A89;margin:4px 0 2px;line-height:1.15">${esc(t.title)}</div>${t.subtitle ? `<div style="font-size:13px;color:#10384A">${esc(t.subtitle)}</div>` : ""}</td>
</tr></table></td></tr>
<tr><td style="padding:4px 20px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cell(L.date, t.dateLabel)}${cell(L.time, t.timeLabel)}</tr><tr>${cell(L.seats, t.seats.map((s) => `${s.label} · ${s.name}`).join(", "))}${cell(L.guests, String(t.totalGuests))}</tr></table></td></tr>
<tr><td style="padding:0 20px"><div style="border-top:1px dashed #c9d3d6"></div></td></tr>
<tr><td align="center" style="padding:18px 20px 16px"><img src="${esc(t.qrPng)}" width="200" height="200" alt="${esc(t.ref)}" style="display:block;margin:0 auto 8px;border:0" />
<div style="font-size:17px;letter-spacing:.2em;color:#156A89">${esc(t.ref)}</div><div style="font-size:13px;color:#10384A;margin:2px 0 6px">${esc(t.guestName)}</div>
<div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#7a8a90;margin-bottom:12px">${L.show}</div>
<a href="${esc(t.ticketUrl)}" style="display:inline-block;padding:10px 22px;background:#156A89;color:#fff;text-decoration:none;border-radius:28px;font-size:13px;letter-spacing:.08em">${L.open}</a></td></tr>
<tr><td style="padding:0 20px"><div style="border-top:1px dashed #c9d3d6"></div></td></tr>
<tr><td style="padding:16px 20px 4px;text-align:${al}"><div style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#7a8a90;margin-bottom:6px">${L.venue}</div>
<div style="font-size:14px;color:#156A89;margin-bottom:4px">${esc(t.venue.name)}</div><div style="font-size:13px;color:#10384A;line-height:1.5">${esc(t.venue.line)}<br />${esc(t.boarding)} · ${esc(t.lastBoat)}</div>
<a href="${esc(t.venue.mapUrl)}" style="display:inline-block;margin-top:6px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#156A89">${L.map} →</a></td></tr>
<tr><td style="padding:14px 20px 20px;text-align:${al}"><div style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#7a8a90;margin-bottom:6px">${L.rules}</div>
${t.rules.map((r) => `<div style="font-size:13px;color:#10384A;line-height:1.5;margin-bottom:6px">· ${esc(r)}</div>`).join("")}</td></tr>
</table>`;
}

/** The wristband block: QR image the pier desk scans, and a button to the wristband page. */
function qrBlock(ctx: BookingContext) {
  if (!ctx.qrImageUrl || !ctx.ticketUrl) return "";
  const ar = ctx.locale === "ar";
  return `<div style="margin:28px 0;padding:24px;border:1px solid #e5ded2;text-align:center">
<div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#777;margin-bottom:12px">${ar ? "سوار الدخول" : "Your wristband code"}</div>
<img src="${ctx.qrImageUrl}" width="220" height="220" alt="${ar ? "رمز الدخول" : "Entry code"} ${ctx.ref}" style="display:block;margin:0 auto 12px;border:0" />
<div style="font-size:13px;color:#555;margin-bottom:16px">${ar ? "اعرض هذا الرمز عند مكتب الرصيف، المرسى 7." : "Show this code at the pier desk, Berth 7."}</div>
<a href="${ctx.ticketUrl}" style="display:inline-block;padding:10px 22px;background:#156A89;color:#fff;text-decoration:none;border-radius:28px;font-size:13px;letter-spacing:.08em">${ar ? "افتح سوار الدخول" : "Open wristband"}</a>
</div>`;
}

function wrapHtml(locale: Locale, title: string, lines: string[], extra = "") {
  const body = lines.map((l) => `<p style="margin:0 0 12px;line-height:1.6">${l.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>`).join("");
  return `<!doctype html><html lang="${locale}" dir="${dir(locale)}"><body style="font-family:Georgia,serif;color:#1a1a1a;background:#fff;padding:32px;max-width:560px;margin:auto">
<div style="letter-spacing:.45em;font-size:20px;margin-bottom:28px">NOA</div><h1 style="font-weight:300;font-size:26px;margin:0 0 20px">${title}</h1>${body}${extra}
<p style="margin-top:32px;font-size:12px;color:#777">${PIER[locale]} · +971 4 840 0000 · hello@noa-dubai.com</p></body></html>`;
}

export function renderEmail(template: Template, ctx: BookingContext): RenderedEmail {
  const L = ctx.locale;
  const items = itemLines(ctx);
  const first = ctx.items[0];
  switch (template) {
    case "booking_confirmed": {
      const title = L === "ar" ? `تم تأكيد حجزك · ${ctx.ref}` : `Your reservation is confirmed · ${ctx.ref}`;
      const lines = L === "ar"
        ? [`مرحباً ${ctx.guestName}،`, "تم تأكيد مقاعدك في نوا:", ...items, `الإجمالي المدفوع: ${aed(ctx.total)}`, CHECKIN.ar, `الرقم المرجعي: ${ctx.ref}`, ...(ctx.ticketUrl ? [`رمز سوار الدخول: ${ctx.ticketUrl}`] : []), "دعوة التقويم مرفقة."]
        : [`Dear ${ctx.guestName},`, "Your seats at NOA are confirmed:", ...items, `Total paid: ${aed(ctx.total)}`, CHECKIN.en, `Reference: ${ctx.ref}`, ...(ctx.ticketUrl ? [`Your wristband code: ${ctx.ticketUrl}`] : []), "A calendar invite is attached."];
      const ics = first ? buildIcs({ uid: ctx.ref, date: first.date, slot: first.slot, summary: `NOA · ${ctx.ref}`, description: items.join("\n"), location: PIER.en, url: ctx.manageUrl }) : undefined;
      return { subject: title, text: lines.join("\n"), html: wrapHtml(L, title, ctx.ticket ? ticketIntro(ctx, "confirmed") : lines, ticketHtml(ctx)), ics: ics ? { filename: `NOA-${ctx.ref}.ics`, content: ics } : undefined };
    }
    case "booking_reminder_24h": {
      const title = L === "ar" ? `نراك غداً في نوا · ${ctx.ref}` : `See you tomorrow at NOA · ${ctx.ref}`;
      let lines = L === "ar"
        ? [`مرحباً ${ctx.guestName}،`, "تذكير بحجزك غداً:", ...items, CHECKIN.ar, "تنطلق القوارب كل 30 دقيقة. أحضر هوية سارية؛ جلسة بعد الظهر للبالغين فقط (+18)."]
        : [`Dear ${ctx.guestName},`, "A reminder of your reservation tomorrow:", ...items, CHECKIN.en, "Shuttles run every 30 minutes. Bring valid ID; the afternoon session is 18+."];
      if (ctx.ticketUrl) lines.push(L === "ar" ? `رمز سوار الدخول: ${ctx.ticketUrl}` : `Your wristband code: ${ctx.ticketUrl}`);
      return { subject: title, text: lines.join("\n"), html: wrapHtml(L, title, ctx.ticket ? ticketIntro(ctx, "reminder") : lines, ticketHtml(ctx)) };
    }
    case "booking_late_refunded": {
      const title = L === "ar" ? `تم استرداد دفعتك · ${ctx.ref}` : `Your payment has been refunded · ${ctx.ref}`;
      const lines = L === "ar"
        ? [`مرحباً ${ctx.guestName}،`, "وصلت دفعتك بعد انتهاء مهلة حجز المقعد، وتم حجز المقعد لضيف آخر في هذه الأثناء.", `تم استرداد ${aed(ctx.total)} تلقائياً إلى وسيلة الدفع نفسها (3–10 أيام عمل).`, "يسعدنا مساعدتك في اختيار مقعد آخر · رد على هذه الرسالة أو احجز مجدداً على الموقع."]
        : [`Dear ${ctx.guestName},`, "Your payment arrived after the seat hold had expired, and the seat was reserved by another guest in the meantime.", `${aed(ctx.total)} has been refunded automatically to the same payment method (3–10 business days).`, "We would love to help you pick another seat · reply to this email or book again on the site."];
      return { subject: title, text: lines.join("\n"), html: wrapHtml(L, title, lines) };
    }
    case "shuttle_alert": {
      const title = L === "ar" ? `قاربك إلى نوا · ${ctx.ref}` : `Your shuttle to NOA · ${ctx.ref}`;
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
  // Positional Meta variables: {{1}} name, {{2}} reference, {{3}} date/slot, {{4}} total,
  // {{5}} signed ticket token = dynamic suffix of the "Show wristband" URL button (…/booking/ticket?t={{5}}). See docs/whatsapp-templates.md.
  return { contentSid: sid, variables: { "1": ctx.guestName, "2": ctx.ref, "3": when, "4": aed(ctx.total), ...(ctx.ticketToken ? { "5": ctx.ticketToken } : {}) }, fallbackText: email.text };
}
