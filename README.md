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
