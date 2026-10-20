/**
 * Venue facts: one source, everywhere. Change the address or a time once in admin and the website copy, the ticket,
 * the emails and the concierge knowledge all change with it. Plus a guard that no venue fact is hard-coded again.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { seed } from "@/db/seed";
import { syncUnits } from "@/db/sync-units";
import { attachPaymentIntent, confirmBookingByPaymentIntent, createHold, createPendingBooking } from "@/server/booking";
import { saveVenue } from "@/server/admin/actions";
import { loadTicketView } from "@/server/ticket-view";
import { buildKnowledge } from "@/server/concierge/knowledge";
import { renderEmail } from "@/server/notifications/templates";
import { pick, getPage, registry } from "@/content/registry";
import { VENUE_DEFAULTS, clock, mergeVenue, resolveVenueTokens, validateVenue, venueSnapshot } from "@/lib/venue";
import { saveEvent } from "@/server/events/repo";
import { availabilitySummary } from "@/server/concierge/tools";

const actor = { email: "owner@noa-dubai.com", role: "owner" as const };
// a fresh date on every run so earlier runs against the same database never collide
const day = (offset: number) => { const d = new Date(Date.UTC(2029, 0, 1) + ((Date.now() / 1000) % 20000 | 0) * 86400000 + offset * 86400000); return d.toISOString().slice(0, 10); };
const D = day(0), E = day(3);

beforeAll(async () => {
  process.env.GUEST_SESSION_SECRET ??= "test-secret";
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed({ onlyIfEmpty: true }); await syncUnits();
  await db.execute(sql`DELETE FROM settings WHERE key = 'venue'`);
});
afterAll(async () => { await db.execute(sql`DELETE FROM settings WHERE key = 'venue'`); await pool.end(); });

describe("formatting and tokens", () => {
  it("formats times and leaves unknown tokens visible", () => {
    expect(clock("14:00", "en")).toBe("2 PM");
    expect(clock("21:30", "en")).toBe("9:30 PM");
    expect(clock("02:30", "en")).toBe("2:30 AM");
    expect(clock("9:30 PM", "en")).toBe("9:30 PM");   // free text from an event form is shown as typed
    expect(resolveVenueTokens("Boats from {{firstBoat}}, back by {{night.lastBoat}}", VENUE_DEFAULTS, "en")).toBe("Boats from 1:30 PM, back by 2:30 AM");
    expect(resolveVenueTokens("{{nosuch}}", VENUE_DEFAULTS, "en")).toBe("{{nosuch}}");
  });
  it("rejects bad input and never saves it", async () => {
    const bad = mergeVenue({ ...VENUE_DEFAULTS, sessions: { ...VENUE_DEFAULTS.sessions, night: { ...VENUE_DEFAULTS.sessions.night, end: "2am" } }, pier: { en: "Somewhere", ar: "" } });
    expect(validateVenue({ ...bad, pier: { en: "Somewhere", ar: "" } }).length).toBeGreaterThan(0);
    const r = await saveVenue(actor, { ...VENUE_DEFAULTS, sessions: { ...VENUE_DEFAULTS.sessions, night: { ...VENUE_DEFAULTS.sessions.night, end: "2am" } } });
    expect(r.ok).toBe(false);
    const [{ n }] = (await db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM settings WHERE key = 'venue'`)).rows;
    expect(n).toBe(0);
  });
});

describe("one change reaches every surface", () => {
  it("new pier, night hours and phone appear on the website, the ticket, the email and the concierge", async () => {
    const next = { ...VENUE_DEFAULTS, pier: { en: "Bluewaters Pier, Berth 2", ar: "رصيف بلووترز، المرسى 2" }, berth: "Berth 2", berthAr: "المرسى 2", phone: "+971 4 555 1234",
      sessions: { ...VENUE_DEFAULTS.sessions, night: { ...VENUE_DEFAULTS.sessions.night, start: "22:00", end: "03:00", lastBoat: "03:30" } } };
    const r = await saveVenue(actor, next);
    expect(r.ok).toBe(true);
    expect(venueSnapshot().pier.en).toBe("Bluewaters Pier, Berth 2");

    // website copy (location page facts, night package time) through the registry
    const location = JSON.stringify(getPage("location").sections.map((s) => JSON.parse(JSON.stringify(s, (_k, v) => (v && typeof v === "object" && "en" in v && "ar" in v ? pick(v, "en") : v)))));
    expect(location).toContain("Bluewaters Pier, Berth 2");
    expect(location).not.toContain("Dubai Marina Pier, Berth 7");
    expect(location).toContain("3:30 AM");
    expect(registry.settings.contact.phoneDisplay).toBe("+971 4 555 1234");   // footer and contact strip

    // a real booking: ticket and email
    const cart = "venue-" + Date.now();
    const h = await createHold({ date: D, slot: "night", unitId: "daybed-6", cartToken: cart });
    const p = await createPendingBooking(cart, [{ holdId: h.holdId, guests: 2, arrivalTime: "22:00" }], { name: "Test Guest", email: "venue@example.com", phone: "+971500000001", locale: "en" });
    const pi = "pi_venue_" + Date.now(); await attachPaymentIntent(p.bookingId, pi); await confirmBookingByPaymentIntent(pi);
    const t = await loadTicketView(p.ref, "https://example.com", "en");
    expect(t!.venue.name).toBe("Bluewaters Pier, Berth 2");
    expect(t!.timeLabel).toBe("10 PM to 3 AM");
    expect(t!.lastBoat).toBe("Last boat back 3:30 AM");
    const e = renderEmail("booking_confirmed", { ref: p.ref, guestName: "Test Guest", email: "", phone: null, locale: "en", total: p.total, items: [], manageUrl: "", ticket: t } as never);
    expect(e.html).toContain("Bluewaters Pier, Berth 2");
    expect(e.html).toContain("+971 4 555 1234");
    expect(e.html).not.toContain("Berth 7");

    // concierge knowledge (chat and the voice agent's document)
    const kb = await buildKnowledge("en");
    expect(kb).toContain("Bluewaters Pier, Berth 2");
    expect(kb).toContain("10 PM to 3 AM");
    expect(kb).not.toContain("Dubai Marina Pier, Berth 7");

    // the concierge's live availability answer carries the new night hours
    const av = await availabilitySummary(D, "night", { locale: "en" } as never) as { session: string; seat_types: unknown[] };
    expect(av.session).toBe("Night (10 PM to 3 AM)");
    expect(av.seat_types.length).toBeGreaterThan(0);
  });

  it("an event's own times, age and notes win on its ticket", async () => {
    await saveEvent(actor, null, { titleEn: `Full Moon ${E}`, date: E, session: "night", startsAt: "23:00", endsAt: "04:00", doorsAt: "22:30", ageRuleOverride: "Over 25", ops: { checkinNotes: "Wristbands in silver tonight." }, status: "published" } as never);
    const cart = "venue-ev-" + Date.now();
    const h = await createHold({ date: E, slot: "night", unitId: "entry-6", cartToken: cart });
    const p = await createPendingBooking(cart, [{ holdId: h.holdId, guests: 1, arrivalTime: "23:00" }], { name: "Ev Guest", email: "ev@example.com", phone: "+971500000002", locale: "en" });
    const pi = "pi_venue_ev_" + Date.now(); await attachPaymentIntent(p.bookingId, pi); await confirmBookingByPaymentIntent(pi);
    const t = await loadTicketView(p.ref, "https://example.com", "en");
    expect(t!.title).toBe(`Full Moon ${E}`);
    expect(t!.timeLabel).toBe("11 PM to 4 AM · Doors 10:30 PM");
    expect(t!.rules.join(" ")).toContain("Over 25");
    expect(t!.rules.join(" ")).toContain("Wristbands in silver tonight.");
  });
});

describe("guard: no venue fact is hard-coded again", () => {
  it("only src/lib/venue.ts (and the hidden morning page) states the pier, phone or email", () => {
    const hits: string[] = [];
    const walk = (dir: string) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(ts|tsx)$/.test(f)) {
      const src = readFileSync(p, "utf-8");
      for (const needle of ["Berth 7", "المرسى 7", "840 0000", "hello@noa-dubai.com"]) if (src.includes(needle) && !p.endsWith(join("lib", "venue.ts"))) {
        const lines = src.split("\n").filter((l) => l.includes(needle) && !l.includes("morning")); if (lines.length && !(p.endsWith("pages.ts") && lines.every((l) => /first boat leaves|ينطلق أول قارب من/.test(l)))) hits.push(`${p}: ${needle}`);
      } } } };
    walk("src");
    expect(hits).toEqual([]);
  });
});
