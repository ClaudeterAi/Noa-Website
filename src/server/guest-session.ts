import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { guests } from "@/db/schema";
import type { Tier } from "./vip";

/**
 * Signed guest session cookie: `<guestId>.<expiresMs>.<hmac>`. Issued after passwordless sign-in
 * (Cognito, Day 4); verified here on every booking request so VIP priority and "welcome back" work.
 * Without GUEST_SESSION_SECRET no session is ever valid — the site runs as guest-checkout only.
 */
const NAME = "noa_guest";
const secret = () => process.env.GUEST_SESSION_SECRET;

const sign = (payload: string, key: string) => createHmac("sha256", key).update(payload).digest("base64url");

export function issueGuestSessionValue(guestId: string, ttlDays = 30, now = Date.now()): string | null {
  const key = secret(); if (!key) return null;
  const payload = `${guestId}.${now + ttlDays * 86_400_000}`;
  return `${payload}.${sign(payload, key)}`;
}

export function verifyGuestSessionValue(value: string | undefined, now = Date.now()): string | null {
  const key = secret(); if (!key || !value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [guestId, exp, mac] = parts;
  if (!/^[0-9a-f-]{36}$/.test(guestId) || Number(exp) < now) return null;
  const expected = sign(`${guestId}.${exp}`, key);
  const a = Buffer.from(mac), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? guestId : null;
}

export interface CurrentGuest { id: string; tier: Tier; name: string | null; email: string; locale: string }

export async function getCurrentGuest(): Promise<CurrentGuest | null> {
  const guestId = verifyGuestSessionValue((await cookies()).get(NAME)?.value);
  if (!guestId) return null;
  const [g] = await db.select({ id: guests.id, tier: guests.tier, name: guests.name, email: guests.email, locale: guests.locale }).from(guests).where(eq(guests.id, guestId));
  return g ?? null;
}

export async function setGuestSessionCookie(guestId: string, secure: boolean) {
  const value = issueGuestSessionValue(guestId);
  if (!value) return;
  (await cookies()).set(NAME, value, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 30 * 86_400 });
}
