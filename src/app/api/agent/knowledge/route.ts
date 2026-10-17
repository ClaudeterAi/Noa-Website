import { buildKnowledge } from "@/server/concierge/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Knowledge-base document for the ElevenLabs agent (import as a URL source; re-fetch on publish). ?locale=en|ar|both */
export async function GET(req: Request) {
  const loc = new URL(req.url).searchParams.get("locale") ?? "both";
  const parts = loc === "both" ? [await buildKnowledge("en"), await buildKnowledge("ar")] : [await buildKnowledge(loc === "ar" ? "ar" : "en")];
  return new Response(parts.join("\n\n---\n\n"), { headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
