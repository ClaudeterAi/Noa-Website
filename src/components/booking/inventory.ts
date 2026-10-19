import type { L } from "@/content/types";
import { t } from "@/content/entities";
import { BOAT_UNITS } from "./boat";

/**
 * Unit types and units — the same rows Day 2 stores in Postgres (unit_types, inventory_units).
 * Prices in AED, placeholder values carried over from the live mock; NOA confirms before launch.
 * `tier` is the ranking VIP logic reads on Day 3 (higher = better seat).
 */
export type Slot = "morning" | "afternoon" | "night" | "full";

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
  /* ---- THE NOA (Atelier EPJ detailed design, rev 00 · 17.07.2026). Prices are placeholders until NOA confirms. ---- */
  "vip-booth": { id: "vip-booth", cls: "vip-booth", tier: 8, pax: 12, price: 18000, mPrice: 12000, img: u("photo-1566073771259-6a8506099945"),
    name: t("VIP Booth", "مقصورة VIP"), desc: t("The curved booth on the upper deck looking straight down onto the stage. Private host, premium bottle service.", "المقصورة المنحنية في السطح العلوي المطلة مباشرة على المسرح. مضيف خاص وخدمة زجاجات مميزة.") },
  "upper-cabana": { id: "upper-cabana", cls: "upper-cabana", tier: 7, pax: 8, price: 9500, mPrice: 7000, img: u("photo-1582719478250-c89cae4dc85b"),
    name: t("Upper-Deck Cabana", "كابانا السطح العلوي"), desc: t("Shaded cabana on the upper deck above the dance floor, daybed and lounge seating, butler service.", "كابانا مظللة في السطح العلوي فوق حلبة الرقص، سرير نهاري وجلسة استرخاء وخدمة خادم شخصي.") },
  lounge: { id: "lounge", cls: "lounge", tier: 6, pax: 10, price: 9500, mPrice: 7000, img: u("photo-1514525253161-7a46d19cd819"),
    name: t("Lounge Cabana", "كابانا الصالة"), desc: t("Curved sofa booth beside the dance floor for up to ten, with dedicated host.", "مقصورة أريكة منحنية بجانب حلبة الرقص لعشرة أشخاص، مع مضيف مخصص.") },
  cabana: { id: "cabana", cls: "cabana", tier: 5, pax: 8, price: 8500, mPrice: 6500, img: u("photo-1535827841776-24afc1e255ac"),
    name: t("Pool Cabana", "كابانا المسبح"), desc: t("Private cabana on the pool deck with daybed, armchairs, table, shade and host.", "كابانا خاصة على سطح المسبح مع سرير نهاري ومقاعد وطاولة وظل ومضيف.") },
  alfresco: { id: "alfresco", cls: "alfresco", tier: 4, pax: 6, price: 3500, mPrice: 2800, img: u("photo-1559339352-11d035aa65de"),
    name: t("Alfresco Lounge", "صالة في الهواء الطلق"), desc: t("Sofa, low table and poufs for six in the upper-deck alfresco lounge by the bar, open to the Gulf.", "أريكة وطاولة منخفضة ومقاعد لستة في صالة السطح العلوي بجانب البار، مفتوحة على الخليج.") },
  daybed: { id: "daybed", cls: "daybed", tier: 3, pax: 2, price: 2200, mPrice: 1800, img: u("photo-1540541338287-41700207dee6"),
    name: t("Pool Daybed", "سرير نهاري عند المسبح"), desc: t("Double daybed on the pool edge, towels and F&B credit included.", "سرير نهاري مزدوج على حافة المسبح، مع المناشف ورصيد مأكولات ومشروبات.") },
  table: { id: "table", cls: "table", tier: 2, pax: 4, price: 1600, mPrice: 1200, img: u("photo-1470225620780-dba8ba36b745"),
    name: t("Cocktail Table", "طاولة كوكتيل"), desc: t("High table for four at the edge of the dance floor.", "طاولة عالية لأربعة على حافة حلبة الرقص.") },
  sunbed: { id: "sunbed", cls: "sunbed", tier: 1, pax: 1, price: 600, mPrice: 450, img: u("photo-1520250497591-112f2f40a3f4"),
    name: t("Sun Lounger", "كرسي استلقاء"), desc: t("Single lounger on the extended sun deck at the bow.", "كرسي استلقاء فردي على سطح الشمس الممتد عند المقدمة.") },
  entry: { id: "entry", cls: "entry", tier: 0, pax: 1, price: 900, mPrice: 700, perPerson: true, img: u("photo-1493225457124-a3eb161ffa5f"),
    name: t("General Entry", "دخول عام"), desc: t("Access to the dance floor, pool and bars; no reserved seat.", "دخول إلى حلبة الرقص والمسبح والحانات، دون مقعد محجوز.") },
};

export const units: Record<string, string> = Object.fromEntries(BOAT_UNITS.map((u) => [u.id, u.type]));

export const unitType = (unitId: string): UnitType => unitTypes[units[unitId]];
export const priceFor = (type: UnitType, slot: Slot) => (slot === "morning" ? type.mPrice : type.price);

export const ARRIVALS: Record<Slot, string[]> = {
  morning: ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"],
  afternoon: ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "19:00", "20:00"],
  night: ["21:30", "22:00", "22:30", "23:00", "23:30", "00:00"],
  full: ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00"],
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
