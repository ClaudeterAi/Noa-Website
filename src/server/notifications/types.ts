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
  items: { unitName: string; date: string; slot: "morning" | "afternoon" | "night" | "full"; guests: number; arrivalTime: string }[];
  manageUrl: string;
  ticketUrl?: string;   // wristband page with the QR (confirmed bookings)
  qrImageUrl?: string;  // PNG of the QR, embedded in the email
  ticketToken?: string; // signed token, the dynamic suffix of the WhatsApp "Show wristband" button
  ticket?: import("@/server/ticket-view").TicketView | null;   // full ticket for the email (event, rules, venue)
}

export interface RenderedEmail { subject: string; text: string; html: string; ics?: { filename: string; content: string } }
/** WhatsApp Business messages outside the 24-h window must use Meta-approved templates; we send the Twilio Content SID + variables. */
export interface RenderedWhatsApp { contentSid: string; variables: Record<string, string>; fallbackText: string }

export interface EmailProvider { send(to: string, msg: RenderedEmail): Promise<{ id: string }> }
export interface WhatsAppProvider { send(toE164: string, msg: RenderedWhatsApp): Promise<{ id: string }> }
