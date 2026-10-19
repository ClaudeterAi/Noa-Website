import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { auditLog, events } from "@/db/schema";
import { elevenLabsKb, enqueueKbSync, processKbSync } from "./kb-sync";
import { enrichEvent, type EventDraft } from "./enrich";
import { getOrCreateSession } from "@/server/booking";

/** Refresh the public pages that show events. No-op outside a Next request (scripts, tests); ISR (60 s) is the safety net. */
async function revalidateEventPages() {
  try { const { revalidatePath } = await import("next/cache"); for (const p of ["/en", "/ar", "/en/events", "/ar/events"]) revalidatePath(p); } catch { /* not in a Next request */ }
}

/** Event write path: every save re-queues the knowledge sync and revalidation; publish flips status and triggers the push immediately. */
export type EventInput = Partial<Omit<typeof events.$inferInsert, "id" | "createdAt" | "updatedAt">> & { titleEn: string; date: string };
type Actor = { email: string; role: string };

export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

export async function listEvents(opts: { status?: string; from?: string } = {}) {
  const where = [];
  if (opts.status) where.push(eq(events.status, opts.status as typeof events.status.enumValues[number]));
  if (opts.from) where.push(gte(events.date, opts.from));
  return db.select().from(events).where(where.length ? and(...where) : undefined).orderBy(desc(events.date));
}
export const getEvent = async (id: string) => (await db.select().from(events).where(eq(events.id, id)))[0] ?? null;

export async function saveEvent(actor: Actor, id: string | null, input: EventInput): Promise<typeof events.$inferSelect> {
  const slug = input.slug?.trim() || `${slugify(input.titleEn)}-${input.date}`;
  return db.transaction(async (tx) => {
    const before = id ? (await tx.select().from(events).where(eq(events.id, id)))[0] : null;
    const values = { ...input, slug, updatedAt: sql`now()` as unknown as Date, createdBy: before?.createdBy ?? actor.email };
    const [row] = before
      ? await tx.update(events).set(values).where(eq(events.id, id!)).returning()
      : await tx.insert(events).values(values as typeof events.$inferInsert).returning();
    await tx.insert(auditLog).values({ actor: actor.email, role: actor.role, action: before ? "event.update" : "event.create", entity: "events", entityId: row.id, before: before as Record<string, unknown> | null, after: row as unknown as Record<string, unknown> });
    if (row.status === "published" || before?.status === "published" || row.kind === "highlight") await enqueueKbSync("event", row.id, "upsert", tx);
    return row;
  }).then(async (row) => { await revalidateEventPages(); return row; });
}

export async function setEventStatus(actor: Actor, id: string, status: "draft" | "published" | "past" | "cancelled") {
  const row = await db.transaction(async (tx) => {
    const [before] = await tx.select().from(events).where(eq(events.id, id));
    if (!before) throw new Error("Event not found");
    const sessionRow = status === "published" ? await getOrCreateSession(before.date, before.session, tx) : null;   // the event night becomes a bookable session
    const [after] = await tx.update(events).set({ status, sessionId: sessionRow?.id ?? before.sessionId, publishedAt: status === "published" ? sql`now()` : before.publishedAt, updatedAt: sql`now()` }).where(eq(events.id, id)).returning();
    await tx.insert(auditLog).values({ actor: actor.email, role: actor.role, action: `event.${status}`, entity: "events", entityId: id, before: { status: before.status }, after: { status } });
    await enqueueKbSync("event", id, status === "published" || (status === "past" && after.kind === "highlight") ? "upsert" : "delete", tx);
    return after;
  });
  if (elevenLabsKb()) void processKbSync().catch(() => undefined);   // push now when configured; the cron is the safety net
  await revalidateEventPages();
  return row;
}

/** AI auto-fill: returns the completed draft without saving; the admin reviews, then saves. */
export async function autofillEvent(draft: EventDraft) {
  return enrichEvent(draft);
}
