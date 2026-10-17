/**
 * Configure NOA's ElevenLabs voice agent from code (idempotent; safe to re-run after every content publish).
 *
 *   ELEVENLABS_API_KEY=… ELEVENLABS_TOOL_SECRET=… SITE_URL=https://… npx tsx scripts/elevenlabs-setup.ts [--agent <id>] [--dry]
 *
 * What it does:
 *   1. finds or creates the workspace secret that authenticates webhook calls to /api/agent/tools
 *   2. creates/updates 3 client tools (navigate, open_booking, switch_language) and 6 webhook tools (one per server tool)
 *   3. uploads the knowledge document (EN + AR) as a text KB source (replacing the previous NOA doc)
 *   4. patches the agent: prompt, first message (EN; Arabic preset), LLM, tool ids, KB, dynamic-variable defaults
 * Nothing is deleted except the previous NOA knowledge document it created itself.
 */
import { toolDefinitions } from "../src/server/concierge/tools";
import { readFileSync } from "node:fs";
import { buildKnowledge } from "../src/server/concierge/knowledge";
import { pool } from "../src/db/client";

const API = process.env.ELEVENLABS_API ?? "https://api.elevenlabs.io";
const KEY = process.env.ELEVENLABS_API_KEY;
const SITE = (process.env.SITE_URL ?? "https://noa-website-two.vercel.app").replace(/\/$/, "");
const TOOL_SECRET = process.env.ELEVENLABS_TOOL_SECRET;
const LLM = process.env.ELEVENLABS_LLM ?? "claude-haiku-4-5";
const DRY = process.argv.includes("--dry");
const agentArg = process.argv.indexOf("--agent");
const AGENT_ID = agentArg > -1 ? process.argv[agentArg + 1] : process.env.ELEVENLABS_AGENT_ID;

if (!KEY) throw new Error("ELEVENLABS_API_KEY missing");
if (!TOOL_SECRET) throw new Error("ELEVENLABS_TOOL_SECRET missing (any random 32+ char string; must equal the site's env var)");

async function el<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { "xi-api-key": KEY!, ...(init?.json ? { "Content-Type": "application/json" } : {}), ...(init?.headers ?? {}) }, body: init?.json ? JSON.stringify(init.json) : init?.body });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}: ${text.slice(0, 600)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

/* ---------- 1. secret ---------- */
async function ensureSecret(): Promise<string> {
  const list = await el<{ secrets: { secret_id: string; name: string }[] }>("/v1/convai/secrets");
  const existing = list.secrets.find((s) => s.name === "noa_tool_secret");
  if (existing) { if (!DRY) await el(`/v1/convai/secrets/${existing.secret_id}`, { method: "PATCH", json: { type: "update", name: "noa_tool_secret", value: TOOL_SECRET } }).catch(() => undefined); return existing.secret_id; }
  if (DRY) return "dry-secret";
  const created = await el<{ secret_id: string }>("/v1/convai/secrets", { method: "POST", json: { type: "new", name: "noa_tool_secret", value: TOOL_SECRET } });
  return created.secret_id;
}

/* ---------- 2. tools ---------- */
type Prop = Record<string, unknown>;
const str = (description: string, extra: Prop = {}): Prop => ({ type: "string", description, ...extra });

function clientTools(): Prop[] {
  return [
    { type: "client", name: "navigate", expects_response: true, response_timeout_secs: 10,
      description: "Move the guest's screen to a page of the NOA website, optionally to a section. Prefer the `path` returned by find_page. Pages: home, morning-package, afternoon-package, cabana, events, about, location, faq, contact, booking.",
      parameters: { type: "object", properties: { path: str("Relative path from find_page, e.g. /en/cabana#tariff"), page: str("Page id if no path is known"), section: str("Section id to scroll to, optional") }, required: [] } },
    { type: "client", name: "open_booking", expects_response: true, response_timeout_secs: 10,
      description: "Open the booking page where the guest pays for the seats already held. Call this after checkout_link when the guest wants to pay. Never collect card details by voice.",
      parameters: { type: "object", properties: {}, required: [] } },
    { type: "client", name: "switch_language", expects_response: true, response_timeout_secs: 10,
      description: "Switch the website language when the guest switches between English and Arabic.",
      parameters: { type: "object", properties: { locale: str("en or ar", { enum: ["en", "ar"] }) }, required: ["locale"] } },
  ];
}

function webhookTools(secretId: string): Prop[] {
  return toolDefinitions.map((t) => {
    const schema = t.input_schema as { properties: Record<string, { type: string; description?: string; enum?: readonly string[] }>; required?: readonly string[] };
    const inputProps: Record<string, Prop> = {};
    for (const [k, v] of Object.entries(schema.properties ?? {})) inputProps[k] = { type: v.type === "integer" ? "integer" : v.type, description: v.description ?? k, ...(v.enum ? { enum: [...v.enum] } : {}) };
    return {
      type: "webhook", name: t.name, description: t.description, response_timeout_secs: 20,
      api_schema: {
        url: `${SITE}/api/agent/tools`, method: "POST",
        request_headers: { "x-noa-agent-secret": { secret_id: secretId } },
        request_body_schema: {
          type: "object", required: ["tool", "cart_token", "locale", "input"],
          properties: {
            tool: { type: "string", constant_value: t.name },
            cart_token: { type: "string", dynamic_variable: "cart_token" },
            locale: { type: "string", dynamic_variable: "locale" },
            guest_session: { type: "string", dynamic_variable: "guest_session" },
            input: { type: "object", description: "Tool arguments", properties: inputProps, required: [...(schema.required ?? [])] },
          },
        },
      },
    };
  });
}

async function ensureTools(secretId: string): Promise<Record<string, string>> {
  const list = await el<{ tools: { id: string; tool_config: { name: string } }[] }>("/v1/convai/tools");
  const byName = new Map(list.tools.map((t) => [t.tool_config.name, t.id]));
  const ids: Record<string, string> = {};
  for (const cfg of [...clientTools(), ...webhookTools(secretId)]) {
    const name = cfg.name as string;
    const existing = byName.get(name);
    if (DRY) { ids[name] = existing ?? "dry"; continue; }
    if (existing) { await el(`/v1/convai/tools/${existing}`, { method: "PATCH", json: { tool_config: cfg } }); ids[name] = existing; }
    else { const c = await el<{ id: string }>("/v1/convai/tools", { method: "POST", json: { tool_config: cfg } }); ids[name] = c.id; }
  }
  return ids;
}

/* ---------- 3. knowledge ---------- */
async function ensureKnowledge(): Promise<{ id: string; name: string }> {
  const name = `NOA knowledge (EN+AR) ${new Date().toISOString().slice(0, 10)}`;
  const text = `${await buildKnowledge("en")}\n\n---\n\n${await buildKnowledge("ar")}`;
  if (DRY) return { id: "dry-kb", name };
  const created = await el<{ id: string; name: string }>("/v1/convai/knowledge-base/text", { method: "POST", json: { name, text } });
  // retire previous NOA docs this script created (keeps the workspace tidy; never touches other docs)
  const docs = await el<{ documents: { id: string; name: string }[] }>("/v1/convai/knowledge-base?page_size=100").catch(() => ({ documents: [] }));
  for (const d of docs.documents) if (d.name.startsWith("NOA knowledge (EN+AR)") && d.id !== created.id) await el(`/v1/convai/knowledge-base/${d.id}`, { method: "DELETE" }).catch(() => undefined);
  return { id: created.id, name: created.name };
}

/* ---------- 4. agent ---------- */
async function patchAgent(agentId: string, toolIds: Record<string, string>, kb: { id: string; name: string }) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(new Date());
  const prompt = readFileSync(new URL("../agent/prompt.voice.md", import.meta.url), "utf-8");
  const firstEn = "Welcome to NOA. I can tell you about the day, check seats, or hold a place for you — what would you like?";
  /* First messages per language. Dubai's main visitor languages; NOA can add more in the dashboard — presets set by hand are kept. */
  const firstMessages: Record<string, string> = {
    ar: "أهلاً بك في نوا. يمكنني أن أخبرك عن اليوم، أو أتحقق من المقاعد، أو أحجز لك مكاناً — ماذا تريد؟",
    ru: "Добро пожаловать в NOA. Я могу рассказать о дне, проверить места или забронировать их для вас — что вы хотите?",
    hi: "NOA में आपका स्वागत है। मैं आपको दिन के बारे में बता सकता हूँ, सीटें देख सकता हूँ, या आपके लिए जगह रोक सकता हूँ — आप क्या चाहेंगे?",
    zh: "欢迎来到 NOA。我可以为您介绍当天安排、查看座位，或为您预留位置——您想了解什么？",
    fr: "Bienvenue à NOA. Je peux vous présenter la journée, vérifier les places ou vous en réserver une — que souhaitez-vous ?",
    de: "Willkommen bei NOA. Ich kann Ihnen den Tag vorstellen, Plätze prüfen oder einen für Sie reservieren — was möchten Sie?",
    es: "Bienvenido a NOA. Puedo contarle sobre el día, comprobar asientos o reservarle un lugar — ¿qué desea?",
    it: "Benvenuto a NOA. Posso raccontarle la giornata, controllare i posti o riservarne uno per lei — cosa desidera?",
    tr: "NOA'ya hoş geldiniz. Size günü anlatabilir, koltukları kontrol edebilir veya sizin için yer ayırabilirim — ne istersiniz?",
  };
  const current = await el<{ conversation_config: { language_presets?: Record<string, unknown> } }>(`/v1/convai/agents/${agentId}`);
  const presets: Record<string, unknown> = { ...(current.conversation_config.language_presets ?? {}) };
  for (const [code, msg] of Object.entries(firstMessages)) if (!presets[code]) presets[code] = { overrides: { agent: { first_message: msg } } };
  const body = {
    name: "NOA Concierge",
    conversation_config: {
      agent: {
        first_message: firstEn,
        language: "en",
        dynamic_variables: { dynamic_variable_placeholders: { cart_token: "00000000-0000-4000-8000-000000000000", locale: "en", current_page: "/", today, guest_name: "", guest_tier: "guest", cart_items: 0, cart_total_aed: 0, guest_session: "" } },
        prompt: {
          prompt, llm: LLM, temperature: 0.3,
          tool_ids: Object.values(toolIds),
          knowledge_base: [{ type: "text", id: kb.id, name: kb.name, usage_mode: "auto" }],
          built_in_tools: { end_call: { name: "end_call", description: "", type: "system", params: { system_tool_type: "end_call" } }, language_detection: { name: "language_detection", description: "", type: "system", params: { system_tool_type: "language_detection" } }, skip_turn: { name: "skip_turn", description: "", type: "system", params: { system_tool_type: "skip_turn" } } },
        },
      },
      language_presets: presets,
      turn: { turn_timeout: 7, silence_end_call_timeout: 60 },
      conversation: { max_duration_seconds: 600 },
    },
  };
  if (DRY) { console.log(JSON.stringify(body, null, 2).slice(0, 1500)); return; }
  void today;
  await el(`/v1/convai/agents/${agentId}`, { method: "PATCH", json: body });
}

(async () => {
  if (!AGENT_ID) throw new Error("ELEVENLABS_AGENT_ID (or --agent) missing");
  const secretId = await ensureSecret();
  const toolIds = await ensureTools(secretId);
  const kb = await ensureKnowledge();
  await patchAgent(AGENT_ID, toolIds, kb);
  console.log(JSON.stringify({ agent: AGENT_ID, site: SITE, llm: LLM, tools: toolIds, knowledge: kb.name, dry: DRY }, null, 2));
  await pool.end();
})().catch((e) => { console.error(String(e)); process.exit(1); });
