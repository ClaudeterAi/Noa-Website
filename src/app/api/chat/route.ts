import { z } from "zod";
import { anthropicClient, chatTurn } from "@/server/concierge/chat";
import { getOrSetCartToken } from "@/server/cart-cookie";
import { getCurrentGuest } from "@/server/guest-session";
import { error, parseBody } from "@/server/http";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  locale: z.enum(["en", "ar"]).default("en"),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) })).min(1).max(40),
});

/**
 * Chat concierge (Claude). Streams NDJSON events: {type:"text"} | {type:"tool"} | {type:"done"}.
 * Tools act on this browser's cart cookie, so a seat held in chat is already in the cart on /booking.
 */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, Body);
    const client = anthropicClient();
    if (!client) return error(503, "CHAT_NOT_CONFIGURED", "The chat concierge is not configured on this deployment yet");
    const [cartToken, me] = [await getOrSetCartToken(req), await getCurrentGuest()];
    const ctx = { cartToken, locale: body.locale, tier: me?.tier ?? "guest" as const, guestId: me?.id };
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(new Date());
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const ev of chatTurn(body.messages, ctx, client, today)) controller.enqueue(enc.encode(JSON.stringify(ev) + "\n"));
        } catch (e) {
          controller.enqueue(enc.encode(JSON.stringify({ type: "error", message: e instanceof Error ? e.message : "chat failed" }) + "\n"));
        } finally { controller.close(); }
      },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (e) { return handleError(e); }
}

function handleError(e: unknown) { return error(422, "VALIDATION_ERROR", e instanceof Error ? e.message : "Invalid request"); }
