import { cookies } from "next/headers";
import { json } from "@/server/http";

export const runtime = "nodejs";
export async function POST() { (await cookies()).delete("noa_guest"); return json({ ok: true }); }
