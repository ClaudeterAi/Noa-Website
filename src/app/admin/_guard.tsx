import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { adminConfigured, authOptions, hasRole, type AdminRole, type AdminSession } from "@/server/admin/auth";

/** Page-level guard: no session → sign-in; insufficient role → 403 text. */
export async function guard(min: AdminRole = "frontdesk") {
  const s = adminConfigured() ? ((await getServerSession(authOptions)) as AdminSession | null) : null;
  if (!s?.user?.email) redirect("/admin/sign-in");
  if (!hasRole(s.role, min)) return { session: s, denied: true as const };
  return { session: s, denied: false as const };
}
export const Denied = () => <main className="ad-main"><h1>Not allowed</h1><p className="note">Your role does not include this area.</p></main>;
