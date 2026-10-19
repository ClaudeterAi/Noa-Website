CREATE TABLE "callback_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"topic" text NOT NULL,
	"notes" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"source" text NOT NULL,
	"booking_ref" text,
	"status" text DEFAULT 'open' NOT NULL,
	"handled_by" text,
	"handled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "callback_status_idx" ON "callback_requests" USING btree ("status","created_at");