# NOA Dubai — review guide for Gemini Code Assist

This is a production booking platform for a Dubai beach club (Next.js 15 App Router, TypeScript strict, Drizzle + Postgres on AWS,
Stripe, ElevenLabs, Claude via Bedrock). Review every PR as if real money and real guests depend on it.

## Always flag
- **Double booking risk**: any change to holds, booking_items, availability or the sweeper that could let two carts own one seat.
  The partial unique indexes in `src/db/schema.ts` are the guarantee; code must not rely on timing or the UI.
- **Money**: prices must come from the database (unit_types / event ticketing), never from the client. VAT from settings.
  Refunds only in admin. Reservations are final once paid — no cancellation paths for guests.
- **Auth & secrets**: admin routes guarded by `requireAdmin`; cron routes check `CRON_SECRET`; webhooks verify signatures;
  no secrets in client components or `NEXT_PUBLIC_*`; no new public write endpoints.
- **Migrations**: additive only (new tables/columns/indexes). Dropping or altering existing columns needs explicit approval
  called out in the PR description.
- **Side effects after the response** on Vercel must use `after()` from `next/server` (functions freeze after the response).
- **Untested UI claims**: a PR that says a flow works should name where it was run (tests, local browser, production).
- **Bilingual**: any new user-facing string needs both English and Arabic; Arabic is a draft (`arStatus: "draft"`) until reviewed.
- **Accessibility and mobile**: 44px targets, keyboard-reachable modals, no horizontal overflow at 390px.

## Style
- Small, single-subject PRs. Prefer editing existing modules over parallel implementations.
- Keep `README.md` sections in sync when behaviour changes.
- Comments explain *why*, not *what*.

## Do not flag
- Placeholder content marked as such (events, copy, images) — NOA supplies the real material later.
- The Frankfurt region in infrastructure code: temporary until AWS clears the UAE region; tagged `move-to: me-central-1`.
