/**
 * Editable page wording. Every bilingual text in the content registry gets a stable address; edits saved in
 * Admin → Content are laid over the code's original wording at render time, on the server and in the browser.
 * Removing an edit brings the original back. Isomorphic: no database here.
 */
import type { L } from "@/content/types";
import { registry } from "@/content/registry";

export interface ContentField { path: string; group: string; label: string; node: L; original: { en: string; ar: string } }
export type ContentOverrides = Record<string, { en: string; ar: string; reviewed: boolean }>;

const isL = (v: unknown): v is L =>
  !!v && typeof v === "object" && !Array.isArray(v) && typeof (v as L).en === "string" && typeof (v as L).ar === "string";

/** Stable key for an array element: its id when it has one, otherwise its position. */
const key = (v: unknown, i: number) => (v && typeof v === "object" && typeof (v as { id?: unknown }).id === "string" ? (v as { id: string }).id : String(i));

function walk(v: unknown, path: string, group: string, out: ContentField[], seen: Set<unknown>) {
  if (!v || typeof v !== "object" || seen.has(v)) return;
  seen.add(v);
  if (isL(v)) { out.push({ path, group, label: path.slice(group.length + 1) || "text", node: v, original: { en: v.en, ar: v.ar } }); return; }
  if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}/${key(x, i)}`, group, out, seen)); return; }
  for (const [k, x] of Object.entries(v)) { if (k === "id" || k === "media" || k === "href") continue; walk(x, `${path}/${k}`, group, out, seen); }
}

let fields: ContentField[] | null = null;
/** Every editable text, once, with the code's original wording captured before any edit is applied. */
export function contentFields(): ContentField[] {
  if (fields) return fields;
  const out: ContentField[] = []; const seen = new Set<unknown>();
  for (const p of registry.pages) walk(p, `page:${p.id}`, `page:${p.id}`, out, seen);
  for (const [id, f] of Object.entries(registry.faqs)) walk(f, `faq:${id}`, `faqs`, out, seen);
  for (const [id, p] of Object.entries(registry.packages)) walk(p, `package:${id}`, `packages`, out, seen);
  walk(registry.nav, "nav", "nav", out, seen);
  fields = out;
  return out;
}

let applied: ContentOverrides = {};
/** Lay the saved edits over the originals. Called with the full set each time, so a removed edit reverts. */
export function applyContentOverrides(overrides: ContentOverrides) {
  for (const f of contentFields()) {
    const o = overrides[f.path];
    f.node.en = o?.en?.trim() ? o.en : f.original.en;
    f.node.ar = o?.ar?.trim() ? o.ar : f.original.ar;
    if (o) f.node.arStatus = o.reviewed ? "reviewed" : "draft"; else delete f.node.arStatus;
  }
  applied = overrides;
}
export const appliedContentOverrides = () => applied;

/** Tokens the copy may use; anything else in {{ }} is refused on save. */
export const KNOWN_TOKENS = ["pier", "berth", "landmark", "phone", "phoneHref", "email", "mapUrl", "crossing", "boatEvery", "arriveBefore", "boardingCloses", "hours", "firstBoat", "dressCode", "cancellation",
  ...["morning", "afternoon", "night"].flatMap((s) => ["time", "lastBoat", "firstBoat", "age", "minAge"].map((f) => `${s}.${f}`))];
export function unknownTokens(text: string): string[] {
  return [...text.matchAll(/\{\{\s*([a-zA-Z.]+)\s*\}\}/g)].map((m) => m[1]).filter((t) => !KNOWN_TOKENS.includes(t));
}
