/** Events: save → sync queue (coalesced) → worker pushes one document per event to a fake ElevenLabs; AI auto-fill never overwrites admin input. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { kbDocuments, kbSyncJobs } from "@/db/schema";
import { seed } from "@/db/seed";
import { saveEvent, setEventStatus } from "@/server/events/repo";
import { processKbSync, renderEventDoc, type KbProvider } from "@/server/events/kb-sync";
import { enrichEvent } from "@/server/events/enrich";
import { buildKnowledge } from "@/server/concierge/knowledge";

const actor = { email: "ops@noa-dubai.com", role: "editor" };
const docs = new Map<string, { name: string; text: string }>();
let agentDocs: { type: string; id: string; name: string; usage_mode?: string }[] = [];
let n = 0;
const fakeKb: KbProvider = {
  async createText(name, text) { const id = `doc_${++n}`; docs.set(id, { name, text }); return { id }; },
  async deleteDoc(id) { docs.delete(id); },
  async setAgentDocs(update) { agentDocs = update(agentDocs); },
};

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed();
  await db.execute(sql`TRUNCATE events, kb_sync_jobs, kb_documents, audit_log CASCADE`);
});
afterAll(async () => { await pool.end(); });

describe("publish → knowledge base", () => {
  it("a draft queues nothing; publishing queues one job; the worker creates one document and attaches it to the agent", async () => {
    const e = await saveEvent(actor, null, { titleEn: "Golden Hour Opening", date: "2027-03-14", session: "afternoon", lineup: [{ name: "Claptone", role: "headliner", origin: "Berlin" }], pitchEn: "Our opening night on the water." });
    expect((await db.select().from(kbSyncJobs)).length).toBe(0);
    await setEventStatus(actor, e.id, "published");
    const jobs = await db.select().from(kbSyncJobs).where(eq(kbSyncJobs.entityId, e.id));
    expect(jobs).toHaveLength(1); expect(jobs[0].action).toBe("upsert");
    const r = await processKbSync(fakeKb);
    expect(r.done).toBe(1);
    expect(agentDocs).toHaveLength(1); expect(agentDocs[0].name).toBe(`event:${e.slug}`);
    const text = docs.get(agentDocs[0].id)!.text;
    expect(text).toContain("Golden Hour Opening"); expect(text).toContain("Claptone (headliner) · Berlin"); expect(text).toContain("Pitch: Our opening night");
  });
  it("editing re-queues (coalesced), re-sync replaces the document; unchanged content is a no-op", async () => {
    const [e] = await db.execute<{ id: string }>(sql`SELECT id FROM events LIMIT 1`).then((r) => r.rows);
    await saveEvent(actor, e.id, { titleEn: "Golden Hour Opening", date: "2027-03-14", pitchEn: "Changed pitch." });
    await saveEvent(actor, e.id, { titleEn: "Golden Hour Opening", date: "2027-03-14", pitchEn: "Changed pitch twice." });
    expect((await db.select().from(kbSyncJobs).where(sql`${kbSyncJobs.entityId} = ${e.id} AND ${kbSyncJobs.status} = 'queued'`)).length).toBe(1);
    const before = agentDocs[0].id;
    expect((await processKbSync(fakeKb)).done).toBe(1);
    expect(agentDocs).toHaveLength(1); expect(agentDocs[0].id).not.toBe(before); expect(docs.has(before)).toBe(false);
    expect(docs.get(agentDocs[0].id)!.text).toContain("Changed pitch twice");
    await saveEvent(actor, e.id, { titleEn: "Golden Hour Opening", date: "2027-03-14", pitchEn: "Changed pitch twice." });
    const same = agentDocs[0].id; await processKbSync(fakeKb); expect(agentDocs[0].id).toBe(same);
  });
  it("the chat concierge sees the event instantly, without any sync", async () => {
    expect(await buildKnowledge("en")).toContain("Golden Hour Opening");
  });
  it("cancelling removes the document from the agent; a highlight past event stays as social proof", async () => {
    const [e] = await db.execute<{ id: string }>(sql`SELECT id FROM events LIMIT 1`).then((r) => r.rows);
    await setEventStatus(actor, e.id, "cancelled"); await processKbSync(fakeKb);
    expect(agentDocs).toHaveLength(0); expect((await db.select().from(kbDocuments)).length).toBe(0);
    const h = await saveEvent(actor, null, { titleEn: "White Edition", date: "2026-03-28", status: "past", kind: "highlight", recap: { highlightsEn: "Sold out in 48 hours; 280 guests.", attendance: "sold out" } });
    await processKbSync(fakeKb);
    expect(agentDocs.map((d) => d.name)).toEqual([`event:${h.slug}`]);
    expect(docs.get(agentDocs[0].id)!.text).toContain("HIGHLIGHT (past, use as social proof)");
  });
  it("without ElevenLabs configured, jobs are marked skipped and the site still works", async () => {
    const e = await saveEvent(actor, null, { titleEn: "Unsynced", date: "2027-05-01", status: "published" });
    const r = await processKbSync(null); expect(r.skipped).toBe(1);
    expect((await db.select().from(kbSyncJobs).where(eq(kbSyncJobs.entityId, e.id)))[0].status).toBe("skipped");
  });
});

describe("AI auto-fill", () => {
  it("fills only missing fields, keeps admin input, marks AI fields with confidence, merges artist gaps by name", async () => {
    const fake = { messages: { create: async () => ({ content: [{ type: "tool_use", id: "t", name: "fill_event", input: {
      titleAr: "ليلة الافتتاح", pitchEn: "SHOULD NOT OVERWRITE", descriptionEn: "Two paragraphs.", vibeTags: ["sunset", "house"],
      lineup: [{ name: "claptone", origin: "Berlin", genre: "house", bio: "Masked German producer." }],
      agentGuidance: { talkingPoints: ["First NOA night"], doNotPromise: ["Set times"] }, seo: { title: "Golden Hour at NOA" },
      confidence: { titleAr: 0.9, descriptionEn: 0.7, lineup: 0.8, vibeTags: 0.6 }, sources: { titleAr: "translated", lineup: "web" }, notes: ["Confirm set time"],
    } }], stop_reason: "tool_use" }) } };
    const r = await enrichEvent({ titleEn: "Golden Hour", date: "2027-03-14", pitchEn: "Admin's own pitch.", lineup: [{ name: "Claptone", role: "headliner" }] }, fake as never, { webSearch: false });
    expect(r.draft.pitchEn).toBe("Admin's own pitch.");
    expect(r.draft.titleAr).toBe("ليلة الافتتاح"); expect(r.aiFilled.titleAr).toMatchObject({ confidence: 0.9, source: "translated" });
    expect(r.draft.lineup?.[0]).toMatchObject({ name: "Claptone", role: "headliner", origin: "Berlin", bio: "Masked German producer." });
    expect(r.draft.vibeTags).toEqual(["sunset", "house"]); expect(r.aiFilled.pitchEn).toBeUndefined(); expect(r.notes).toEqual(["Confirm set time"]);
  });
  it("renders a full document from a rich event", () => {
    const doc = renderEventDoc({ id: "x", slug: "s", status: "published", kind: "main", sortWeight: 0, featuredUntil: null, date: "2027-03-14", session: "night", doorsAt: "21:00", startsAt: "22:00", endsAt: "02:00", area: "Upper deck", sessionId: null,
      titleEn: "Desert Moon", titleAr: "قمر الصحراء", pitchEn: "Full moon on the water.", pitchAr: null, descriptionEn: null, descriptionAr: null, vibeTags: ["full moon"], dressCodeOverride: "All white", ageRuleOverride: null,
      lineup: [{ name: "Peggy Gou", role: "headliner", setTime: "23:30" }], ticketing: { seatTypes: ["cabana"], prices: { cabana: 12000 }, memberPresaleHours: 24 }, media: {}, agentGuidance: { talkingPoints: ["Only full-moon night this spring"] }, recap: {}, ops: { faqs: [{ q: "Dress?", a: "All white." }] }, seo: {}, announceOnPublish: false, aiFilled: {}, arStatus: "draft", createdBy: null, createdAt: new Date(), updatedAt: new Date(), publishedAt: null });
    expect(doc).toContain("FEATURED upcoming event"); expect(doc).toContain("Night session · 22:00–02:00 · doors 21:00"); expect(doc).toContain("- cabana: AED 12000"); expect(doc).toContain("Members presale: 24 h"); expect(doc).toContain("Q: Dress?");
  });
});
