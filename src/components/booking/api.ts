import type { Slot } from "./inventory";

export interface UnitAvailability { unitId: string; unitTypeId: string; price: number; pax: number; state: "free" | "held" | "booked" | "yours" | "reserved"; heldUntil?: string; releaseAt?: string; vipPriority: boolean }
export interface UnitTypeInfo { id: string; nameEn: string; nameAr: string; descEn: string; descAr: string; pax: number; perPerson: boolean; tier: number; imageSlot: string | null; priceMorning: number; priceAfternoon: number }
export interface ApiError { code: string; message: string; details?: unknown }

async function req<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) }, credentials: "same-origin", cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as T & { error?: ApiError };
  if (!res.ok) throw Object.assign(new Error(body.error?.message ?? res.statusText), { code: body.error?.code ?? "HTTP_" + res.status, status: res.status });
  return body;
}

export const api = {
  availability: (date: string, slot: Slot) => req<{ units: UnitAvailability[]; serverTime: string; tier: "guest" | "preferred" | "vip"; holdMinutes: number; types: Record<string, UnitTypeInfo> }>(`/api/availability?date=${date}&slot=${slot}`),
  hold: (date: string, slot: Slot, unitId: string) => req<{ holdId: string; expiresAt: string; serverTime: string }>("/api/holds", { method: "POST", body: JSON.stringify({ date, slot, unitId }) }),
  release: (holdId: string) => req<{ released: boolean }>(`/api/holds/${holdId}`, { method: "DELETE" }),
  book: (lines: { holdId: string; guests: number; arrivalTime: string }[], guest: { name: string; email: string; phone: string }, locale: string) =>
    req<{ bookingId: string; ref: string; total: number; clientSecret: string; holdsExtendedUntil: string }>("/api/bookings", { method: "POST", body: JSON.stringify({ lines, guest, locale }) }),
  status: (paymentIntent: string) => req<{ ref: string; status: string; total: number }>(`/api/bookings/status?payment_intent=${encodeURIComponent(paymentIntent)}`),
};

export const isApiError = (e: unknown, code: string) => typeof e === "object" && e !== null && (e as { code?: string }).code === code;
