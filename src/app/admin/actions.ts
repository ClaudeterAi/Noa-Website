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
export async function setSessionStatusAction(date: string, slot: "morning" | "afternoon" | "night" | "full", status: "open" | "closed") {
  try { const actor = await requireAdmin("editor"); await A.setSessionStatus(actor, date, slot, status); revalidatePath("/admin"); return ok(); } catch (e) { return fail(e); }
}
export async function updateSettingAction(key: A.SettingKey, value: unknown) {
  try { const actor = await requireAdmin("owner"); await A.updateSetting(actor, key, value); revalidatePath("/admin/settings"); return ok(); } catch (e) { return fail(e); }
}
export async function retryNotificationAction(id: string) {
  try { const actor = await requireAdmin("frontdesk"); await A.retryNotification(actor, id); revalidatePath("/admin/notifications"); return ok(); } catch (e) { return fail(e); }
}

/* ---------- events ---------- */
import { autofillEvent, saveEvent, setEventStatus, type EventInput } from "@/server/events/repo";
import type { EventDraft } from "@/server/events/enrich";

export async function saveEventAction(id: string | null, input: EventInput) {
  try { const actor = await requireAdmin("editor"); const row = await saveEvent(actor, id, input); revalidatePath("/admin/events"); revalidatePath("/en/events"); revalidatePath("/ar/events"); return ok({ id: row.id }); } catch (e) { return fail(e); }
}
export async function setEventStatusAction(id: string, status: "draft" | "published" | "past" | "cancelled") {
  try { const actor = await requireAdmin("editor"); await setEventStatus(actor, id, status); revalidatePath("/admin/events"); revalidatePath(`/admin/events/${id}`); revalidatePath("/en/events"); revalidatePath("/ar/events"); revalidatePath("/en"); revalidatePath("/ar"); return ok(); } catch (e) { return fail(e); }
}
export async function autofillEventAction(draft: EventDraft) {
  try { await requireAdmin("editor"); return ok(await autofillEvent(draft)); } catch (e) { return fail(e); }
}

/* ---------- media ---------- */
import { assignSlot } from "@/server/media";

export async function assignMediaSlotAction(slotId: string, assetId: string | null) {
  try {
    const actor = await requireAdmin("editor"); await assignSlot(slotId, assetId, actor.email);
    for (const p of ["/en", "/ar", "/en/morning-package", "/ar/morning-package", "/en/afternoon-package", "/ar/afternoon-package", "/en/cabana", "/ar/cabana", "/en/about", "/ar/about", "/en/location", "/ar/location", "/en/faq", "/ar/faq", "/en/contact", "/ar/contact", "/en/events", "/ar/events"]) revalidatePath(p);
    revalidatePath("/admin/media"); return ok();
  } catch (e) { return fail(e); }
}
