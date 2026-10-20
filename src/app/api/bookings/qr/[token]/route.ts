import QRCode from "qrcode";
import { verifyTicket, checkinUrl } from "@/server/ticket";

export const runtime = "nodejs";

/** The wristband QR as SVG. Encodes the staff check-in URL for this booking; invalid or forged tokens get 404. */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ref = verifyTicket(token.replace(/\.svg$/i, ""));
  if (!ref) return new Response("Not found", { status: 404 });
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noa-website-two.vercel.app";
  const svg = await QRCode.toString(checkinUrl(base, ref), { type: "svg", margin: 1, width: 320, color: { dark: "#10384A", light: "#00000000" } });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=3600" } });
}
