import { sweepExpired } from "@/server/booking";
import { error, json } from "@/server/http";

export const runtime = "nodejs";

/** Vercel cron, every minute. Protected by CRON_SECRET (Vercel sends it as a bearer token). */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return error(401, "UNAUTHORIZED", "Bad cron secret");
  const result = await sweepExpired();
  return json({ ok: true, ...result, at: new Date().toISOString() });
}
