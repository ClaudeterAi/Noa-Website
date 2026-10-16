import { z } from "zod";
import { getAvailability } from "@/server/booking";
import { getCartToken } from "@/server/cart-cookie";
import { error, handle, json } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Query = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), slot: z.enum(["morning", "afternoon"]) });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = Query.safeParse({ date: url.searchParams.get("date"), slot: url.searchParams.get("slot") });
    if (!parsed.success) return error(422, "VALIDATION_ERROR", "date (YYYY-MM-DD) and slot (morning|afternoon) are required", parsed.error.issues);
    const units = await getAvailability(parsed.data.date, parsed.data.slot, await getCartToken());
    return json({ date: parsed.data.date, slot: parsed.data.slot, serverTime: new Date().toISOString(), units }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return handle(e); }
}
