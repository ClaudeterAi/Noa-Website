import Anthropic from "@anthropic-ai/sdk";
import { AnthropicBedrock } from "@anthropic-ai/bedrock-sdk";
import type { MessageParam, Tool, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { buildKnowledge } from "./knowledge";
import { runTool, toolDefinitions, type AgentContext, type ToolName } from "./tools";

/**
 * Claude runs through Amazon Bedrock in NOA's AWS account (19 Oct 2026: "Anthropic we can take from Bedrock only").
 * Model IDs are Bedrock inference-profile IDs, e.g. eu.anthropic.claude-sonnet-5-5; set per environment.
 * A direct Anthropic key is used only if ANTHROPIC_API_KEY is set and BEDROCK_REGION is not.
 */
export const CHAT_MODEL = process.env.ANTHROPIC_MODEL ?? (process.env.BEDROCK_REGION ? "eu.anthropic.claude-sonnet-5-5" : "claude-sonnet-5-5");
export const onBedrock = () => !!process.env.BEDROCK_REGION;

export function systemPrompt(locale: "en" | "ar", knowledge: string, mode: "chat" | "voice", today: string): string {
  const ar = locale === "ar";
  const persona = ar
    ? `أنت كونسيرج نوا دبي — أول نادٍ شاطئي عائم في دبي. تتحدث كمضيف فندقي راقٍ: دافئ، موجز، واثق، لا تبالغ. تجيب بلغة الضيف أياً كانت — العربية أو الإنجليزية أو غيرهما؛ أبقِ أسماء العلامة والأسعار والرقم المرجعي بالحروف اللاتينية.`
    : `You are the NOA Dubai concierge — Dubai's first floating beach club. You speak like a polished hotel host: warm, brief, confident, never gushing. Answer in whatever language the guest writes — English, Arabic, Russian, Hindi, Chinese, French, German, Spanish, Italian, Turkish or any other; keep brand names, prices and the reference in Latin script.`;
  const rules = ar
    ? `القواعد:
- التاريخ اليوم ${today} (توقيت دبي). الأسعار والتوفر تأتي فقط من الأدوات؛ لا تخمّن أبداً. استخدم get_availability قبل ذكر أي توفر.
- عند الحجز: أكد التاريخ والجلسة ونوع المقعد وعدد الضيوف، ثم hold_seat، ثم أعطِ رابط الدفع عبر checkout_link. لا تطلب بيانات بطاقة أبداً؛ الدفع يتم على صفحة الحجز فقط.
- المقعد يبقى محجوزاً لدقائق محدودة؛ اذكر ذلك عند الحجز.
- إن لم تعرف، قل ذلك واعرض التواصل مع الفريق: ${"hello@noa-dubai.com"} أو +971 4 840 0000.
- لا تختلق فعاليات أو فنانين أو سياسات غير موجودة في قاعدة المعرفة.`
    : `Rules:
- Today is ${today} (Dubai time). Prices and availability come only from tools; never guess. Call get_availability before stating any availability.
- To book: confirm date, session, seat type and guest count, then hold_seat, then give the payment link via checkout_link. Never ask for card details; payment happens only on the booking page.
- Held seats expire after a few minutes; say so when you hold them.
- If you don't know, say so and offer the team: hello@noa-dubai.com or +971 4 840 0000.
- Never invent events, artists or policies that are not in the knowledge base.`;
  const style = mode === "voice"
    ? (ar ? `هذا حديث صوتي: جملتان كحد أقصى، بلا قوائم أو رموز أو تنسيق، اكتب الأرقام بالكلمات عندما تُقرأ بصوت.` : `This is spoken voice: two sentences maximum, no lists, no symbols or markdown, numbers in words where natural.`)
    : (ar ? `هذه دردشة مكتوبة: فقرات قصيرة، قوائم فقط عند عرض خيارات متعددة، روابط الصفحات بصيغة مسار نسبي.` : `This is written chat: short paragraphs, lists only when offering several options, link pages by their relative path.`);
  return `${persona}\n\n${rules}\n\n${style}\n\n${knowledge}`;
}

export interface ChatMessage { role: "user" | "assistant"; content: string }
export type ChatEvent = { type: "text"; text: string } | { type: "tool"; name: string; input: unknown; result: unknown } | { type: "done"; stop: string };

type Client = Pick<Anthropic, "messages">;
let defaultClient: Client | null = null;
export function anthropicClient(): Client | null {
  if (defaultClient) return defaultClient;
  if (process.env.BEDROCK_REGION) {
    // credentials: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY of the least-privilege app user (bedrock:InvokeModel*)
    defaultClient = new AnthropicBedrock({ awsRegion: process.env.BEDROCK_REGION }) as unknown as Client;
    return defaultClient;
  }
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return (defaultClient ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));
}

const MAX_ROUNDS = 5;
const MAX_HISTORY = 24;

/**
 * Chat turn with tool use. Yields text as it arrives and a `tool` event per executed tool.
 * `client` is injectable so tests can run the loop against a fake model.
 */
export async function* chatTurn(history: ChatMessage[], ctx: AgentContext, client: Client, todayIso: string): AsyncGenerator<ChatEvent> {
  const knowledge = await buildKnowledge(ctx.locale);
  const system = systemPrompt(ctx.locale, knowledge, "chat", todayIso);
  const messages: MessageParam[] = history.slice(-MAX_HISTORY).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  const tools = toolDefinitions.map((t) => ({ name: t.name, description: t.description, input_schema: t.input_schema })) as unknown as Tool[];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await client.messages.create({ model: CHAT_MODEL, max_tokens: 700, system, messages, tools });
    const toolUses = res.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
    for (const b of res.content) if (b.type === "text" && b.text) yield { type: "text", text: b.text };
    if (res.stop_reason !== "tool_use" || !toolUses.length) { yield { type: "done", stop: res.stop_reason ?? "end_turn" }; return; }

    messages.push({ role: "assistant", content: res.content });
    const results = [];
    for (const tu of toolUses) {
      const name = tu.name as ToolName;
      let result: unknown;
      try { result = await runTool(name, (tu.input ?? {}) as Record<string, unknown>, ctx); }
      catch (e) { result = { error: e instanceof Error ? e.message : String(e) }; }
      yield { type: "tool", name, input: tu.input, result };
      results.push({ type: "tool_result" as const, tool_use_id: tu.id, content: JSON.stringify(result) });
    }
    messages.push({ role: "user", content: results });
  }
  yield { type: "done", stop: "max_rounds" };
}
