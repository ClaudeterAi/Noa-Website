CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'refunded', 'expired');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'whatsapp', 'sms');--> statement-breakpoint
CREATE TYPE "public"."guest_tier" AS ENUM('guest', 'preferred', 'vip');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('requires_payment', 'succeeded', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."slot" AS ENUM('morning', 'afternoon');--> statement-breakpoint
CREATE TABLE "booking_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"guests" smallint NOT NULL,
	"arrival_time" text NOT NULL,
	"price" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" text NOT NULL,
	"guest_id" uuid NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"currency" text DEFAULT 'AED' NOT NULL,
	"subtotal" integer NOT NULL,
	"vat" integer NOT NULL,
	"total" integer NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"stripe_payment_intent_id" text,
	"cart_token" text,
	"source" text DEFAULT 'web' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"name" text,
	"cognito_sub" text,
	"tier" "guest_tier" DEFAULT 'guest' NOT NULL,
	"tier_manual" boolean DEFAULT false NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"consent_at" timestamp with time zone,
	"last_booking_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"cart_token" text NOT NULL,
	"guest_id" uuid,
	"booking_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"extended_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"release_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_units" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_type_id" text NOT NULL,
	"label" text NOT NULL,
	"deck" text NOT NULL,
	"sort" smallint DEFAULT 0 NOT NULL,
	"vip_priority" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid,
	"channel" "notification_channel" NOT NULL,
	"template" text NOT NULL,
	"to" text NOT NULL,
	"status" text NOT NULL,
	"provider_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"provider_id" text NOT NULL,
	"kind" text NOT NULL,
	"amount" integer NOT NULL,
	"status" "payment_status" NOT NULL,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_price_overrides" (
	"session_id" uuid NOT NULL,
	"unit_type_id" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	CONSTRAINT "session_price_overrides_session_id_unit_type_id_pk" PRIMARY KEY("session_id","unit_type_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"slot" "slot" NOT NULL,
	"status" "session_status" DEFAULT 'open' NOT NULL,
	"vip_release_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_types" (
	"id" text PRIMARY KEY NOT NULL,
	"cls" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ar" text NOT NULL,
	"desc_en" text NOT NULL,
	"desc_ar" text NOT NULL,
	"pax" smallint NOT NULL,
	"price_morning" integer NOT NULL,
	"price_afternoon" integer NOT NULL,
	"per_person" boolean DEFAULT false NOT NULL,
	"tier" smallint DEFAULT 0 NOT NULL,
	"image_slot" text,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	CONSTRAINT "webhook_events_provider_event_id_pk" PRIMARY KEY("provider","event_id")
);
--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_unit_id_inventory_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."inventory_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_unit_id_inventory_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."inventory_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_units" ADD CONSTRAINT "inventory_units_unit_type_id_unit_types_id_fk" FOREIGN KEY ("unit_type_id") REFERENCES "public"."unit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_price_overrides" ADD CONSTRAINT "session_price_overrides_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_price_overrides" ADD CONSTRAINT "session_price_overrides_unit_type_id_unit_types_id_fk" FOREIGN KEY ("unit_type_id") REFERENCES "public"."unit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_items_live_unit_uq" ON "booking_items" USING btree ("session_id","unit_id") WHERE "booking_items"."active";--> statement-breakpoint
CREATE INDEX "booking_items_booking_idx" ON "booking_items" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_ref_uq" ON "bookings" USING btree ("ref");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_pi_uq" ON "bookings" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "bookings_guest_idx" ON "bookings" USING btree ("guest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_email_uq" ON "guests" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_cognito_sub_uq" ON "guests" USING btree ("cognito_sub");--> statement-breakpoint
CREATE UNIQUE INDEX "holds_live_unit_uq" ON "holds" USING btree ("session_id","unit_id") WHERE "holds"."released_at" IS NULL;--> statement-breakpoint
CREATE INDEX "holds_expires_idx" ON "holds" USING btree ("expires_at") WHERE "holds"."released_at" IS NULL;--> statement-breakpoint
CREATE INDEX "holds_cart_idx" ON "holds" USING btree ("cart_token");--> statement-breakpoint
CREATE INDEX "notification_booking_idx" ON "notification_log" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_id_uq" ON "payments" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_date_slot_uq" ON "sessions" USING btree ("date","slot");