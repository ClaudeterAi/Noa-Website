-- Day 7: pier check-in. A booking is checked in once, by a staff member, when the wristband is issued.
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "checked_in_at" timestamp with time zone;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "checked_in_by" text;
