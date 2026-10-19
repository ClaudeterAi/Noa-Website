import { getObjectStream } from "@/server/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public, cached delivery of uploaded media from the private bucket. Keys are content-addressed, so responses are immutable. */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const k = `media/${key.join("/")}`;
  if (!/^media\/[a-f0-9]{12}\/[a-z0-9-]+\.[a-z0-9]+$/.test(k)) return new Response("Not found", { status: 404 });
  try {
    const obj = await getObjectStream(k, req.headers.get("range") ?? undefined);
    if (!obj) return new Response("Not found", { status: 404 });
    return new Response(obj.body, { status: obj.status, headers: { ...obj.headers, "Cache-Control": "public, max-age=31536000, immutable", "CDN-Cache-Control": "public, max-age=31536000, immutable" } });
  } catch (e) {
    const code = (e as { name?: string }).name;
    return new Response(code === "NoSuchKey" || code === "NotFound" ? "Not found" : "Media unavailable", { status: code === "NoSuchKey" || code === "NotFound" ? 404 : 502 });
  }
}
