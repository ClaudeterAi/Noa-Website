import { z } from "zod";
import { createHold } from "@/server/booking";
import { getOrSetCartToken } from "@/server/cart-cookie";
import { handle, json, parseBody } from "@/server/http";

export const runtime = "nodejs";

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(["morning", "afternoon"]),
  unitId: z.string().min(1).max(64),
});

/** Place a 5-minute hold on one unit for this browser's cart. 409 when someone else got it first. */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, Body);
    const cartToken = await getOrSetCartToken(req);
    const hold = await createHold({ ...body, cartToken });
    return json({ ...hold, serverTime: new Date().toISOString() }, { status: 201 });
  } catch (e) { return handle(e); }
}
