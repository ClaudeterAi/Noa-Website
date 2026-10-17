ALTER TABLE "notification_log" ADD COLUMN "locale" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "attempts" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "payload" jsonb;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "sent_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "notification_queue_idx" ON "notification_log" USING btree ("next_attempt_at") WHERE "notification_log"."status" = 'queued';--> statement-breakpoint
CREATE UNIQUE INDEX "notification_once_uq" ON "notification_log" USING btree ("booking_id","template","channel") WHERE "notification_log"."booking_id" IS NOT NULL;