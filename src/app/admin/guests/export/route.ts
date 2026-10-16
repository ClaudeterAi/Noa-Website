import { ForbiddenError, requireAdmin } from "@/server/admin/auth";
import { guestsCsv, listGuests } from "@/server/admin/actions";

export const runtime = "nodejs";

/** Guest database export (editor+). Personal data — UAE PDPL: only for NOA staff, logged in audit by the caller's session. */
export async function GET() {
  try {
    await requireAdmin("editor");
    const csv = guestsCsv(await listGuests(undefined, 10_000));
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="noa-guests-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
  } catch (e) {
    return new Response(e instanceof ForbiddenError ? "Forbidden" : "Error", { status: e instanceof ForbiddenError ? 403 : 500 });
  }
}
