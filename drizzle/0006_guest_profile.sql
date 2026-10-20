-- Guest profile, part 1 (approved by Lakshay 20 Oct 2026).
-- 1) Consent history: one row per grant or withdrawal, per channel, with where it happened. guests.marketing_opt_in
--    stays and mirrors the latest email choice, so everything that already reads it keeps working.
CREATE TABLE IF NOT EXISTS "guest_consents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "guest_id" uuid NOT NULL REFERENCES "guests"("id"),
  "channel" "notification_channel" NOT NULL,
  "granted" boolean NOT NULL,
  "source" text NOT NULL,
  "at" timestamp with time zone DEFAULT now() NOT NULL,
  "ip" text,
  "user_agent" text
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guest_consents_guest_idx" ON "guest_consents" ("guest_id", "channel", "at");--> statement-breakpoint
-- 2) Optional profile preferences: the seat type the guest usually books and a birthday month (no full date stored).
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "preferred_unit_type" text REFERENCES "unit_types"("id");--> statement-breakpoint
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "birthday_month" smallint;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "guests" ADD CONSTRAINT "guests_birthday_month_ck" CHECK ("birthday_month" BETWEEN 1 AND 12);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
