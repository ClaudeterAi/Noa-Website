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

export const slotEnum = pgEnum("slot", ["morning", "afternoon"]);
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
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  lastBookingAt: timestamp("last_booking_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("guests_email_uq").on(t.email),
  uniqueIndex("guests_cognito_sub_uq").on(t.cognitoSub),
]);

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
  template: text("template").notNull(),        // 'booking_confirmed' | 'reminder_24h' | ...
  to: text("to").notNull(),
  status: text("status").notNull(),            // 'queued' | 'sent' | 'delivered' | 'failed'
  providerId: text("provider_id"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("notification_booking_idx").on(t.bookingId)]);

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
