import { processOutbox } from "@/server/notifications/outbox";
import { error, json } from "@/server/http";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Vercel cron, every minute: send due queued notifications (email via Resend, WhatsApp via Twilio). */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return error(401, "UNAUTHORIZED", "Bad cron secret");
  const r = await processOutbox();
  return json({ ok: true, ...r, at: new Date().toISOString() });
}
