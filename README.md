# NOA Dubai — website, booking engine & AI concierge

Next.js 15 (App Router, TypeScript) · `next-intl` (EN / AR, RTL) · deployed on Vercel (`dxb1`).

## Run

```bash
npm install
npm run dev        # http://localhost:3000 → redirects to /en
npm run build && npm start
```

## Structure

```
src/
  app/[locale]/            layout (fonts, dir, nav, footer) · page (home) · [slug] (registry pages) · booking
  content/                 THE content registry — every page, section, package, event, FAQ, setting, media slot
    types.ts               bilingual model, shaped like the Day 2 Postgres tables
    entities.ts            settings, media slots, packages, events, FAQs
    pages.ts               pages → sections, navigation
    registry.ts            the only data-access layer components use (swap to Postgres here)
  components/
    sections/              one renderer per section type (16 types)
    booking/               calendar, 52-seat YachtMap (SVG), inventory, cart, checkout
    layout/                Nav (client), Footer, Effects (cursor, reveal-on-scroll)
  i18n/                    routing (en, ar), request config, navigation helpers
  messages/{en,ar}.json    UI strings for the booking flow
  styles/globals.css       the original design system, verbatim, fonts via CSS variables + an Arabic/RTL layer
legacy-static/             the previous static site, preserved for reference (not served)
```

## Content rules

- Every text field is `{ en, ar, arStatus }`. `arStatus: "draft"` until a native reviewer marks it `reviewed`.
- Media slots: `url: null` renders the placeholder state (the hero video slot starts empty). Day 4 fills slots from NOA's assets.
- Events, prices and contact details are **placeholders carried over from the previous mock** until NOA confirms them.
- Arabic typeface switching is automatic: `html[lang="ar"]` swaps the `--font-sans` / `--font-serif` variables; no rule in the design system changes.

## Roadmap (5-day build)

| Day | Scope |
| --- | --- |
| 1 | This PR — Next.js foundation, registry, EN/AR, booking UI (client-only) |
| 2 | Postgres (AWS me-central-1), holds with 5-minute timer, Stripe test mode, guest accounts |
| 3 | Live seat map (API Gateway WebSockets), WhatsApp + email, admin, VIP tiering |
| 4 | Claude chatbot, ElevenLabs voice with site navigation, NOA content, Arabic review |
| 5 | QA matrix, hardening, go-live, handover |

## Booking engine (Day 2)

```
Guest taps a seat → POST /api/holds (5-minute hold, server clock) → seat modal → cart
Cart → POST /api/bookings (prices from DB, VAT 5%, holds extended once by 3 min) → Stripe PaymentIntent (AED)
Stripe Payment Element (cards, Apple Pay, Google Pay, 3-D Secure) → redirect to /booking/confirmation
Stripe webhook payment_intent.succeeded → booking confirmed · late payment (holds expired) → automatic refund
Cron every minute → /api/cron/expire-holds releases expired holds, expires stale pending bookings
```

Exclusivity is enforced in Postgres (`holds_live_unit_uq`, `booking_items_live_unit_uq`), not in the UI.

- Schema: `src/db/schema.ts` · migration SQL: `drizzle/` · engine: `src/server/booking.ts`
- **Run everything locally** (real Postgres, no AWS): `./scripts/dev-local.sh` → http://localhost:3000. Same code goes live by
  pointing `DATABASE_URL` at RDS and running `npm run db:migrate` + `npx tsx src/db/seed.ts`.
- Cinema-hall rules (all admin settings): tapping a seat holds it for `hold_minutes` (default 7); one extension of
  `hold_extension_minutes` (3) at the payment step; at most `max_holds_per_cart` (6) live seats per guest; expired holds
  free themselves; a payment that lands after expiry is refunded automatically. Others see a held seat within 4 s
  (polling) today; the WebSocket push layer lands with AWS.
- Integration tests on real Postgres: `python3 scripts/with-local-pg.py npx vitest run`
- Install with npm 12 (`npx npm@12 install`); npm 10 hits a tree bug with this dependency set.

Environment: see `.env.example`. Without Stripe keys the checkout stops with "Payments are not configured" — nothing is faked.

## Notifications (Day 3)

```
booking confirmed (webhook) ──→ notification_log rows: queued (email + WhatsApp)   ← exactly once per booking × template × channel
late payment refunded      ──→ queued "booking_late_refunded"
cron hourly                ──→ queue "booking_reminder_24h" for tomorrow's confirmed bookings (Asia/Dubai)
cron every minute          ──→ worker sends due rows: Resend (email + .ics) · Twilio WhatsApp (Meta-approved Content Template SIDs)
                               failure → retry at 1, 5, 30, 120, 720 min, then failed · provider missing → skipped (never lost)
```

- Code: `src/server/notifications/` (templates EN/AR, ICS, providers, outbox). Tests: `tests/notifications.test.ts` (fake providers).
- WhatsApp template SIDs come from `WHATSAPP_CONTENT_SIDS` (JSON, per `template:locale`) once Meta approves NOA's templates.

## VIP tiering & priority inventory (Day 3)

- Tiers `guest → preferred → vip` recomputed nightly (`/api/cron/tiers`) from confirmed bookings using `settings.tier_rules`
  (defaults: preferred = 2 visits in 12 months or a balcony-class seat; vip = AED 25,000 lifetime or any front cabana).
  A tier NOA sets by hand (`tier_manual`) is never overridden by the job.
- Units flagged `vip_priority` show as **reserved** to ordinary guests until `sessions.vip_release_at`
  (session start − `settings.vip_release_hours`, default 24 h, Dubai time); preferred/vip guests book them any time.
  The rule is enforced in `createHold`, not just in the UI.
- Guest identity comes from the signed `noa_guest` cookie (`src/server/guest-session.ts`), issued by passwordless sign-in (Day 4).
  Without a session the site is guest-checkout only. Code: `src/server/vip.ts`. Tests: `tests/vip.test.ts`.

## Admin (Day 3)

`/admin` — staff only. Sign-in via Amazon Cognito admin user pool (next-auth, OIDC); roles from Cognito groups:
`frontdesk` (read, retry messages) < `editor` (refunds, cancel, tiers, prices, VIP flags, close sessions) < `owner` (+ settings).
Pages: dashboard (today + 14 days, live holds), bookings (filters, detail, refund via Stripe, cancel), guests (tier, CSV export),
inventory & pricing, messages (retry), settings, audit trail. Every mutation writes `audit_log` (who, before, after).
Code: `src/server/admin/`, `src/app/admin/`. Tests: `tests/admin.test.ts`. Migration `0002` adds `audit_log` only.

## Changing the boat layout (expected — the map is not final)

The layout is data. A new boat = a new SVG + one command:

1. Replace the drawing in `src/components/booking/YachtMap.tsx` (any tappable shape carries `data-seat="<id>"`; id prefix = type,
   e.g. `sunbed-7`, `jacuzzi-2`, `cabana-9`, `entry-20`). Deck labels stay bilingual via the `labels` prop.
2. `npx tsx src/db/sync-units.ts` — adds new seats, reactivates returning ones, **deactivates** (never deletes) seats that left the
   map so past bookings keep their history. Unknown prefixes are reported as `unmapped`; add the type in admin first.
3. Capacities, prices, tiers and members-priority are rows in `unit_types` / `inventory_units` (admin), never code.
   The client reads names, capacity and prices from the API — nothing in the UI is tied to 52 seats.

## Fonts

Self-hosted in `src/fonts/` (SIL OFL): Josefin Sans, Cormorant, IBM Plex Sans Arabic, Noto Naskh Arabic — 12 woff2 files, 552 KB.
Builds have no dependency on fonts.googleapis.com (a Vercel preview build failed on that fetch on 16 Oct); visitors load fonts from Vercel's edge.

## Concierge — chat (Claude) and voice (ElevenLabs) (Day 4)

```
Guest ─ chat panel ─→ POST /api/chat ─→ Claude (tools) ─┐
Guest ─ voice button ─→ ElevenLabs agent ─→ POST /api/agent/tools (secret) ─┤→ same tools (src/server/concierge/tools.ts)
                                                                        └→ same cart token → /booking shows the held seats → Stripe
Knowledge for both: GET /api/agent/knowledge (rendered from the registry + database, EN + AR)
Voice client tools: navigate · open_booking · switch_language (src/components/concierge/VoiceConcierge.tsx)
```

Setup for the voice agent: `agent/elevenlabs-agent.md`. Without `ANTHROPIC_API_KEY` / `ELEVENLABS_AGENT_ID` the buttons say the concierge isn't configured — nothing is faked.
Tests: `tests/concierge.test.ts` (tools on Postgres, chat loop against a fake model).

## Events → website, chat and voice, automatically (Day 4)

```
Admin creates/edits an event  ──"Auto-fill with AI"──→ Claude fills what's missing (bios via web search, pitch, Arabic, tags, SEO,
                                                        talking points); every AI field is marked with a confidence for review
Save & publish
  → events table + kb_sync_jobs row (same transaction, coalesced per event)
  → public pages revalidate (home card, events page, EN + AR)            ← instant; ISR 60 s is the safety net
  → chat concierge reads events live                                     ← instant
  → worker (right away + /api/cron/kb-sync every minute) renders ONE document per event and pushes it to the
    ElevenLabs agent (create → attach → delete previous); unchanged content is a no-op; cancel removes the document
Kind: regular · main (featured upcoming) · highlight (best past — kept in the knowledge base as social proof)
```

Code: `src/server/events/` (enrich, kb-sync, repo, public), admin at `/admin/events`. Tests: `tests/events.test.ts`.
Session enum gained `night` and `full` for event sessions; booking-page support for those slots is a follow-up.

## Live seat map (WebSockets)

```
browser on step 2 ──wss──▶ API Gateway (noa-seatmap-ws) ──▶ Lambda $connect: store {connectionId, date#slot} in DynamoDB (TTL 3 h)
engine: hold / release / confirm / cancel / sweep ──▶ src/server/realtime.ts: query connections for that session → PostToConnection
browser: applies {unitId, state} instantly; polls every 30 s as a safety net (4 s when no socket); resyncs on reconnect
```
Correctness never depends on the socket — the database is the truth. Infra lives in AWS (eu-central-1 until the UAE move):
DynamoDB `noa-ws-connections`, Lambda `noa-ws-connect`, API `noa-seatmap-ws` stage `prod`. Env: `NEXT_PUBLIC_WS_URL`, `WS_MANAGEMENT_ENDPOINT`, `WS_TABLE`.

## Media manager

`/admin/media` (editor+): every image and film on the site is a *slot* from the registry. Upload → presigned PUT straight to NOA's
private S3 bucket (`S3_MEDIA_BUCKET`, region `S3_REGION`) → register (size/type verified with HEAD) → assign to a slot.
The public site serves uploads through `/api/media/<key>` (immutable, edge-cached, Range for video) so the bucket stays private.
Reset returns a slot to its placeholder. Tables: `media_assets`, `media_slots` (migration 0004). Tests: `tests/media.test.ts`
(real S3 round-trip when AWS env is present).
