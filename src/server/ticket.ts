import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Wristband ticket token: the booking reference signed with the site secret, so a QR code that reaches the pier desk
 * cannot be forged by typing a reference. Format NOA-XXXXXX.<12 hex>. Nothing personal is inside the token.
 */
const secret = () => process.env.GUEST_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";

export function ticketToken(ref: string): string {
  const mac = createHmac("sha256", secret()).update(`ticket:${ref}`).digest("hex").slice(0, 12);
  return `${ref}.${mac}`;
}

export function verifyTicket(token: string | null | undefined): string | null {
  if (!token || !secret()) return null;
  const m = /^(NOA-[A-Z2-9]{6})\.([0-9a-f]{12})$/.exec(token.trim().toUpperCase().replace(/\.([0-9A-F]{12})$/, (_, h) => `.${h.toLowerCase()}`));
  if (!m) return null;
  const expect = ticketToken(m[1]).split(".")[1];
  const a = Buffer.from(m[2]), b = Buffer.from(expect);
  return a.length === b.length && timingSafeEqual(a, b) ? m[1] : null;
}

export const ticketUrl = (base: string, locale: string, ref: string) => `${base}/${locale}/booking/ticket?t=${ticketToken(ref)}`;
export const checkinUrl = (base: string, ref: string) => `${base}/admin/checkin?t=${ticketToken(ref)}`;
