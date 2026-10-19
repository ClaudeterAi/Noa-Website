/** Concierge: knowledge export, agent tools on real Postgres, and the Claude tool loop against a fake model. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { seed } from "@/db/seed";
import { buildKnowledge } from "@/server/concierge/knowledge";
import { availabilitySummary, cart, findPage, holdSeat, runTool, type AgentContext } from "@/server/concierge/tools";
import { chatTurn, systemPrompt, type ChatEvent } from "@/server/concierge/chat";
import { getAvailability } from "@/server/booking";

const D = "2027-07-01";
const ctx: AgentContext = { cartToken: "11111111-1111-4111-8111-111111111111", locale: "en", tier: "guest" };

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed();
  await db.execute(sql`TRUNCATE holds, booking_items, payments, notification_log, bookings, guests, sessions CASCADE`);
});
afterAll(async () => { await pool.end(); });

describe("knowledge", () => {
  it("renders prices from the database, booking rules from settings, and every page path, in EN and AR", async () => {
    const en = await buildKnowledge("en"); const ar = await buildKnowledge("ar");
    expect(en).toContain("Pool Cabana: morning AED 6500, afternoon AED 8500");
    expect(en).toContain("held for 7 minutes");
    expect(en).toContain("→ /en/location");
    expect(en).toContain("Q: Can I cancel or change my reservation?");
    expect(ar).toContain("كابانا المسبح: الصباح AED 6500");
    expect(ar).toContain("→ /ar/location");
    expect(en.length).toBeGreaterThan(8000);
  });
  it("the voice prompt forbids lists and limits to two sentences; the chat prompt does not", () => {
    const v = systemPrompt("en", "KB", "voice", D); const c = systemPrompt("en", "KB", "chat", D);
    expect(v).toMatch(/two sentences maximum/); expect(c).not.toMatch(/two sentences/);
    expect(systemPrompt("ar", "KB", "chat", D)).toContain("كونسيرج نوا");
  });
});

describe("tools", () => {
  it("availability summary groups by seat type with live counts", async () => {
    const s = await availabilitySummary(D, "afternoon", ctx) as { seat_types: { type: string; free: number; price_aed: number; reserved_for_members: number }[] };
    const cab = s.seat_types.find((t) => t.type === "cabana")!; expect(cab.free).toBe(8); expect(cab.price_aed).toBe(8500);
    expect(s.seat_types.find((t) => t.type === "vip-booth")!.reserved_for_members).toBe(1); // far-future date → members priority
  });
  it("hold_seat picks free seats of the type, respects quantity, lands in the shared cart", async () => {
    const r = await holdSeat(D, "afternoon", "daybed", 2, ctx) as { held: { unit_id: string }[] };
    expect(r.held).toHaveLength(2);
    const c = await cart(ctx); expect(c.items).toHaveLength(2); expect(c.subtotal_aed).toBe(4400); expect(c.vat_aed).toBe(220);
    const av = await getAvailability(D, "afternoon", ctx.cartToken); expect(av.filter((u) => u.state === "yours")).toHaveLength(2);
  });
  it("reserved seats explain the members rule instead of holding", async () => {
    const r = await holdSeat(D, "afternoon", "vip-booth", 1, ctx) as { held: unknown[]; error: string };
    expect(r.held).toHaveLength(0); expect(r.error).toMatch(/reserved for returning members/);
    const vip = await holdSeat(D, "afternoon", "vip-booth", 1, { ...ctx, cartToken: "22222222-2222-4222-8222-222222222222", tier: "vip" }) as { held: unknown[] };
    expect(vip.held).toHaveLength(1);
  });
  it("find_page resolves navigation phrases to paths", () => {
    expect(findPage("how do I get there, where is the pier", "en").path).toBe("/en/location");
    expect(findPage("cabana", "en").path).toBe("/en/cabana");
    expect(findPage("كيف أصل", "ar").path).toBe("/ar/location");
    expect(findPage("gibberish zzz", "en").path).toBe("/en");
  });
  it("runTool rejects nothing silently: unknown input shapes return an error object", async () => {
    expect(await runTool("get_availability", { date: "bad", slot: "x" }, ctx)).toMatchObject({ error: expect.stringContaining("YYYY-MM-DD") });
  });
});

describe("chat loop (fake model)", () => {
  it("calls get_availability then hold_seat, feeds results back, and ends with text", async () => {
    let call = 0;
    const fake = { messages: { create: async (req: { messages: unknown[] }) => {
      call++;
      if (call === 1) return { content: [{ type: "tool_use", id: "t1", name: "get_availability", input: { date: D, slot: "afternoon" } }], stop_reason: "tool_use" };
      if (call === 2) {
        const last = (req.messages.at(-1) as { content: { content: string }[] }).content[0].content;
        expect(JSON.parse(last).seat_types.length).toBeGreaterThan(5);
        return { content: [{ type: "tool_use", id: "t2", name: "hold_seat", input: { date: D, slot: "afternoon", unit_type: "sunbed", quantity: 1 } }], stop_reason: "tool_use" };
      }
      return { content: [{ type: "text", text: "A sunbed is held for you for seven minutes. Shall I send the payment link?" }], stop_reason: "end_turn" };
    } } };
    const events: ChatEvent[] = [];
    for await (const ev of chatTurn([{ role: "user", content: "Hold me a sunbed on 1 July afternoon" }], { ...ctx, cartToken: "33333333-3333-4333-8333-333333333333" }, fake as never, D)) events.push(ev);
    const tools = events.filter((e) => e.type === "tool") as { name: string; result: { held?: unknown[] } }[];
    expect(tools.map((t) => t.name)).toEqual(["get_availability", "hold_seat"]);
    expect(tools[1].result.held).toHaveLength(1);
    expect(events.at(-2)).toMatchObject({ type: "text" }); expect(events.at(-1)).toMatchObject({ type: "done", stop: "end_turn" });
  });
  it("stops after the round limit even if the model keeps asking for tools", async () => {
    const fake = { messages: { create: async () => ({ content: [{ type: "tool_use", id: "x", name: "get_cart", input: {} }], stop_reason: "tool_use" }) } };
    const events: ChatEvent[] = [];
    for await (const ev of chatTurn([{ role: "user", content: "loop" }], ctx, fake as never, D)) events.push(ev);
    expect(events.filter((e) => e.type === "tool")).toHaveLength(5);
    expect(events.at(-1)).toMatchObject({ type: "done", stop: "max_rounds" });
  });
});
