import QRCode from "qrcode";
import { verifyTicket, checkinUrl } from "@/server/ticket";

export const runtime = "nodejs";

/** The wristband QR as SVG. Encodes the staff check-in URL for this booking; invalid or forged tokens get 404. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const png = /\.png$/i.test(token);
  const ref = verifyTicket(token.replace(/\.(svg|png)$/i, ""));
  if (!ref) return new Response("Not found", { status: 404 });
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noa-website-two.vercel.app";
  const url = checkinUrl(base, ref);
  if (png) {   // email clients: PNG on white, large enough to scan from a phone screen
    const buf = await QRCode.toBuffer(url, { type: "png", margin: 2, width: 480, color: { dark: "#10384A", light: "#FFFFFF" } });
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
  }
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 320, color: { dark: "#10384A", light: "#00000000" } });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=3600" } });
}
