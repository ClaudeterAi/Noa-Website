import type { L } from "@/content/types";
import { t } from "@/content/entities";

/**
 * Unit types and units — the same rows Day 2 stores in Postgres (unit_types, inventory_units).
 * Prices in AED, placeholder values carried over from the live mock; NOA confirms before launch.
 * `tier` is the ranking VIP logic reads on Day 3 (higher = better seat).
 */
export type Slot = "morning" | "afternoon";

export interface UnitType {
  id: string;
  cls: string;
  name: L;
  desc: L;
  pax: number;
  price: number;   // afternoon
  mPrice: number;  // morning
  tier: number;
  img: string;
  /** F&B credit shown in the seat modal; null = no minimum spend */
  perPerson?: boolean;
}

const u = (id: string, w = 900) => `https://images.unsplash.com/${id}?w=${w}&q=80`;

export const unitTypes: Record<string, UnitType> = {
  "front-cabana": { id: "front-cabana", cls: "front-cabana", tier: 6, pax: 8, price: 12000, mPrice: 9000, img: u("photo-1540541338287-41700207dee6"),
    name: t("Front Cabana", "كابانا أمامية"), desc: t("Front-row cabana facing the open Gulf. The most secluded position on the deck.", "كابانا في الصف الأمامي مواجهة للخليج المفتوح. الموقع الأكثر خصوصية على السطح.") },
  cabana: { id: "cabana", cls: "cabana", tier: 5, pax: 8, price: 8500, mPrice: 6500, img: u("photo-1582719508461-905c673771fd"),
    name: t("Cabana", "كابانا"), desc: t("Private cabana with daybed, dining table, dedicated host and shade.", "كابانا خاصة مع سرير نهاري وطاولة طعام ومضيف مخصص ومظلة.") },
  "balcony-sofa": { id: "balcony-sofa", cls: "balcony-sofa", tier: 4, pax: 6, price: 6500, mPrice: 4500, img: u("photo-1566073771259-6a8506099945"),
    name: t("Balcony Sofa", "أريكة الشرفة"), desc: t("Upper-deck balcony sofa with a panoramic view of the pool and the open Gulf. Includes AED 4,000 F&B credit.", "أريكة شرفة على السطح العلوي بإطلالة بانورامية على المسبح والخليج المفتوح. تشمل رصيد 4,000 درهم.") },
  jacuzzi: { id: "jacuzzi", cls: "jacuzzi", tier: 4, pax: 6, price: 5500, mPrice: 3800, img: u("photo-1540541338287-41700207dee6"),
    name: t("Jacuzzi", "جاكوزي"), desc: t("Private upper-deck jacuzzi — heated saltwater hot tub for up to 6 with sea view and drinks service. Includes AED 3,000 F&B credit.", "جاكوزي خاص على السطح العلوي — حوض مياه مالحة ساخنة لما يصل إلى 6 أشخاص بإطلالة بحرية وخدمة مشروبات. يشمل رصيد 3,000 درهم.") },
  "dj-lounge": { id: "dj-lounge", cls: "dj-lounge", tier: 4, pax: 4, price: 5500, mPrice: 3800, img: u("photo-1571266028243-d220bc1b3e29"),
    name: t("DJ Lounge", "صالة الدي جيه"), desc: t("Lounge seating directly facing the DJ booth at the bow. Includes AED 2,500 F&B credit.", "جلسة صالة مواجهة مباشرة لكابينة الدي جيه عند المقدمة. تشمل رصيد 2,500 درهم.") },
  "vip-lounge": { id: "vip-lounge", cls: "vip-lounge", tier: 3, pax: 4, price: 4500, mPrice: 3200, img: u("photo-1571266028243-d220bc1b3e29"),
    name: t("VIP Lounge", "صالة VIP"), desc: t("Upper-deck VIP lounge — premium daybed seating with dedicated host. Includes AED 2,000 F&B credit.", "صالة VIP على السطح العلوي — مقاعد أسرّة نهارية فاخرة مع مضيف مخصص. تشمل رصيد 2,000 درهم.") },
  "front-daybed": { id: "front-daybed", cls: "front-daybed", tier: 3, pax: 2, price: 3400, mPrice: 2400, img: u("photo-1540541338287-41700207dee6"),
    name: t("Front-Row Daybed", "سرير الصف الأمامي"), desc: t("Front-row daybed at the pool's outer edge — directly above the Gulf, west-facing for sunset.", "سرير نهاري في الصف الأمامي عند الحافة الخارجية للمسبح — فوق الخليج مباشرة، مواجه للغرب لمشاهدة الغروب.") },
  daybed: { id: "daybed", cls: "daybed", tier: 2, pax: 2, price: 2200, mPrice: 1600, img: u("photo-1582719478250-c89cae4dc85b"),
    name: t("Pool Daybed", "سرير نهاري"), desc: t("Reserved poolside daybed with parasol, side table and drinks service.", "سرير نهاري محجوز بجانب المسبح مع مظلة وطاولة جانبية وخدمة مشروبات.") },
  sunbed: { id: "sunbed", cls: "sunbed", tier: 1, pax: 1, price: 1800, mPrice: 1300, img: u("photo-1582719478250-c89cae4dc85b"),
    name: t("Sunbed", "سرير شمسي"), desc: t("Upper-deck sunbed on the sundeck — uninterrupted sea view, parasol, side table and drinks service.", "سرير شمسي على السطح العلوي — إطلالة بحرية مفتوحة، مظلة، طاولة جانبية، وخدمة مشروبات.") },
  entry: { id: "entry", cls: "entry", tier: 0, pax: 1, price: 900, mPrice: 650, perPerson: true, img: u("photo-1551918120-9739cb430c6d"),
    name: t("General Entry", "دخول عام"), desc: t("Standing entry — full pool, deck and DJ access. Restaurant seating subject to availability.", "دخول بدون مقعد — وصول كامل إلى المسبح والسطح والدي جيه. مقاعد المطعم حسب التوفر.") },
};

/** unit id → unit type id. Ids match data-seat attributes in YachtMap.tsx (52 units). */
export const units: Record<string, string> = Object.fromEntries([
  ...["cabana-1", "cabana-2", "cabana-3", "lower-cabana-1", "lower-cabana-2", "lower-cabana-3"].map((id) => [id, "cabana"]),
  ["front-cabana-1", "front-cabana"], ["lower-cabana-vip", "front-cabana"],
  ...[1, 2, 3, 4, 5, 6].map((i) => [`daybed-t-${i}`, "daybed"]),
  ...[1, 2, 3, 4, 5, 6].map((i) => [`daybed-b-${i}`, "front-daybed"]),
  ...[1, 2, 3, 4, 5].map((i) => [`balcony-${i}`, "balcony-sofa"]),
  ...[1, 2, 3, 4, 5, 6].map((i) => [`sunbed-${i}`, "sunbed"]),
  ["jacuzzi-1", "jacuzzi"],
  ["vip-lounge-1", "vip-lounge"], ["vip-lounge-2", "vip-lounge"],
  ["dj-lounge-1", "dj-lounge"], ["dj-lounge-2", "dj-lounge"],
  ...Array.from({ length: 16 }, (_, i) => [`entry-${i + 1}`, "entry"]),
]);

export const unitType = (unitId: string): UnitType => unitTypes[units[unitId]];
export const priceFor = (type: UnitType, slot: Slot) => (slot === "morning" ? type.mPrice : type.price);

export const ARRIVALS: Record<Slot, string[]> = {
  morning: ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"],
  afternoon: ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "19:00", "20:00"],
};

/* Weekday imagery for the calendar (placeholders) */
export const DAY_IMG: Record<number, string> = {
  0: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=400&q=80",
  1: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80",
  2: "https://images.unsplash.com/photo-1520637836862-4d197d17c97a?w=400&q=80",
  3: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&q=80",
  4: "https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?w=400&q=80",
  5: "https://images.unsplash.com/photo-1571266028243-d220bc1b3e29?w=400&q=80",
  6: "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=400&q=80",
};
