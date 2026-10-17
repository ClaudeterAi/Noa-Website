# NOA Voice Concierge — ElevenLabs Agents configuration

**This is configured from code.** `scripts/elevenlabs-setup.ts` creates/updates the tools, uploads the knowledge document and
patches the agent through the ElevenLabs API — idempotent, re-run after every content publish or when the site URL changes:

```bash
ELEVENLABS_API_KEY=… ELEVENLABS_AGENT_ID=agent_… ELEVENLABS_TOOL_SECRET=… SITE_URL=https://noa-dubai.com \
  python3 scripts/with-local-pg.py npx tsx scripts/elevenlabs-setup.ts        # (or with DATABASE_URL set)
```

Applied on 17 Oct 2026 to the workspace agent `NOA Concierge` (previously the blank "Noa" agent): 3 client tools, 6 webhook tools,
one KB document (EN + AR), prompt, EN first message + Arabic preset, LLM `claude-haiku-4-5`, 7 s turn timeout, 60 s silence hang-up,
10-minute max call. Webhook URL is `https://noa-website-two.vercel.app/api/agent/tools` until NOA's domain exists.
The sections below describe what the script sets, for review.

## 1. Agent
- Name: `NOA Concierge` · Languages: English (default) + Arabic · Voices: one EN, one AR (NOA to pick)
- LLM: Claude Haiku 4.5 (as costed in the estimate; Gemini 2.5 Flash is the cheaper fallback)
- Turn-taking: default · Max call length: 10 min · Silence: end after 60 s
- **First message** (EN): "Welcome to NOA. I can tell you about the day, check seats, or hold a place for you — what would you like?"
  (AR): "أهلاً بك في نوا. يمكنني أن أخبرك عن اليوم، أو أتحقق من المقاعد، أو أحجز لك مكاناً — ماذا تريد؟"

## 2. System prompt
Use the output of `systemPrompt(locale, knowledge, "voice", today)` in `src/server/concierge/chat.ts`; the dynamic variables below are available as `{{cart_token}}`, `{{locale}}`, `{{current_page}}`, `{{today}}`, `{{guest_name}}`, `{{guest_tier}}`, `{{cart_items}}`, `{{cart_total_aed}}`, `{{guest_session}}`.
Add these lines to the prompt:
- "You are on the NOA website with the guest; the guest is on {{current_page}}. When they ask where something is, call `navigate`. When seats are held and they want to pay, call `open_booking` — never take card details by voice."
- "If {{guest_name}} is set, greet them by name once; if {{guest_tier}} is vip or preferred, members-priority seats are available to them."
- "Always pass `cart_token` = {{cart_token}} and `locale` = {{locale}} to every server tool."

## 3. Knowledge base
Add a URL source: `https://<host>/api/agent/knowledge?locale=both`. Re-sync after every content publish (Day 4 admin publish pipeline triggers this; until then re-sync by hand). RAG on.

## 4. Client tools (run in the browser — implemented in `src/components/concierge/VoiceConcierge.tsx`)
| Name | Parameters | Description for the agent |
|---|---|---|
| `navigate` | `path` (string, optional), `page` (string: home, morning-package, afternoon-package, cabana, events, about, location, faq, contact, booking), `section` (string, optional) | Move the guest's screen to a page or a section of it. Prefer `path` from `find_page`. |
| `open_booking` | — | Open the booking page where the guest pays for held seats. |
| `switch_language` | `locale` ("en" \| "ar") | Switch the site language if the guest switches language. |

## 5. Server tools (webhooks → one endpoint)
URL: `POST https://<host>/api/agent/tools` · Header: `x-noa-agent-secret: <ELEVENLABS_TOOL_SECRET>` · Body (JSON):
`{ "tool": "<name>", "input": { … }, "cart_token": "{{cart_token}}", "locale": "{{locale}}", "guest_session": "{{guest_session}}" }`

| tool | input | returns |
|---|---|---|
| `get_availability` | `date` YYYY-MM-DD, `slot` morning\|afternoon | per seat type: free, reserved_for_members, price_aed, capacity |
| `hold_seat` | `date`, `slot`, `unit_type`, `quantity` (1–6) | held seats with expiry; errors explained (members priority, sold out, cart cap) |
| `release_hold` | `hold_id` | released true/false |
| `get_cart` | — | held seats, subtotal, VAT, total, expiry |
| `checkout_link` | — | path of the booking page (then call client tool `open_booking`) |
| `find_page` | `query` | path + page + section to pass to `navigate` |

Descriptions for each tool are in `toolDefinitions` in `src/server/concierge/tools.ts` — paste them verbatim.

## 6. Site env
`ELEVENLABS_AGENT_ID` (+ `ELEVENLABS_API_KEY` for a private agent via signed URLs, recommended) · `ELEVENLABS_TOOL_SECRET` (random 32+ chars) · `ANTHROPIC_API_KEY` for the chat concierge.

## 7. Test script (after setup)
1. Tap the microphone button → "Welcome to NOA…" within ~2 s.
2. "What's free on Friday afternoon?" → the agent quotes real counts and prices (matches the booking map).
3. "Hold me a daybed" → "held for seven minutes" → open the booking page: the daybed is in the cart with the countdown.
4. "Take me to the cabana prices" → the page changes and scrolls to the tariff section.
5. Switch to Arabic mid-conversation → the agent answers in Arabic and the site switches to /ar.
