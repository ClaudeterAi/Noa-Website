import { Resend } from "resend";
import type { EmailProvider, RenderedEmail } from "../types";

/** Resend transactional email. From-address must be on a verified domain in NOA's Resend account. */
export function resendProvider(): EmailProvider | null {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM; // e.g. "NOA Dubai <reservations@noa-dubai.com>"
  if (!key || !from) return null;
  const client = new Resend(key);
  return {
    async send(to: string, msg: RenderedEmail) {
      const { data, error } = await client.emails.send({
        from, to, subject: msg.subject, text: msg.text, html: msg.html,
        replyTo: process.env.EMAIL_REPLY_TO ?? undefined,
        attachments: msg.ics ? [{ filename: msg.ics.filename, content: Buffer.from(msg.ics.content).toString("base64"), contentType: "text/calendar; method=PUBLISH" }] : undefined,
      });
      if (error || !data) throw new Error(`resend: ${error?.message ?? "no id returned"}`);
      return { id: data.id };
    },
  };
}
