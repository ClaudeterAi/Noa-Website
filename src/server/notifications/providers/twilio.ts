import Twilio from "twilio";
import type { RenderedWhatsApp, WhatsAppProvider } from "../types";

/** Twilio WhatsApp Business API with Meta-approved Content Templates (required outside the 24-h session window). */
export function twilioWhatsAppProvider(): WhatsAppProvider | null {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_WHATSAPP_FROM; // "whatsapp:+971..."
  if (!sid || !token || !from) return null;
  const client = Twilio(sid, token);
  return {
    async send(toE164: string, msg: RenderedWhatsApp) {
      const m = await client.messages.create({
        from, to: `whatsapp:${toE164}`, contentSid: msg.contentSid, contentVariables: JSON.stringify(msg.variables),
        statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL ?? undefined,
      });
      return { id: m.sid };
    },
  };
}

/** E.164 normalisation for UAE-style input ("+971 50 123 4567", "050 123 4567"). Returns null when it cannot be made valid. */
export function toE164(raw: string, defaultCountry = "971"): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  let n = digits.startsWith("+") ? digits.slice(1) : digits.startsWith("00") ? digits.slice(2) : digits;
  if (!digits.startsWith("+") && !digits.startsWith("00")) {
    if (n.startsWith("0")) n = defaultCountry + n.slice(1);
    else if (!n.startsWith(defaultCountry) && n.length <= 10) n = defaultCountry + n;
  }
  return /^\d{8,15}$/.test(n) ? `+${n}` : null;
}
