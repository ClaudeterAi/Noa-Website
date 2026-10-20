import { basePrice } from "@/server/events/ticketing";
import { registry } from "@/content/registry";
import type { L, Locale, Section } from "@/content/types";
import { getSetting, listUnitTypes } from "@/server/booking";
import { navTargets } from "./sitemap";
import { eventsKnowledge } from "@/server/events/kb-sync";

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
  const nightFactor = await getSetting("night_price_factor");
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

  lines.push(ar ? "## الجلسات اليومية" : "## Daily sessions");
  lines.push(ar ? "- جلستان كل يوم: بعد الظهر 2:00 إلى 9:30 مساءً (المسبح والدي جيه والغروب) والليل 9:30 مساءً إلى 2:00 فجراً (الحلبة؛ المسبح مغلق ليلاً). تُحجز المقاعد لكل جلسة. لا توجد جلسة صباحية." : "- Two sessions every day: Afternoon 2:00 to 9:30 PM (the pool, the DJ and the sunset) and Night 9:30 PM to 2:00 AM (the floor; the pool is closed at night). Seats are booked per session; night seats are priced like the afternoon unless an event sets its own price. There is no morning session.");
  lines.push(ar ? "## ما على المتن" : "## What is on board");
  lines.push(ar
    ? "- السطح الرئيسي: سطح شمسي عند المقدمة بعشرة أسرّة، مسبح لا متناهٍ (خليج وقناة) مع أربعة عشر سريراً نهارياً على حافته وثماني كبائن مسبح، غرفة علاج للمانيكير والباديكير والمساج، صالون شعر مع محطة وشم، دورات مياه للنساء والرجال في المنتصف وعند المؤخرة، حلبة رقص بطول 15 متراً تحت السقف مع منصة ومحطة دي جيه، أربع كبائن صالة تواجه المنصة، عشر طاولات عالية، البار الرئيسي، والاستقبال عند المؤخرة."
    : "- Main deck: a bow sun deck with ten loungers, the infinity pool (a bay and a channel) with fourteen daybeds on its edge and eight pool cabanas, a treatment room for manicures, pedicures and massage, a hair salon with a tattoo station, women's and men's restrooms midships and at the stern, a 15 metre dance floor under the roof with the stage and DJ station, four lounge cabanas facing the stage, ten high tables, the main bar, and reception at the stern.");
  lines.push(ar
    ? "- السطح العلوي: ثماني كبائن تطل على الحلبة، مقصورة فوق المنصة (أولوية للأعضاء حتى 24 ساعة قبل الموعد)، بار وبار سوشي (أوماكاسي من 7 مساءً حتى 1 فجراً)، صالة في الهواء الطلق بست مجموعات أرائك على السياج، ثماني طاولات عالية، ودرج على الجانبين."
    : "- Upper deck: eight cabanas looking down on the floor, the booth above the stage (members first until 24 hours before), a bar and sushi bar (omakase 7 PM to 1 AM), the alfresco lounge with six sofa groups along the rail, eight high tables, and stairs on both sides.");
  lines.push(ar
    ? "- العلاجات والصالون تُحجز مع المقعد عند الدفع أو في الاستقبال، وتُحتسب على السوار. الصالون ومحطة الوشم مفتوحان حتى منتصف الليل الخميس والجمعة والسبت. المسبح مغلق بعد الغسق."
    : "- Treatments and the salon are booked with the seat at checkout or at reception, and charged to the wristband. The salon and tattoo station are open until midnight Thursday to Saturday. The pool is closed after dusk.");
  lines.push(ar
    ? "- القوارب: كل 30 دقيقة من رصيف مرسى دبي، المرسى 7، من 1:30 ظهراً. آخر قارب للعودة 10:00 مساءً بعد بعد الظهر، و2:30 فجراً بعد الليل. العبور 11 دقيقة."
    : "- Boats: every 30 minutes from Dubai Marina Pier, Berth 7, from 1:30 PM. Last boats back 10:00 PM after the afternoon, 2:30 AM after the night. The crossing is 11 minutes.");
  lines.push(ar ? "## الباقات" : "## Packages");
  for (const p of Object.values(packages)) lines.push(`### ${pick(p.name, locale)} (${pick(p.vibe, locale)}, ${pick(p.time, locale)})`, pick(p.desc, locale));

  lines.push(ar ? "## أنواع المقاعد والأسعار (بالدرهم، قبل الضريبة)" : "## Seat types and prices (AED, before VAT)");
  for (const t of Object.values(types).sort((a, b) => b.tier - a.tier)) {
    lines.push(`- ${ar ? t.nameAr : t.nameEn}: ${ar ? "بعد الظهر" : "afternoon"} AED ${t.priceAfternoon}, ${ar ? "الليل" : "night"} AED ${basePrice("night", t.priceMorning, t.priceAfternoon, nightFactor)}${t.perPerson ? (ar ? " للشخص" : " per person") : ` (${ar ? "حتى" : "up to"} ${t.pax} ${ar ? "ضيوف" : "guests"})`} — ${ar ? t.descAr : t.descEn}`);
  }

  lines.push(ar ? "## صفحات الموقع" : "## Site pages");
  for (const n of navTargets(locale)) lines.push(`- ${n.title} → ${n.path}${n.sections.length ? ` (${ar ? "الأقسام" : "sections"}: ${n.sections.map((s) => s.label).join(", ")})` : ""}`);

  for (const page of registry.pages) {
    if (!page.sections.length) continue;
    lines.push(`## ${pick(page.title, locale)}`);
    for (const s of page.sections) lines.push(...sectionText(s, locale));
  }

  const live = await eventsKnowledge();
  if (live) lines.push(live);
  else {
    lines.push(ar ? "## الفعاليات (بيانات مؤقتة حتى تأكيد نوا)" : "## Events (placeholder data until NOA confirms)");
    for (const e of Object.values(events)) lines.push(`- ${pick(e.dateLabel, locale)}: ${pick(e.name, locale)} — ${pick(e.artist, locale)}`);
  }

  return lines.join("\n");
}
