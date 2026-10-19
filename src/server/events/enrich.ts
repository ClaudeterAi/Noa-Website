import type Anthropic from "@anthropic-ai/sdk";
import type { EventAgentGuidance, EventArtist } from "@/db/schema";
import { anthropicClient, CHAT_MODEL, onBedrock } from "@/server/concierge/chat";

/**
 * "Auto-fill with AI": the admin types what they have (often just a title, a date and an artist name);
 * Claude fills the rest — artist bios and origins, a pitch, description, vibe tags, Arabic drafts, SEO,
 * talking points, objections. Every filled field is recorded in `aiFilled` with a confidence so the admin
 * sees what to check. Web search is offered to the model for artist facts so bios are grounded, not guessed.
 * Nothing the admin already typed is ever overwritten.
 */
export interface EventDraft {
  titleEn?: string; titleAr?: string; date?: string; session?: string; startsAt?: string; endsAt?: string; area?: string;
  pitchEn?: string; pitchAr?: string; descriptionEn?: string; descriptionAr?: string; vibeTags?: string[];
  lineup?: EventArtist[]; agentGuidance?: EventAgentGuidance; seo?: { title?: string; description?: string };
  dressCodeOverride?: string; ageRuleOverride?: string;
}
export interface Enriched { draft: EventDraft; aiFilled: Record<string, { confidence: number; source: string }>; notes: string[] }

const FILL_TOOL = {
  name: "fill_event",
  description: "Return the completed event. Keep every provided value exactly as given; fill only what is missing.",
  input_schema: {
    type: "object",
    properties: {
      titleAr: { type: "string" }, pitchEn: { type: "string", description: "One sentence the sales concierge says first, ≤ 160 chars" }, pitchAr: { type: "string" },
      descriptionEn: { type: "string", description: "2–3 short paragraphs, luxury-venue tone, no hype words" }, descriptionAr: { type: "string" },
      vibeTags: { type: "array", items: { type: "string" }, description: "3–6 tags, e.g. sunset, house, white party, family-friendly" },
      lineup: { type: "array", items: { type: "object", properties: { name: { type: "string" }, role: { type: "string", enum: ["headliner", "support", "resident"] }, origin: { type: "string" }, genre: { type: "string" }, setTime: { type: "string" }, bio: { type: "string", description: "≤ 50 words, factual" }, links: { type: "array", items: { type: "string" } } }, required: ["name"] } },
      agentGuidance: { type: "object", properties: { talkingPoints: { type: "array", items: { type: "string" } }, objections: { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] } }, doNotPromise: { type: "array", items: { type: "string" } } } },
      seo: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } },
      startsAt: { type: "string" }, endsAt: { type: "string" }, area: { type: "string" },
      confidence: { type: "object", description: "0–1 per filled top-level field name", additionalProperties: { type: "number" } },
      sources: { type: "object", description: "per filled field: 'web' | 'inferred' | 'translated'", additionalProperties: { type: "string" } },
      notes: { type: "array", items: { type: "string" }, description: "anything the admin must verify (e.g. 'set time unknown')" },
    },
    required: ["confidence", "sources"],
  },
} as const;

const SYSTEM = `You complete event records for NOA, Dubai's first floating beach club (sessions: morning 9:30–14:00 calm; afternoon 14:00–21:30 DJ; events may run as night sessions). Tone: polished, specific, no superlatives or exclamation marks. Arabic: Modern Standard, natural, keep brand names in Latin script. Use web search for artist facts (origin, genre, notable releases) and never invent biography details; if unsure, leave the bio short and lower the confidence. Do not change any value that was provided. Return only the tool call.`;

type Client = Pick<Anthropic, "messages">;

export async function enrichEvent(draft: EventDraft, client: Client | null = anthropicClient(), opts: { webSearch?: boolean } = {}): Promise<Enriched> {
  if (!client) throw new Error("ANTHROPIC_API_KEY is not configured");
  const missing = Object.entries({
    titleAr: !draft.titleAr, pitchEn: !draft.pitchEn, pitchAr: !draft.pitchAr, descriptionEn: !draft.descriptionEn, descriptionAr: !draft.descriptionAr,
    vibeTags: !draft.vibeTags?.length, lineup: !!draft.lineup?.length && draft.lineup.some((a) => !a.bio || !a.origin || !a.genre),
    agentGuidance: !draft.agentGuidance?.talkingPoints?.length, seo: !draft.seo?.title, startsAt: !draft.startsAt, endsAt: !draft.endsAt,
  }).filter(([, m]) => m).map(([k]) => k);
  if (!missing.length) return { draft, aiFilled: {}, notes: ["Nothing to fill."] };

  const tools: Anthropic.Tool[] = [FILL_TOOL as unknown as Anthropic.Tool];
  // The hosted web_search tool exists only on the direct Anthropic API; on Bedrock artist facts come from model knowledge, flagged with lower confidence
  const serverTools = opts.webSearch !== false && !onBedrock() ? [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }] : [];
  const res = await client.messages.create({
    model: CHAT_MODEL, max_tokens: 2500, system: SYSTEM,
    tools: [...tools, ...(serverTools as unknown as Anthropic.Tool[])],
    tool_choice: { type: "tool", name: "fill_event" },
    messages: [{ role: "user", content: `Event as entered by the admin (JSON):\n${JSON.stringify(draft, null, 2)}\n\nFill these missing fields: ${missing.join(", ")}.` }],
  });
  const call = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "fill_event");
  if (!call) throw new Error("The model returned no fill_event call");
  const out = call.input as Partial<EventDraft> & { confidence?: Record<string, number>; sources?: Record<string, string>; notes?: string[] };

  const merged: EventDraft = { ...draft };
  const aiFilled: Enriched["aiFilled"] = {};
  const take = <K extends keyof EventDraft>(k: K, value: EventDraft[K] | undefined) => {
    if (value === undefined || value === null || (Array.isArray(value) && !value.length) || (typeof value === "string" && !value.trim())) return;
    merged[k] = value;
    aiFilled[k] = { confidence: clamp(out.confidence?.[k as string] ?? 0.5), source: out.sources?.[k as string] ?? "inferred" };
  };
  if (!draft.titleAr) take("titleAr", out.titleAr);
  if (!draft.pitchEn) take("pitchEn", out.pitchEn);
  if (!draft.pitchAr) take("pitchAr", out.pitchAr);
  if (!draft.descriptionEn) take("descriptionEn", out.descriptionEn);
  if (!draft.descriptionAr) take("descriptionAr", out.descriptionAr);
  if (!draft.vibeTags?.length) take("vibeTags", out.vibeTags);
  if (!draft.agentGuidance?.talkingPoints?.length) take("agentGuidance", out.agentGuidance);
  if (!draft.seo?.title) take("seo", out.seo);
  if (!draft.startsAt) take("startsAt", out.startsAt);
  if (!draft.endsAt) take("endsAt", out.endsAt);
  if (draft.lineup?.length && out.lineup?.length) {
    // fill per-artist gaps only; never change names the admin typed
    merged.lineup = draft.lineup.map((a) => {
      const m = out.lineup!.find((x) => x.name.trim().toLowerCase() === a.name.trim().toLowerCase());
      return m ? { ...m, ...stripEmpty(a), name: a.name } : a;
    });
    aiFilled.lineup = { confidence: clamp(out.confidence?.lineup ?? 0.5), source: out.sources?.lineup ?? "web" };
  }
  return { draft: merged, aiFilled, notes: out.notes ?? [] };
}

const clamp = (n: number) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0.5));
const stripEmpty = <T extends object>(o: T): Partial<T> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "")) as Partial<T>;
