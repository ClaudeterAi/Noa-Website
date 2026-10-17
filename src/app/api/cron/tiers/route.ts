import { recomputeTiers } from "@/server/vip";
import { error, json } from "@/server/http";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Vercel cron, nightly 23:00 UTC (03:00 Dubai): recompute guest tiers from confirmed bookings. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return error(401, "UNAUTHORIZED", "Bad cron secret");
  const r = await recomputeTiers();
  return json({ ok: true, ...r, at: new Date().toISOString() });
}
