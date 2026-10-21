-- Admin content editor: edited page wording, overlaid on the copy shipped in the code. No row = original wording.
CREATE TABLE IF NOT EXISTS "content_fields" (
  "path" text PRIMARY KEY NOT NULL,
  "value_en" text NOT NULL,
  "value_ar" text NOT NULL,
  "ar_reviewed" boolean DEFAULT false NOT NULL,
  "updated_by" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
