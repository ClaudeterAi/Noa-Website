/** Admin → Content: every text has one stable address; edits overlay the code's copy; reset restores it; bad input writes nothing. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { seed } from "@/db/seed";
import { saveContentField, resetContentField } from "@/server/admin/actions";
import { loadContent } from "@/server/content";
import { buildKnowledge } from "@/server/concierge/knowledge";
import { contentFields, applyContentOverrides } from "@/lib/content";
import { getPage, pick } from "@/content/registry";

const actor = { email: "editor@noa-dubai.com", role: "editor" as const };
const rows = async () => (await db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM content_fields`)).rows[0].n;

beforeAll(async () => { await migrate(db, { migrationsFolder: "./drizzle" }); await seed({ onlyIfEmpty: true }); await db.execute(sql`DELETE FROM content_fields`); applyContentOverrides({}); });
afterAll(async () => { await db.execute(sql`DELETE FROM content_fields`); applyContentOverrides({}); await pool.end(); });

describe("addresses", () => {
  it("every bilingual text has one unique address and pages are covered", () => {
    const f = contentFields();
    expect(new Set(f.map((x) => x.path)).size).toBe(f.length);
    expect(f.length).toBeGreaterThan(200);
    for (const id of ["home", "location", "night-package", "about", "faq"]) expect(f.some((x) => x.group === `page:${id}`)).toBe(true);
  });
});

describe("edit, overlay, reset", () => {
  it("an edit shows in English and Arabic, venue placeholders still fill, and reset brings the original back", async () => {
    const field = contentFields().find((x) => x.path.startsWith("page:location/") && x.label.endsWith("heading"))!;
    const original = { ...field.original };
    const r = await saveContentField(actor, { path: field.path, en: "Find us at {{pier}}", ar: "تجدنا في {{pier}}", arReviewed: true });
    expect(r.ok).toBe(true);
    applyContentOverrides({}); await loadContent();   // what a fresh render does
    expect(pick(field.node, "en")).toContain("Find us at ");
    expect(pick(field.node, "en")).not.toContain("{{");
    expect(pick(field.node, "ar")).toContain("تجدنا في ");
    expect(field.node.arStatus).toBe("reviewed");
    const page = JSON.stringify(getPage("location"));
    expect(page).toContain("Find us at {{pier}}");
    expect(await buildKnowledge("en")).toBeTypeOf("string");

    const back = await resetContentField(actor, field.path);
    expect(back.ok).toBe(true);
    applyContentOverrides({}); await loadContent();
    expect(field.node.en).toBe(original.en);
    expect(field.node.ar).toBe(original.ar);
    expect(await rows()).toBe(0);
  });

  it("saving the original wording stores nothing", async () => {
    const field = contentFields().find((x) => x.group === "page:home")!;
    const r = await saveContentField(actor, { path: field.path, en: field.original.en, ar: field.original.ar, arReviewed: false });
    expect(r.ok).toBe(true);
    expect(await rows()).toBe(0);
  });
});

describe("refused input writes nothing", () => {
  it("unknown address, empty Arabic, unknown placeholder", async () => {
    const field = contentFields().find((x) => x.group === "page:about")!;
    expect((await saveContentField(actor, { path: "page:nowhere/x", en: "a", ar: "ب", arReviewed: false })).ok).toBe(false);
    expect((await saveContentField(actor, { path: field.path, en: "Hello", ar: "  ", arReviewed: false })).ok).toBe(false);
    const bad = await saveContentField(actor, { path: field.path, en: "Boats from {{firstBoatt}}", ar: "قوارب {{firstBoat}}", arReviewed: false });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.join(" ")).toContain("{{firstBoatt}}");
    expect(await rows()).toBe(0);
  });
});
