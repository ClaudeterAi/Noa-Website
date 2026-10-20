import { getCurrentGuest } from "@/server/guest-session";
import { exportAccount } from "@/server/guest-account";
import { error } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Download my data: a JSON file with the guest's profile, consent history and bookings. */
export async function GET() {
  const me = await getCurrentGuest();
  if (!me) return error(401, "SIGNED_OUT", "Sign in to download your data");
  const data = await exportAccount(me.id);
  if (!data) return error(404, "NOT_FOUND", "Account not found");
  return new Response(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="noa-my-data-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" } });
}
