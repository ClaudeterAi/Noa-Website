import { ForbiddenError, requireAdmin } from "@/server/admin/auth";
import { bookingsCsv, listBookings } from "@/server/admin/actions";

export const runtime = "nodejs";

/** Bookings export (editor+), same filters as the list: ?q=&status=&from=&to= */
export async function GET(req: Request) {
  try {
    await requireAdmin("editor");
    const sp = new URL(req.url).searchParams;
    const rows = await listBookings({ q: sp.get("q") ?? undefined, status: sp.get("status") ?? undefined, from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined, limit: 10_000 });
    const csv = bookingsCsv(rows);
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="noa-bookings-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ForbiddenError) return new Response("Forbidden", { status: 403 });
    console.error("export failed", e);
    return new Response("Error", { status: 500 });
  }
}
