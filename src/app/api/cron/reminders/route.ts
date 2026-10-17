import { enqueueReminders } from "@/server/notifications/outbox";
import { error, json } from "@/server/http";

export const runtime = "nodejs";

/** Vercel cron, hourly: queue the 24-hour reminder for tomorrow's confirmed bookings (exactly once per booking). */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return error(401, "UNAUTHORIZED", "Bad cron secret");
  const queued = await enqueueReminders();
  return json({ ok: true, queued, at: new Date().toISOString() });
}
