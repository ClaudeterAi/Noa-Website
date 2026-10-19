import { z } from "zod";
import { getAvailability, getSetting, listUnitTypes } from "@/server/booking";
import { getCartToken } from "@/server/cart-cookie";
import { getCurrentGuest } from "@/server/guest-session";
import { error, handle, json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Query = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), slot: z.enum(["morning", "afternoon", "night", "full"]) });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = Query.safeParse({ date: url.searchParams.get("date"), slot: url.searchParams.get("slot") });
    if (!parsed.success) return error(422, "VALIDATION_ERROR", "date (YYYY-MM-DD) and slot (morning|afternoon|night) are required", parsed.error.issues);
    const me = await getCurrentGuest();
    const units = await getAvailability(parsed.data.date, parsed.data.slot, await getCartToken(), me?.tier ?? "guest");
    return json({ date: parsed.data.date, slot: parsed.data.slot, serverTime: new Date().toISOString(), tier: me?.tier ?? "guest", holdMinutes: await getSetting("hold_minutes"), types: await listUnitTypes(), units }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return handle(e); }
}
