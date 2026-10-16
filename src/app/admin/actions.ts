"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/admin/auth";
import * as A from "@/server/admin/actions";

/** Server actions: role check → data layer (which writes the audit row) → revalidate. */
const ok = <T,>(data?: T) => ({ ok: true as const, data });
const fail = (e: unknown) => ({ ok: false as const, error: e instanceof Error ? e.message : String(e) });

export async function refundAction(bookingId: string, amountAed?: number) {
  try { const actor = await requireAdmin("editor"); const r = await A.refundBooking(actor, bookingId, amountAed); revalidatePath(`/admin/bookings/${bookingId}`); return ok(r); } catch (e) { return fail(e); }
}
export async function cancelAction(bookingId: string) {
  try { const actor = await requireAdmin("editor"); await A.cancelBookingAdmin(actor, bookingId); revalidatePath(`/admin/bookings/${bookingId}`); return ok(); } catch (e) { return fail(e); }
}
export async function setTierAction(guestId: string, tier: "guest" | "preferred" | "vip" | "auto") {
  try { const actor = await requireAdmin("editor"); await A.setGuestTier(actor, guestId, tier); revalidatePath("/admin/guests"); return ok(); } catch (e) { return fail(e); }
}
export async function updateUnitTypeAction(id: string, patch: { priceMorning?: number; priceAfternoon?: number; active?: boolean }) {
  try { const actor = await requireAdmin("editor"); await A.updateUnitType(actor, id, patch); revalidatePath("/admin/inventory"); return ok(); } catch (e) { return fail(e); }
}
export async function updateUnitAction(id: string, patch: { vipPriority?: boolean; active?: boolean }) {
  try { const actor = await requireAdmin("editor"); await A.updateUnit(actor, id, patch); revalidatePath("/admin/inventory"); return ok(); } catch (e) { return fail(e); }
}
export async function setSessionStatusAction(date: string, slot: "morning" | "afternoon", status: "open" | "closed") {
  try { const actor = await requireAdmin("editor"); await A.setSessionStatus(actor, date, slot, status); revalidatePath("/admin"); return ok(); } catch (e) { return fail(e); }
}
export async function updateSettingAction(key: A.SettingKey, value: unknown) {
  try { const actor = await requireAdmin("owner"); await A.updateSetting(actor, key, value); revalidatePath("/admin/settings"); return ok(); } catch (e) { return fail(e); }
}
export async function retryNotificationAction(id: string) {
  try { const actor = await requireAdmin("frontdesk"); await A.retryNotification(actor, id); revalidatePath("/admin/notifications"); return ok(); } catch (e) { return fail(e); }
}
