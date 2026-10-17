import { registry } from "@/content/registry";
import type { L, Locale, Section } from "@/content/types";
import { getSetting, listUnitTypes } from "@/server/booking";
import { navTargets } from "./sitemap";

/**
 * One document, regenerated on demand, that both agents read:
 *   - the chatbot gets it in its system prompt (compact),
 *   - the ElevenLabs agent imports it as a knowledge-base URL (/api/agent/knowledge).
 * Because it is rendered from the registry and the database, the agents can never be
 * out of date with the site. Prices come from unit_types, never from copy.
 */
const pick = (l: L, locale: Locale) => (locale === "ar" ? l.ar : l.en).replace(/\n/g, " ").replace(/\*\*?/g, "");

function sectionText(s: Section, locale: Locale): string[] {
  const out: string[] = [];
  const h = (l: L) => pick(l, locale);
  switch (s.type) {
    case "prose": case "text": out.push(`### ${h(s.heading)}`, ...s.paragraphs.map((p) => h(p))); break;
    case "splitProse": out.push(`### ${h(s.heading)}`, ...s.paragraphs.map((p) => h(p))); break;
    case "included": out.push(`### ${h(s.heading)}`, ...s.rows.map((r) => `- ${h(r.label)}: ${h(r.value)}`)); break;
    case "tariff": out.push(`### ${h(s.heading)}`, ...s.cards.map((c) => `- ${h(c.name)} — AED ${c.price} — ${h(c.desc)} (${h(c.cap)})`)); break;
    case "specs": out.push(`### ${h(s.heading)}`, ...s.items.map((i) => `- ${i.n}${i.small ?? ""} ${h(i.label)}`)); break;
    case "amenities": out.push(`### ${h(s.heading)}`, ...s.items.map((i) => `- ${h(i.name)}: ${h(i.desc)}`)); break;
    case "location": out.push(`### ${h(s.heading)}`, ...s.rows.map((r) => `- ${h(r.label)}: ${h(r.value)}`)); break;
    case "contactStrip": out.push(...s.cells.map((c) => `- ${h(c.label)}: ${h(c.value)}`)); break;
    case "faq": out.push(`### ${h(s.heading)}`, ...s.faqIds.map((id) => `Q: ${h(registry.faqs[id].q)}\nA: ${h(registry.faqs[id].a)}`)); break;
    case "subhero": out.push(h(s.sub)); break;
    case "cta": out.push(h(s.body)); break;
    default: break;
  }
  return out;
}

export async function buildKnowledge(locale: Locale): Promise<string> {
  const ar = locale === "ar";
  const types = await listUnitTypes();
  const holdMinutes = await getSetting("hold_minutes");
  const maxPerCart = await getSetting("max_holds_per_cart");
  const { settings: st, packages, events } = registry;
  const lines: string[] = [];

  lines.push(ar ? "# نوا دبي — قاعدة المعرفة" : "# NOA Dubai — knowledge base");
  lines.push(pick(st.tagline, locale));
  lines.push(ar ? "## معلومات أساسية" : "## Essentials");
  lines.push(`- ${ar ? "ساعات العمل" : "Hours"}: ${pick(st.hours, locale)}`);
  lines.push(`- ${ar ? "نقطة الانطلاق" : "Departure"}: ${pick(st.departure, locale)}`);
  lines.push(`- ${ar ? "الهاتف" : "Phone"}: ${st.contact.phoneDisplay} · ${ar ? "البريد" : "Email"}: ${st.contact.email}`);
  lines.push(ar
    ? `- قواعد الحجز: يُحجز المقعد المختار لمدة ${holdMinutes} دقائق أثناء إتمام الدفع؛ بحد أقصى ${maxPerCart} مقاعد في السلة؛ الدفع عبر بطاقة أو Apple Pay أو Google Pay بالدرهم؛ ضريبة القيمة المضافة 5% تُضاف عند الدفع.`
    : `- Booking rules: a tapped seat is held for ${holdMinutes} minutes while the guest pays; at most ${maxPerCart} seats per cart; payment by card, Apple Pay or Google Pay in AED; 5% VAT is added at checkout.`);

  lines.push(ar ? "## الباقات" : "## Packages");
  for (const p of Object.values(packages)) lines.push(`### ${pick(p.name, locale)} (${pick(p.vibe, locale)}, ${pick(p.time, locale)})`, pick(p.desc, locale));

  lines.push(ar ? "## أنواع المقاعد والأسعار (بالدرهم، قبل الضريبة)" : "## Seat types and prices (AED, before VAT)");
  for (const t of Object.values(types).sort((a, b) => b.tier - a.tier)) {
    lines.push(`- ${ar ? t.nameAr : t.nameEn}: ${ar ? "الصباح" : "morning"} AED ${t.priceMorning}, ${ar ? "بعد الظهر" : "afternoon"} AED ${t.priceAfternoon}${t.perPerson ? (ar ? " للشخص" : " per person") : ` (${ar ? "حتى" : "up to"} ${t.pax} ${ar ? "ضيوف" : "guests"})`} — ${ar ? t.descAr : t.descEn}`);
  }

  lines.push(ar ? "## صفحات الموقع" : "## Site pages");
  for (const n of navTargets(locale)) lines.push(`- ${n.title} → ${n.path}${n.sections.length ? ` (${ar ? "الأقسام" : "sections"}: ${n.sections.map((s) => s.label).join(", ")})` : ""}`);

  for (const page of registry.pages) {
    if (!page.sections.length) continue;
    lines.push(`## ${pick(page.title, locale)}`);
    for (const s of page.sections) lines.push(...sectionText(s, locale));
  }

  lines.push(ar ? "## الفعاليات (بيانات مؤقتة حتى تأكيد نوا)" : "## Events (placeholder data until NOA confirms)");
  for (const e of Object.values(events)) lines.push(`- ${pick(e.dateLabel, locale)}: ${pick(e.name, locale)} — ${pick(e.artist, locale)}`);

  return lines.join("\n");
}
