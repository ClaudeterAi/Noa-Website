import { anthropicClient, CHAT_MODEL } from "./chat";

/** One cheap probe so admins can see whether the AI features (event auto-fill, chat concierge) are usable right now. */
export async function aiStatus(): Promise<{ ok: boolean; detail: string; model: string }> {
  const client = anthropicClient();
  if (!client) return { ok: false, detail: "No AI backend configured (BEDROCK_REGION or ANTHROPIC_API_KEY).", model: CHAT_MODEL };
  try {
    await client.messages.create({ model: CHAT_MODEL, max_tokens: 4, messages: [{ role: "user", content: "ok" }] });
    return { ok: true, detail: `Event auto-fill and the chat concierge are live on ${CHAT_MODEL}.`, model: CHAT_MODEL };
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    const detail = /Too many tokens|Throttl/i.test(m) ? "AWS Bedrock is still rate-limiting this new account (zero daily quota). Clears automatically within a day or two; a support case lifts it sooner."
      : /not available for this account/i.test(m) ? "This model is not enabled for the account on Bedrock." : /use case/i.test(m) ? "Submit the Anthropic use-case form in the Bedrock console." : `AI call failed: ${m.slice(0, 120)}`;
    return { ok: false, detail, model: CHAT_MODEL };
  }
}
