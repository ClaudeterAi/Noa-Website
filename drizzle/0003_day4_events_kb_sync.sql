CREATE TYPE "public"."event_kind" AS ENUM('regular', 'main', 'highlight');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'past', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."slot" ADD VALUE 'night';--> statement-breakpoint
ALTER TYPE "public"."slot" ADD VALUE 'full';--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"kind" "event_kind" DEFAULT 'regular' NOT NULL,
	"sort_weight" smallint DEFAULT 0 NOT NULL,
	"featured_until" date,
	"date" date NOT NULL,
	"session" "slot" DEFAULT 'afternoon' NOT NULL,
	"doors_at" text,
	"starts_at" text,
	"ends_at" text,
	"area" text,
	"session_id" uuid,
	"title_en" text NOT NULL,
	"title_ar" text,
	"pitch_en" text,
	"pitch_ar" text,
	"description_en" text,
	"description_ar" text,
	"vibe_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dress_code_override" text,
	"age_rule_override" text,
	"lineup" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ticketing" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"media" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"agent_guidance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recap" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ops" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seo" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"announce_on_publish" boolean DEFAULT false NOT NULL,
	"ai_filled" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ar_status" text DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "kb_documents" (
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"provider" text DEFAULT 'elevenlabs' NOT NULL,
	"document_id" text NOT NULL,
	"content_hash" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_documents_entity_entity_id_provider_pk" PRIMARY KEY("entity","entity_id","provider")
);
--> statement-breakpoint
CREATE TABLE "kb_sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"done_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_uq" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_date_idx" ON "events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "events_status_kind_idx" ON "events" USING btree ("status","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "kb_sync_pending_uq" ON "kb_sync_jobs" USING btree ("entity","entity_id") WHERE "kb_sync_jobs"."status" IN ('queued','sending');--> statement-breakpoint
CREATE INDEX "kb_sync_due_idx" ON "kb_sync_jobs" USING btree ("next_attempt_at") WHERE "kb_sync_jobs"."status" = 'queued';