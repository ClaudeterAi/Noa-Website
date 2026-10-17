export type Channel = "email" | "whatsapp";
export type Template = "booking_confirmed" | "booking_reminder_24h" | "booking_late_refunded" | "shuttle_alert";
export type Locale = "en" | "ar";

/** Everything a template needs; assembled from the booking, its items and the guest. */
export interface BookingContext {
  ref: string;
  guestName: string;
  email: string;
  phone: string | null;
  locale: Locale;
  total: number;                 // AED, whole dirhams
  items: { unitName: string; date: string; slot: "morning" | "afternoon"; guests: number; arrivalTime: string }[];
  manageUrl: string;
}

export interface RenderedEmail { subject: string; text: string; html: string; ics?: { filename: string; content: string } }
/** WhatsApp Business messages outside the 24-h window must use Meta-approved templates; we send the Twilio Content SID + variables. */
export interface RenderedWhatsApp { contentSid: string; variables: Record<string, string>; fallbackText: string }

export interface EmailProvider { send(to: string, msg: RenderedEmail): Promise<{ id: string }> }
export interface WhatsAppProvider { send(toE164: string, msg: RenderedWhatsApp): Promise<{ id: string }> }
