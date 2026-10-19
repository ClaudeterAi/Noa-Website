import { z } from "zod";
import { ForbiddenError, requireAdmin } from "@/server/admin/auth";
import { ALLOWED, presignUpload, registerAsset } from "@/server/media";
import { error, json, parseBody } from "@/server/http";

export const runtime = "nodejs";

const Presign = z.object({ action: z.literal("presign"), filename: z.string().min(1).max(200), mime: z.enum(Object.keys(ALLOWED) as [string, ...string[]]), bytes: z.number().int().positive() });
const Register = z.object({ action: z.literal("register"), key: z.string(), mime: z.string(), bytes: z.number().int().positive(), width: z.number().int().optional(), height: z.number().int().optional(), durationSec: z.number().int().optional(), altEn: z.string().max(200).optional(), altAr: z.string().max(200).optional() });

/** Admin upload handshake: presign (before the browser PUTs to S3) and register (after). Editor+. */
export async function POST(req: Request) {
  try {
    const actor = await requireAdmin("editor");
    const body = await req.json();
    if (body?.action === "presign") return json(await presignUpload(Presign.parse(body), actor.email));
    if (body?.action === "register") return json(await registerAsset(Register.parse(body), actor.email));
    return error(422, "VALIDATION_ERROR", "action must be presign or register");
  } catch (e) {
    if (e instanceof ForbiddenError) return error(403, "FORBIDDEN", "Staff sign-in required");
    return error(422, "VALIDATION_ERROR", e instanceof Error ? e.message : "Invalid request");
  }
}
void parseBody;
