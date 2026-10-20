import { NextResponse } from "next/server";
import { ForbiddenError, requireAdmin } from "@/server/admin/auth";
import { ensureUnitTypes, seed } from "@/db/seed";
import { syncUnits } from "@/db/sync-units";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Maintenance: bring the database's unit catalogue and seat list in line with the code (boat.ts and the unit types).
 * Adds missing unit types and seats, reactivates seats that came back, deactivates seats no longer on the plan.
 * Never touches bookings, holds, settings or sessions. Owner session, or the maintenance secret for a one-off run
 * from outside the browser (the sandbox that builds the site cannot reach the database directly).
 */
export async function POST(req: Request) {
  const secret = process.env.MAINTENANCE_SECRET ?? process.env.CRON_SECRET;   // CRON_SECRET is already provisioned on Vercel for server-to-server calls
  const supplied = req.headers.get("x-maintenance-secret");
  let actor = "maintenance-secret";
  if (!(secret && supplied && supplied === secret)) {
    try { actor = (await requireAdmin("owner")).email; }
    catch (e) { if (e instanceof ForbiddenError) return NextResponse.json({ error: "forbidden" }, { status: 403 }); return NextResponse.json({ error: "unauthorised" }, { status: 401 }); }
  }
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  if (dry) {
    return NextResponse.json({ dry: true, actor, note: "POST without ?dry=1 to apply" });
  }
  await seed({ onlyIfEmpty: true });                 // first run on an empty database only
  const typesAdded = await ensureUnitTypes();        // new unit types the plan needs; existing rows untouched
  const report = await syncUnits();                  // seats: add, reactivate, deactivate; bookings never touched
  return NextResponse.json({ actor, typesAdded, report, at: new Date().toISOString() });
}
