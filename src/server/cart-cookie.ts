import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const NAME = "noa_cart";

/** Anonymous cart identity: httpOnly, 1 day. Holds and pending bookings are owned by this token. */
export async function getOrSetCartToken(req: Request): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(NAME)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return existing;
  const token = randomUUID();
  jar.set(NAME, token, { httpOnly: true, sameSite: "lax", secure: isHttps(req), path: "/", maxAge: 60 * 60 * 24 });
  return token;
}

export async function getCartToken(): Promise<string | undefined> {
  const v = (await cookies()).get(NAME)?.value;
  return v && /^[0-9a-f-]{36}$/.test(v) ? v : undefined;
}

/** Secure cookies only over https (Vercel sets x-forwarded-proto); plain http is local development. */
function isHttps(req: Request) {
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  return proto === "https";
}
