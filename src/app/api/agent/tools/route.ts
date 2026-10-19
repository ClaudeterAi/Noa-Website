import { z } from "zod";
import { runTool, toolDefinitions, type ToolName } from "@/server/concierge/tools";
import { error, json, parseBody } from "@/server/http";
import { verifyGuestSessionValue } from "@/server/guest-session";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { guests } from "@/db/schema";

export const runtime = "nodejs";

/**
 * Server tools for the ElevenLabs voice agent (one webhook, tool name in the body). The agent sends
 * the cart token and locale it received as dynamic variables when the session started, so voice holds
 * land in the same cart as the booking page. Protected by a shared secret header.
 */
const Body = z.object({
  tool: z.enum(toolDefinitions.map((t) => t.name) as [ToolName, ...ToolName[]]),
  input: z.record(z.string(), z.unknown()).default({}),
  cart_token: z.string().uuid(),
  locale: z.enum(["en", "ar"]).default("en"),
  guest_session: z.string().optional(),
});

export async function POST(req: Request) {
  const secret = process.env.ELEVENLABS_TOOL_SECRET;
  if (!secret || req.headers.get("x-noa-agent-secret") !== secret) return error(401, "UNAUTHORIZED", "Bad agent secret");
  try {
    const b = await parseBody(req, Body);
    let tier: "guest" | "preferred" | "vip" = "guest"; let guestId: string | undefined;
    const gid = b.guest_session ? verifyGuestSessionValue(b.guest_session) : null;
    if (gid) { const [g] = await db.select({ id: guests.id, tier: guests.tier }).from(guests).where(eq(guests.id, gid)); if (g) { tier = g.tier; guestId = g.id; } }
    const result = await runTool(b.tool, b.input, { cartToken: b.cart_token, locale: b.locale, tier, guestId, source: "voice" });
    return json(result);
  } catch (e) { return error(422, "VALIDATION_ERROR", e instanceof Error ? e.message : "Invalid request"); }
}
