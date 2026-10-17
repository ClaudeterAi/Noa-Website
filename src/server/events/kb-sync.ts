import { createHash } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, type Db, type Tx } from "@/db/client";
import { events, kbDocuments, kbSyncJobs } from "@/db/schema";
import { buildKnowledge } from "@/server/concierge/knowledge";

type DbOrTx = Db | Tx;
type EventRow = typeof events.$inferSelect;

/* ---------------- rendering ---------------- */

const SESSION = { morning: "Morning 9:30–14:00", afternoon: "Afternoon 14:00–21:30", night: "Night session", full: "Full day" } as const;

/** The event as the agents should know it, in English and Arabic, with explicit sales guidance. */
export function renderEventDoc(e: EventRow): string {
  const L: string[] = [];
  const when = `${e.date} · ${SESSION[e.session]}${e.startsAt ? ` · ${e.startsAt}${e.endsAt ? `–${e.endsAt}` : ""}` : ""}${e.doorsAt ? ` · doors ${e.doorsAt}` : ""}`;
  L.push(`# Event: ${e.titleEn}${e.titleAr ? ` / ${e.titleAr}` : ""}`);
  L.push(`Status: ${e.status}${e.kind === "main" ? " · FEATURED upcoming event" : e.kind === "highlight" ? " · HIGHLIGHT (past, use as social proof)" : ""}`);
  L.push(`When: ${when}${e.area ? ` · ${e.area}` : ""}`);
  if (e.pitchEn) L.push(`Pitch: ${e.pitchEn}`);
  if (e.pitchAr) L.push(`العرض: ${e.pitchAr}`);
  if (e.vibeTags.length) L.push(`Vibe: ${e.vibeTags.join(", ")}`);
  if (e.lineup.length) {
    L.push("Line-up:");
    for (const a of e.lineup) L.push(`- ${a.name}${a.role ? ` (${a.role})` : ""}${a.origin ? ` · ${a.origin}` : ""}${a.genre ? ` · ${a.genre}` : ""}${a.setTime ? ` · set ${a.setTime}` : ""}${a.bio ? ` — ${a.bio}` : ""}`);
  }
  if (e.descriptionEn) L.push("", e.descriptionEn);
  if (e.descriptionAr) L.push("", e.descriptionAr);
  const t = e.ticketing;
  if (t.seatTypes?.length || t.prices || t.surchargeAed || t.minSpendCabanaAed || t.memberPresaleHours) {
    L.push("", "Tickets & seats:");
    if (t.seatTypes?.length) L.push(`- On sale: ${t.seatTypes.join(", ")}`);
    if (t.prices) for (const [k, v] of Object.entries(t.prices)) L.push(`- ${k}: AED ${v} (event price, before VAT)`);
    if (t.surchargeAed) L.push(`- Event surcharge: AED ${t.surchargeAed} per seat`);
    if (t.minSpendCabanaAed) L.push(`- Cabana minimum spend: AED ${t.minSpendCabanaAed}`);
    if (t.memberPresaleHours) L.push(`- Members presale: ${t.memberPresaleHours} h before general sale`);
    if (t.salesOpenAt || t.salesCloseAt) L.push(`- Sales: ${t.salesOpenAt ?? "open"} → ${t.salesCloseAt ?? "until sold out"}`);
    if (t.addOns?.length) L.push(`- Add-ons: ${t.addOns.map((a) => `${a.name} AED ${a.priceAed}`).join(", ")}`);
  }
  if (e.dressCodeOverride) L.push(`Dress code for this event: ${e.dressCodeOverride}`);
  if (e.ageRuleOverride) L.push(`Age rule for this event: ${e.ageRuleOverride}`);
  const g = e.agentGuidance;
  if (g.talkingPoints?.length) L.push("", "Talking points (say these):", ...g.talkingPoints.map((p) => `- ${p}`));
  if (g.objections?.length) L.push("Objections:", ...g.objections.map((o) => `- Q: ${o.q} A: ${o.a}`));
  if (g.doNotPromise?.length) L.push("Do not promise:", ...g.doNotPromise.map((p) => `- ${p}`));
  const r = e.recap;
  if (r.highlightsEn || r.attendance || r.quotes?.length) {
    L.push("", "Recap (what happened):");
    if (r.highlightsEn) L.push(r.highlightsEn);
    if (r.highlightsAr) L.push(r.highlightsAr);
    if (r.attendance) L.push(`Attendance: ${r.attendance}`);
    if (r.quotes?.length) L.push(...r.quotes.map((q) => `"${q}"`));
  }
  if (e.ops.faqs?.length) L.push("", "Event FAQs:", ...e.ops.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`));
  if (e.ops.shuttleNotes) L.push(`Shuttle for this event: ${e.ops.shuttleNotes}`);
  if (e.ops.checkinNotes) L.push(`Check-in: ${e.ops.checkinNotes}`);
  return L.join("\n");
}

/** Events block for the chat concierge's live knowledge (published upcoming + main + highlights). */
export async function eventsKnowledge(conn: DbOrTx = db): Promise<string> {
  const rows = await conn.select().from(events)
    .where(sql`${events.status} IN ('published','past') AND (${events.status} = 'published' OR ${events.kind} = 'highlight')`)
    .orderBy(events.date);
  if (!rows.length) return "";
  return ["## Events (live from the events database)", ...rows.map(renderEventDoc)].join("\n\n");
}

/* ---------------- outbox ---------------- */

export async function enqueueKbSync(entity: "event" | "site", entityId: string, action: "upsert" | "delete", conn: DbOrTx = db) {
  // coalesce: if a pending job exists for this entity, bump it to run now with the latest action
  const updated = await conn.update(kbSyncJobs).set({ action, nextAttemptAt: sql`now()` })
    .where(and(eq(kbSyncJobs.entity, entity), eq(kbSyncJobs.entityId, entityId), inArray(kbSyncJobs.status, ["queued", "sending"]))).returning({ id: kbSyncJobs.id });
  if (updated.length) return updated[0].id;
  const [row] = await conn.insert(kbSyncJobs).values({ entity, entityId, action }).returning({ id: kbSyncJobs.id });
  return row.id;
}

/* ---------------- provider ---------------- */

export interface KbProvider {
  createText(name: string, text: string): Promise<{ id: string }>;
  deleteDoc(id: string): Promise<void>;
  /** attach/detach documents on the agent's knowledge base list */
  setAgentDocs(update: (current: { type: string; id: string; name: string; usage_mode?: string }[]) => { type: string; id: string; name: string; usage_mode?: string }[]): Promise<void>;
}

export function elevenLabsKb(): KbProvider | null {
  const key = process.env.ELEVENLABS_API_KEY, agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!key || !agentId) return null;
  const api = process.env.ELEVENLABS_API ?? "https://api.elevenlabs.io";
  const call = async <T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> => {
    const res = await fetch(`${api}${path}`, { ...init, headers: { "xi-api-key": key, ...(init?.json ? { "Content-Type": "application/json" } : {}) }, body: init?.json ? JSON.stringify(init.json) : undefined });
    const text = await res.text();
    if (!res.ok) throw new Error(`elevenlabs ${init?.method ?? "GET"} ${path} → ${res.status} ${text.slice(0, 300)}`);
    return (text ? JSON.parse(text) : {}) as T;
  };
  return {
    createText: (name, text) => call<{ id: string }>("/v1/convai/knowledge-base/text", { method: "POST", json: { name, text } }),
    deleteDoc: async (id) => { await call(`/v1/convai/knowledge-base/${id}`, { method: "DELETE" }).catch(() => undefined); },
    setAgentDocs: async (update) => {
      const agent = await call<{ conversation_config: { agent: { prompt: { knowledge_base: { type: string; id: string; name: string; usage_mode?: string }[] } } } }>(`/v1/convai/agents/${agentId}`);
      const next = update(agent.conversation_config.agent.prompt.knowledge_base ?? []);
      await call(`/v1/convai/agents/${agentId}`, { method: "PATCH", json: { conversation_config: { agent: { prompt: { knowledge_base: next } } } } });
    },
  };
}

const BACKOFF_MIN = [1, 5, 30, 120];

/** Worker: push due jobs. Safe to run from cron and right after a save (SKIP LOCKED). */
export async function processKbSync(provider: KbProvider | null = elevenLabsKb(), limit = 20): Promise<{ done: number; failed: number; skipped: number }> {
  const out = { done: 0, failed: 0, skipped: 0 };
  const due = await db.transaction(async (tx) => {
    const rows = await tx.execute<{ id: string }>(sql`SELECT id FROM kb_sync_jobs WHERE status = 'queued' AND next_attempt_at <= now() ORDER BY next_attempt_at LIMIT ${limit} FOR UPDATE SKIP LOCKED`);
    const ids = rows.rows.map((r) => r.id);
    if (ids.length) await tx.update(kbSyncJobs).set({ status: "sending" }).where(inArray(kbSyncJobs.id, ids));
    return ids;
  });
  for (const id of due) {
    const [job] = await db.select().from(kbSyncJobs).where(eq(kbSyncJobs.id, id));
    if (!job) continue;
    if (!provider) { await db.update(kbSyncJobs).set({ status: "skipped", error: "ElevenLabs not configured" }).where(eq(kbSyncJobs.id, id)); out.skipped++; continue; }
    try {
      await syncOne(job, provider);
      await db.update(kbSyncJobs).set({ status: "done", doneAt: sql`now()`, attempts: job.attempts + 1, error: null }).where(eq(kbSyncJobs.id, id));
      out.done++;
    } catch (e) {
      const attempts = job.attempts + 1; const backoff = BACKOFF_MIN[attempts - 1];
      await db.update(kbSyncJobs).set({ status: backoff ? "queued" : "failed", attempts, error: String(e).slice(0, 500), nextAttemptAt: backoff ? sql`now() + make_interval(mins => ${backoff})` : job.nextAttemptAt }).where(eq(kbSyncJobs.id, id));
      out.failed++;
    }
  }
  return out;
}

async function syncOne(job: typeof kbSyncJobs.$inferSelect, p: KbProvider) {
  const [existing] = await db.select().from(kbDocuments).where(and(eq(kbDocuments.entity, job.entity), eq(kbDocuments.entityId, job.entityId), eq(kbDocuments.provider, "elevenlabs")));
  let text: string | null = null, name = "";
  if (job.action === "upsert") {
    if (job.entity === "event") {
      const [e] = await db.select().from(events).where(eq(events.id, job.entityId));
      if (!e || (e.status !== "published" && !(e.status === "past" && e.kind === "highlight"))) text = null;   // unpublished/cancelled → treat as delete
      else { text = renderEventDoc(e); name = `event:${e.slug}`; }
    } else { text = `${await buildKnowledge("en")}\n\n---\n\n${await buildKnowledge("ar")}`; name = "NOA knowledge (EN+AR)"; }
  }
  if (text === null) {
    if (existing) { await p.setAgentDocs((cur) => cur.filter((d) => d.id !== existing.documentId)); await p.deleteDoc(existing.documentId); await db.delete(kbDocuments).where(and(eq(kbDocuments.entity, job.entity), eq(kbDocuments.entityId, job.entityId))); }
    return;
  }
  const hash = createHash("sha256").update(text).digest("hex");
  if (existing && existing.contentHash === hash) return;   // nothing changed
  const created = await p.createText(`${name} ${new Date().toISOString().slice(0, 16)}`, text);
  await p.setAgentDocs((cur) => [...cur.filter((d) => d.id !== existing?.documentId), { type: "text", id: created.id, name, usage_mode: "auto" }]);
  if (existing) await p.deleteDoc(existing.documentId);
  await db.insert(kbDocuments).values({ entity: job.entity, entityId: job.entityId, provider: "elevenlabs", documentId: created.id, contentHash: hash })
    .onConflictDoUpdate({ target: [kbDocuments.entity, kbDocuments.entityId, kbDocuments.provider], set: { documentId: created.id, contentHash: hash, updatedAt: sql`now()` } });
}
