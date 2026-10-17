import { processKbSync } from "@/server/events/kb-sync";
import { error, json } from "@/server/http";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Vercel cron, every minute: push queued knowledge-base changes (events, site content) to the voice agent. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return error(401, "UNAUTHORIZED", "Bad cron secret");
  return json({ ok: true, ...(await processKbSync()), at: new Date().toISOString() });
}
