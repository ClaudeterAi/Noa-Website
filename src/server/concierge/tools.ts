import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { holds, inventoryUnits, sessions, unitTypes } from "@/db/schema";
import { CartLimitError, createHold, getAvailability, listUnitTypes, releaseHold, UnitReservedError, UnitUnavailableError, type Slot } from "@/server/booking";
import type { Tier } from "@/server/vip";
import { navTargets } from "./sitemap";

/**
 * The agents never touch the database directly; they call these. Every tool works on the same
 * cart token the booking page uses, so a seat held in chat or by voice appears in the guest's
 * cart on /booking and payment happens there (no card data ever passes through an agent).
 */
export interface AgentContext { cartToken: string; locale: "en" | "ar"; tier: Tier; guestId?: string }

const SLOT = { morning: { en: "Morning (9:30 AM–2:00 PM)", ar: "الصباح (9:30 ص–2:00 م)" }, afternoon: { en: "Afternoon (2:00–9:30 PM)", ar: "بعد الظهر (2:00–9:30 م)" }, night: { en: "Night (9:30 PM–2:00 AM)", ar: "الجلسة الليلية" }, full: { en: "Full day", ar: "يوم كامل" } } as const;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export const toolDefinitions = [
  {
    name: "get_availability",
    description: "Live seat availability for a date and session. Returns, per seat type, how many are free, the price in AED and whether members-only priority applies. Always call this before quoting availability or prices.",
    input_schema: { type: "object", properties: { date: { type: "string", description: "YYYY-MM-DD" }, slot: { type: "string", enum: ["morning", "afternoon", "night"] } }, required: ["date", "slot"] },
  },
  {
    name: "hold_seat",
    description: "Hold the best free seat of a given type for the guest for the hold window (default 7 minutes). Use after the guest confirms date, session and seat type. Returns the hold and its expiry. Do not hold more than the guest asked for.",
    input_schema: { type: "object", properties: { date: { type: "string" }, slot: { type: "string", enum: ["morning", "afternoon", "night"] }, unit_type: { type: "string", description: "unit type id from get_availability, e.g. cabana, daybed, sunbed, entry" }, quantity: { type: "integer", minimum: 1, maximum: 6, default: 1 } }, required: ["date", "slot", "unit_type"] },
  },
  {
    name: "release_hold",
    description: "Release one of the guest's held seats (they changed their mind).",
    input_schema: { type: "object", properties: { hold_id: { type: "string" } }, required: ["hold_id"] },
  },
  {
    name: "get_cart",
    description: "The guest's currently held seats with expiry times and the running total.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "checkout_link",
    description: "The link where the guest pays for the held seats (card, Apple Pay, Google Pay). Give this once seats are held and the guest wants to pay. Payment never happens inside the conversation.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "find_page",
    description: "Find the page (and section) on the NOA website that answers a navigation request, e.g. 'cabana prices', 'how do I get there'. Returns the path to link to or navigate to.",
    input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
] as const;

export type ToolName = (typeof toolDefinitions)[number]["name"];

export async function runTool(name: ToolName, input: Record<string, unknown>, ctx: AgentContext): Promise<unknown> {
  switch (name) {
    case "get_availability": return availabilitySummary(String(input.date), input.slot as Slot, ctx);
    case "hold_seat": return holdSeat(String(input.date), input.slot as Slot, String(input.unit_type), Number(input.quantity ?? 1), ctx);
    case "release_hold": return { released: await releaseHold(String(input.hold_id), ctx.cartToken) };
    case "get_cart": return cart(ctx);
    case "checkout_link": return { url: `/${ctx.locale}/booking`, note: ctx.locale === "ar" ? "يُفتح الدفع في صفحة الحجز؛ المقاعد المحجوزة تظهر في السلة." : "Payment opens on the booking page; held seats are already in the cart." };
    case "find_page": return findPage(String(input.query), ctx.locale);
  }
}

export async function availabilitySummary(date: string, slot: Slot, ctx: AgentContext) {
  if (!isoDate.test(date) || !(slot in SLOT)) return { error: "date must be YYYY-MM-DD and slot morning|afternoon|night" };
  const [units, types] = await Promise.all([getAvailability(date, slot, ctx.cartToken, ctx.tier), listUnitTypes()]);
  const byType: Record<string, { type: string; name: string; free: number; reserved_for_members: number; yours: number; price_aed: number; capacity: number; per_person: boolean }> = {};
  for (const u of units) {
    const t = types[u.unitTypeId]; if (!t) continue;
    const row = (byType[t.id] ??= { type: t.id, name: ctx.locale === "ar" ? t.nameAr : t.nameEn, free: 0, reserved_for_members: 0, yours: 0, price_aed: u.price, capacity: t.pax, per_person: t.perPerson });
    if (u.state === "free") row.free++; else if (u.state === "reserved") row.reserved_for_members++; else if (u.state === "yours") row.yours++;
  }
  return { date, session: SLOT[slot][ctx.locale], seat_types: Object.values(byType).sort((a, b) => b.price_aed - a.price_aed), vat_note: "5% VAT added at checkout" };
}

export async function holdSeat(date: string, slot: Slot, unitType: string, quantity: number, ctx: AgentContext) {
  if (!isoDate.test(date) || !(slot in SLOT)) return { error: "date must be YYYY-MM-DD and slot morning|afternoon|night" };
  const qty = Math.min(Math.max(1, quantity | 0), 6);
  const units = await getAvailability(date, slot, ctx.cartToken, ctx.tier);
  const candidates = units.filter((u) => u.unitTypeId === unitType && u.state === "free");
  if (!candidates.length) {
    const reserved = units.some((u) => u.unitTypeId === unitType && u.state === "reserved");
    return { held: [], error: reserved ? "Those seats are reserved for returning members until the release time; offer another type or the release time." : "No free seat of that type for this session; offer alternatives from get_availability." };
  }
  const held: { hold_id: string; unit_id: string; expires_at: string }[] = [];
  const errors: string[] = [];
  for (const u of candidates.slice(0, qty)) {
    try {
      const h = await createHold({ date, slot, unitId: u.unitId, cartToken: ctx.cartToken, guestId: ctx.guestId, tier: ctx.tier });
      held.push({ hold_id: h.holdId, unit_id: u.unitId, expires_at: h.expiresAt });
    } catch (e) {
      if (e instanceof CartLimitError) { errors.push(e.message); break; }
      if (e instanceof UnitUnavailableError || e instanceof UnitReservedError) { errors.push(e.message); continue; }
      throw e;
    }
  }
  return { held, requested: qty, errors, next_step: held.length ? "Offer the checkout link or ask if they want anything else." : "Explain and offer alternatives." };
}

export async function cart(ctx: AgentContext) {
  const rows = await db.select({ holdId: holds.id, unitId: holds.unitId, expiresAt: holds.expiresAt, date: sessions.date, slot: sessions.slot, nameEn: unitTypes.nameEn, nameAr: unitTypes.nameAr, priceMorning: unitTypes.priceMorning, priceAfternoon: unitTypes.priceAfternoon, perPerson: unitTypes.perPerson })
    .from(holds).innerJoin(sessions, eq(sessions.id, holds.sessionId)).innerJoin(inventoryUnits, eq(inventoryUnits.id, holds.unitId)).innerJoin(unitTypes, eq(unitTypes.id, inventoryUnits.unitTypeId))
    .where(and(eq(holds.cartToken, ctx.cartToken), isNull(holds.releasedAt), isNull(holds.bookingId), gt(holds.expiresAt, sql`now()`)))
    .orderBy(holds.createdAt);
  const items = rows.map((r) => ({ hold_id: r.holdId, unit_id: r.unitId, seat: ctx.locale === "ar" ? r.nameAr : r.nameEn, date: r.date, session: SLOT[r.slot][ctx.locale], price_aed: r.slot === "morning" ? r.priceMorning : r.priceAfternoon, expires_at: r.expiresAt.toISOString() }));
  const subtotal = items.reduce((s, i) => s + i.price_aed, 0);
  return { items, subtotal_aed: subtotal, vat_aed: Math.round(subtotal * 0.05), total_aed: subtotal + Math.round(subtotal * 0.05), expires_at: items[0]?.expires_at ?? null };
}

export function findPage(query: string, locale: "en" | "ar") {
  const q = query.toLowerCase();
  const targets = navTargets(locale);
  const score = (t: (typeof targets)[number]) => {
    let s = 0;
    for (const a of [t.title, ...t.aliases]) if (a && q.includes(a.toLowerCase())) s += 3; else if (a && a.toLowerCase().split(/\s+/).some((w) => w.length > 3 && q.includes(w))) s += 1;
    return s;
  };
  const best = [...targets].sort((a, b) => score(b) - score(a))[0];
  if (!best || score(best) === 0) return { path: `/${locale}`, page: "home", title: targets[0]?.title ?? "NOA" };
  const section = best.sections.find((s) => s.label && q.includes(s.label.toLowerCase().split(" ")[0]) && s.label.length > 3);
  return { path: section ? `${best.path}#${section.id}` : best.path, page: best.page, section: section?.id, title: best.title };
}
