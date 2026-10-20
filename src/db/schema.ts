import { sql } from "drizzle-orm";
import {
  boolean, index, integer, jsonb, numeric, pgEnum, pgTable, primaryKey, smallint, text, timestamp, uniqueIndex, uuid, date,
} from "drizzle-orm/pg-core";

/**
 * NOA booking engine — Postgres schema (AWS RDS, me-central-1).
 *
 * Exclusivity model (why double-booking is impossible at the database):
 *   - holds:         partial UNIQUE (session_id, unit_id) WHERE released_at IS NULL
 *   - booking_items: partial UNIQUE (session_id, unit_id) WHERE active
 *   A unit is free only if it has no live hold and no active booking item.
 *   Expired holds are treated as free by every read and swept by a cron.
 */

export const slotEnum = pgEnum("slot", ["morning", "afternoon", "night", "full"]); // night/full: event sessions (UI support follows)
export const sessionStatusEnum = pgEnum("session_status", ["open", "closed"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled", "refunded", "expired"]);
export const paymentStatusEnum = pgEnum("payment_status", ["requires_payment", "succeeded", "failed", "refunded", "partially_refunded"]);
export const channelEnum = pgEnum("notification_channel", ["email", "whatsapp", "sms"]);
export const guestTierEnum = pgEnum("guest_tier", ["guest", "preferred", "vip"]);

/* ---------------- inventory ---------------- */

export const unitTypes = pgTable("unit_types", {
  id: text("id").primaryKey(),                 // 'cabana', 'front-daybed', ...
  cls: text("cls").notNull(),                  // CSS class on the yacht map
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descEn: text("desc_en").notNull(),
  descAr: text("desc_ar").notNull(),
  pax: smallint("pax").notNull(),
  priceMorning: integer("price_morning").notNull(),     // AED, whole dirhams
  priceAfternoon: integer("price_afternoon").notNull(),
  perPerson: boolean("per_person").notNull().default(false),
  tier: smallint("tier").notNull().default(0),          // VIP ranking, higher = better
  imageSlot: text("image_slot"),
  active: boolean("active").notNull().default(true),
});

export const inventoryUnits = pgTable("inventory_units", {
  id: text("id").primaryKey(),                 // matches data-seat on the map: 'cabana-1'
  unitTypeId: text("unit_type_id").notNull().references(() => unitTypes.id),
  label: text("label").notNull(),              // 'C1'
  deck: text("deck").notNull(),                // 'upper' | 'main'
  sort: smallint("sort").notNull().default(0),
  vipPriority: boolean("vip_priority").notNull().default(false), // Day 3: reserved for Preferred/VIP until release time
  active: boolean("active").notNull().default(true),
});

/* ---------------- sessions ---------------- */

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull(),
  slot: slotEnum("slot").notNull(),
  status: sessionStatusEnum("status").notNull().default("open"),
  vipReleaseAt: timestamp("vip_release_at", { withTimezone: true }), // Day 3
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("sessions_date_slot_uq").on(t.date, t.slot)]);

/* ---------------- guests ---------------- */

export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),              // stored lower-cased by the application
  phone: text("phone"),
  name: text("name"),
  cognitoSub: text("cognito_sub"),             // set when the guest signs in (passwordless)
  tier: guestTierEnum("tier").notNull().default("guest"),
  tierManual: boolean("tier_manual").notNull().default(false), // NOA flagged by hand; nightly job won't override
  locale: text("locale").notNull().default("en"),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),   // mirrors the latest email consent in guest_consents
  consentAt: timestamp("consent_at", { withTimezone: true }),
  preferredUnitType: text("preferred_unit_type").references(() => unitTypes.id),   // 0006: the seat type they usually book
  birthdayMonth: smallint("birthday_month"),                                       // 0006: 1-12, no full date stored
  lastBookingAt: timestamp("last_booking_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("guests_email_uq").on(t.email),
  uniqueIndex("guests_cognito_sub_uq").on(t.cognitoSub),
]);

/** 0006: consent history, one row per grant or withdrawal per channel (email | whatsapp | sms). */
export const guestConsents = pgTable("guest_consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  guestId: uuid("guest_id").notNull().references(() => guests.id),
  channel: channelEnum("channel").notNull(),
  granted: boolean("granted").notNull(),
  source: text("source").notNull(),            // 'popup' | 'account' | 'checkout' | 'newsletter' | 'delete_request'
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  ip: text("ip"),
  userAgent: text("user_agent"),
}, (t) => [index("guest_consents_guest_idx").on(t.guestId, t.channel, t.at)]);

/* ---------------- holds ---------------- */

export const holds = pgTable("holds", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => sessions.id),
  unitId: text("unit_id").notNull().references(() => inventoryUnits.id),
  cartToken: text("cart_token").notNull(),     // anonymous browser identity (httpOnly cookie)
  guestId: uuid("guest_id").references(() => guests.id),
  bookingId: uuid("booking_id"),               // set once attached to a pending booking
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  extendedAt: timestamp("extended_at", { withTimezone: true }), // one extension at the payment step
  releasedAt: timestamp("released_at", { withTimezone: true }),
  releaseReason: text("release_reason"),       // 'expired' | 'cart' | 'converted' | 'admin'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("holds_live_unit_uq").on(t.sessionId, t.unitId).where(sql`${t.releasedAt} IS NULL`),
  index("holds_expires_idx").on(t.expiresAt).where(sql`${t.releasedAt} IS NULL`),
  index("holds_cart_idx").on(t.cartToken),
]);

/* ---------------- bookings ---------------- */

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  ref: text("ref").notNull(),                  // 'NOA-XXXXXX' shown to the guest
  guestId: uuid("guest_id").notNull().references(() => guests.id),
  status: bookingStatusEnum("status").notNull().default("pending"),
  currency: text("currency").notNull().default("AED"),
  subtotal: integer("subtotal").notNull(),
  vat: integer("vat").notNull(),
  total: integer("total").notNull(),
  locale: text("locale").notNull().default("en"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  cartToken: text("cart_token"),
  source: text("source").notNull().default("web"), // 'web' | 'chat' | 'voice' | 'admin'
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),   // wristband issued at the pier desk
  checkedInBy: text("checked_in_by"),                                  // admin email who scanned
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
}, (t) => [
  uniqueIndex("bookings_ref_uq").on(t.ref),
  uniqueIndex("bookings_pi_uq").on(t.stripePaymentIntentId),
  index("bookings_guest_idx").on(t.guestId),
]);

export const bookingItems = pgTable("booking_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  sessionId: uuid("session_id").notNull().references(() => sessions.id),
  unitId: text("unit_id").notNull().references(() => inventoryUnits.id),
  guests: smallint("guests").notNull(),
  arrivalTime: text("arrival_time").notNull(), // '14:30'
  price: integer("price").notNull(),
  /** true while the booking is pending or confirmed; false once cancelled/refunded/expired */
  active: boolean("active").notNull().default(true),
}, (t) => [
  uniqueIndex("booking_items_live_unit_uq").on(t.sessionId, t.unitId).where(sql`${t.active}`),
  index("booking_items_booking_idx").on(t.bookingId),
]);

/* ---------------- payments & integrations ---------------- */

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id),
  provider: text("provider").notNull().default("stripe"),
  providerId: text("provider_id").notNull(),  // payment_intent id / refund id
  kind: text("kind").notNull(),                // 'charge' | 'refund'
  amount: integer("amount").notNull(),         // fils (AED minor units) as Stripe reports
  status: paymentStatusEnum("status").notNull(),
  raw: jsonb("raw"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("payments_provider_id_uq").on(t.provider, t.providerId)]);

export const webhookEvents = pgTable("webhook_events", {
  provider: text("provider").notNull(),
  eventId: text("event_id").notNull(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  error: text("error"),
}, (t) => [primaryKey({ columns: [t.provider, t.eventId] })]);

export const notificationLog = pgTable("notification_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => bookings.id),
  channel: channelEnum("channel").notNull(),
  template: text("template").notNull(),        // 'booking_confirmed' | 'booking_reminder_24h' | 'booking_late_refunded' | 'shuttle_alert'
  to: text("to").notNull(),
  locale: text("locale").notNull().default("en"),
  status: text("status").notNull(),            // 'queued' | 'sending' | 'sent' | 'failed' | 'skipped'
  attempts: smallint("attempts").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  payload: jsonb("payload"),                   // rendered message (subject/body/variables) for audit and replay
  providerId: text("provider_id"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
}, (t) => [
  index("notification_booking_idx").on(t.bookingId),
  index("notification_queue_idx").on(t.nextAttemptAt).where(sql`${t.status} = 'queued'`),
  // one message per booking × template × channel — reminders and confirmations can never double-send
  uniqueIndex("notification_once_uq").on(t.bookingId, t.template, t.channel).where(sql`${t.bookingId} IS NOT NULL`),
]);

/* ---------------- settings ---------------- */

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),               // 'hold_minutes' | 'hold_extension_minutes' | 'vat_rate' | ...
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* numeric kept for future per-session price overrides */
export const sessionPriceOverrides = pgTable("session_price_overrides", {
  sessionId: uuid("session_id").notNull().references(() => sessions.id),
  unitTypeId: text("unit_type_id").notNull().references(() => unitTypes.id),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
}, (t) => [primaryKey({ columns: [t.sessionId, t.unitTypeId] })]);

/* ---------------- admin audit trail ---------------- */

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor: text("actor").notNull(),              // admin email (from Cognito) or 'system'
  role: text("role").notNull(),                // owner | editor | frontdesk | system
  action: text("action").notNull(),            // 'booking.refund' | 'guest.tier.set' | 'settings.update' | 'unit.update' | ...
  entity: text("entity").notNull(),            // table name
  entityId: text("entity_id").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("audit_entity_idx").on(t.entity, t.entityId), index("audit_created_idx").on(t.createdAt)]);

/* ---------------- events (sales content for site + agents) ---------------- */

export const eventStatusEnum = pgEnum("event_status", ["draft", "published", "past", "cancelled"]);
export const eventKindEnum = pgEnum("event_kind", ["regular", "main", "highlight"]);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  status: eventStatusEnum("status").notNull().default("draft"),
  kind: eventKindEnum("kind").notNull().default("regular"),   // main = featured upcoming; highlight = best past (social proof)
  sortWeight: smallint("sort_weight").notNull().default(0),
  featuredUntil: date("featured_until"),
  // when & where
  date: date("date").notNull(),
  session: slotEnum("session").notNull().default("afternoon"),
  doorsAt: text("doors_at"), startsAt: text("starts_at"), endsAt: text("ends_at"),   // "14:00"
  area: text("area"),                                                                  // deck / stage
  sessionId: uuid("session_id").references(() => sessions.id),                        // link to the bookable session, if any
  // copy (EN authored, AR drafted by AI until reviewed)
  titleEn: text("title_en").notNull(), titleAr: text("title_ar"),
  pitchEn: text("pitch_en"), pitchAr: text("pitch_ar"),                 // one-liner the agent says first
  descriptionEn: text("description_en"), descriptionAr: text("description_ar"),
  vibeTags: jsonb("vibe_tags").$type<string[]>().notNull().default([]),
  dressCodeOverride: text("dress_code_override"), ageRuleOverride: text("age_rule_override"),
  // structured groups
  lineup: jsonb("lineup").$type<EventArtist[]>().notNull().default([]),
  ticketing: jsonb("ticketing").$type<EventTicketing>().notNull().default({}),
  media: jsonb("media").$type<EventMedia>().notNull().default({}),
  agentGuidance: jsonb("agent_guidance").$type<EventAgentGuidance>().notNull().default({}),
  recap: jsonb("recap").$type<EventRecap>().notNull().default({}),
  ops: jsonb("ops").$type<EventOps>().notNull().default({}),
  seo: jsonb("seo").$type<{ title?: string; description?: string; ogImageSlot?: string }>().notNull().default({}),
  announceOnPublish: boolean("announce_on_publish").notNull().default(false),
  /** fields the AI filled, awaiting human review: { field: { confidence, source } } */
  aiFilled: jsonb("ai_filled").$type<Record<string, { confidence: number; source: string }>>().notNull().default({}),
  arStatus: text("ar_status").notNull().default("draft"),   // draft | reviewed
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
}, (t) => [uniqueIndex("events_slug_uq").on(t.slug), index("events_date_idx").on(t.date), index("events_status_kind_idx").on(t.status, t.kind)]);

export interface EventArtist { name: string; role?: "headliner" | "support" | "resident"; origin?: string; genre?: string; setTime?: string; bio?: string; photoSlot?: string; links?: string[] }
export interface EventTicketing { seatTypes?: string[]; prices?: Record<string, number>; surchargeAed?: number; minSpendCabanaAed?: number; capacityCap?: number; salesOpenAt?: string; salesCloseAt?: string; memberPresaleHours?: number; addOns?: { name: string; priceAed: number }[] }
export interface EventMedia { poster?: string; gallery?: string[]; teaser?: string; aftermovie?: string }
export interface EventAgentGuidance { talkingPoints?: string[]; objections?: { q: string; a: string }[]; doNotPromise?: string[] }
export interface EventRecap { highlightsEn?: string; highlightsAr?: string; attendance?: string; quotes?: string[]; pressLinks?: string[]; photos?: string[] }
export interface EventOps { faqs?: { q: string; a: string }[]; shuttleNotes?: string; checkinNotes?: string; sponsor?: string; internalNotes?: string }

/* ---------------- knowledge-base sync (outbox) ---------------- */

export const kbSyncJobs = pgTable("kb_sync_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  entity: text("entity").notNull(),            // 'event' | 'site'
  entityId: text("entity_id").notNull(),       // event id or 'site'
  action: text("action").notNull(),            // 'upsert' | 'delete'
  status: text("status").notNull().default("queued"),   // queued | sending | done | failed | skipped
  attempts: smallint("attempts").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  doneAt: timestamp("done_at", { withTimezone: true }),
}, (t) => [
  uniqueIndex("kb_sync_pending_uq").on(t.entity, t.entityId).where(sql`${t.status} IN ('queued','sending')`), // coalesce repeated saves
  index("kb_sync_due_idx").on(t.nextAttemptAt).where(sql`${t.status} = 'queued'`),
]);

export const kbDocuments = pgTable("kb_documents", {
  entity: text("entity").notNull(),
  entityId: text("entity_id").notNull(),
  provider: text("provider").notNull().default("elevenlabs"),
  documentId: text("document_id").notNull(),
  contentHash: text("content_hash").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.entity, t.entityId, t.provider] })]);

/* ---------------- media (uploads to S3, served through /api/media) ---------------- */

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull(),                   // S3 object key: media/<sha256-prefix>/<filename>
  kind: text("kind").notNull(),                 // image | video
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  width: integer("width"), height: integer("height"), durationSec: integer("duration_sec"),
  altEn: text("alt_en"), altAr: text("alt_ar"),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("media_assets_key_uq").on(t.key)]);

/** Which uploaded asset fills which site slot (hero-video, pkg-morning, cabana-1 …). Absent → registry placeholder. */
export const mediaSlots = pgTable("media_slots", {
  slotId: text("slot_id").primaryKey(),
  assetId: uuid("asset_id").notNull().references(() => mediaAssets.id),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
