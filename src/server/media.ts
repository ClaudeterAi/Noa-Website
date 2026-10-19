import { createHash, randomUUID } from "node:crypto";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "@/db/client";
import { auditLog, mediaAssets, mediaSlots } from "@/db/schema";
import { registry } from "@/content/registry";

/**
 * Media manager. Files go straight from the admin's browser to NOA's private S3 bucket with a presigned
 * PUT (size and type checked here first), are registered as assets, and are assigned to site slots.
 * The public site serves them through /api/media/<key> (cached at the edge), so the bucket stays private.
 * Without a database or bucket configured, every slot falls back to the registry placeholder.
 */
export const ALLOWED: Record<string, { kind: "image" | "video"; ext: string }> = {
  "image/jpeg": { kind: "image", ext: "jpg" }, "image/png": { kind: "image", ext: "png" }, "image/webp": { kind: "image", ext: "webp" }, "image/avif": { kind: "image", ext: "avif" },
  "video/mp4": { kind: "video", ext: "mp4" }, "video/webm": { kind: "video", ext: "webm" },
};
export const MAX_BYTES = { image: 25 * 1024 * 1024, video: 300 * 1024 * 1024 };

const bucket = () => process.env.S3_MEDIA_BUCKET;
let s3: S3Client | null = null;
// WHEN_REQUIRED: otherwise SDK v3 signs a checksum header into presigned URLs that a browser PUT cannot supply (400)
export const s3Client = () => (s3 ??= new S3Client({ region: process.env.S3_REGION ?? process.env.AWS_REGION ?? "me-central-1", requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" }));
export const mediaConfigured = () => !!(bucket() && process.env.DATABASE_URL);

/** All slots the site knows, from the registry (ids, kind, placeholder) — the admin lists exactly these. */
export function siteSlots() {
  return Object.values(registry.media).map((m) => ({ id: m.id, kind: m.kind, placeholderUrl: m.url, label: m.id.replace(/-/g, " ") }));
}

export async function presignUpload(input: { filename: string; mime: string; bytes: number }, actor: string) {
  const allowed = ALLOWED[input.mime]; if (!allowed) throw new Error(`Unsupported file type ${input.mime}`);
  if (input.bytes <= 0 || input.bytes > MAX_BYTES[allowed.kind]) throw new Error(`File too large (max ${MAX_BYTES[allowed.kind] / 1024 / 1024} MB)`);
  const b = bucket(); if (!b) throw new Error("S3_MEDIA_BUCKET is not configured");
  const safe = input.filename.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "file";
  const key = `media/${createHash("sha256").update(`${actor}:${randomUUID()}`).digest("hex").slice(0, 12)}/${safe}.${allowed.ext}`;
  // size is verified at register time via HEAD; no ContentLength in the signature so any client can PUT
  const url = await getSignedUrl(s3Client(), new PutObjectCommand({ Bucket: b, Key: key, ContentType: input.mime }), { expiresIn: 900 });
  return { key, url, kind: allowed.kind, expiresIn: 900 };
}

/** After the browser PUT: verify the object really exists with the declared size/type, then record it. */
export async function registerAsset(input: { key: string; mime: string; bytes: number; width?: number; height?: number; durationSec?: number; altEn?: string; altAr?: string }, actor: string) {
  const b = bucket(); if (!b) throw new Error("S3_MEDIA_BUCKET is not configured");
  if (!/^media\/[a-f0-9]{12}\/[a-z0-9-]+\.[a-z0-9]+$/.test(input.key)) throw new Error("Bad key");
  const head = await s3Client().send(new HeadObjectCommand({ Bucket: b, Key: input.key }));
  if ((head.ContentLength ?? 0) !== input.bytes || (head.ContentType ?? "") !== input.mime) throw new Error("Uploaded object does not match the declared size/type");
  const kind = ALLOWED[input.mime]?.kind; if (!kind) throw new Error("Unsupported type");
  const [row] = await db.insert(mediaAssets).values({ key: input.key, kind, mime: input.mime, bytes: input.bytes, width: input.width, height: input.height, durationSec: input.durationSec, altEn: input.altEn, altAr: input.altAr, uploadedBy: actor })
    .onConflictDoUpdate({ target: mediaAssets.key, set: { altEn: input.altEn, altAr: input.altAr } }).returning();
  await db.insert(auditLog).values({ actor, role: "editor", action: "media.upload", entity: "media_assets", entityId: row.id, before: null, after: { key: row.key, bytes: row.bytes, mime: row.mime } });
  return row;
}

export async function assignSlot(slotId: string, assetId: string | null, actor: string) {
  if (!registry.media[slotId]) throw new Error("Unknown slot");
  const [before] = await db.select().from(mediaSlots).where(eq(mediaSlots.slotId, slotId));
  if (assetId) {
    const [a] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, assetId)); if (!a) throw new Error("Asset not found");
    if (a.kind !== registry.media[slotId].kind) throw new Error(`Slot ${slotId} needs a ${registry.media[slotId].kind}`);
    await db.insert(mediaSlots).values({ slotId, assetId, updatedBy: actor }).onConflictDoUpdate({ target: mediaSlots.slotId, set: { assetId, updatedBy: actor, updatedAt: sql`now()` } });
  } else if (before) {
    await db.delete(mediaSlots).where(eq(mediaSlots.slotId, slotId));   // back to the placeholder
  }
  await db.insert(auditLog).values({ actor, role: "editor", action: "media.assign", entity: "media_slots", entityId: slotId, before: before ? { assetId: before.assetId } : null, after: { assetId } });
}

export const listAssets = (limit = 200) => db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(limit);
export const listSlotAssignments = () => db.select({ slotId: mediaSlots.slotId, assetId: mediaSlots.assetId, key: mediaAssets.key, kind: mediaAssets.kind, altEn: mediaAssets.altEn, altAr: mediaAssets.altAr }).from(mediaSlots).innerJoin(mediaAssets, eq(mediaAssets.id, mediaSlots.assetId));

export const publicUrl = (key: string) => `/api/media/${key.replace(/^media\//, "")}`;

export type MediaMap = Record<string, { url: string | null; kind: "image" | "video"; alt?: { en: string; ar: string } }>;

/** Registry placeholders overlaid with admin assignments. Safe at build time (no DB → placeholders). */
export async function getMediaMap(): Promise<MediaMap> {
  const base: MediaMap = Object.fromEntries(Object.values(registry.media).map((m) => [m.id, { url: m.url, kind: m.kind, alt: m.alt ? { en: m.alt.en, ar: m.alt.ar } : undefined }]));
  if (!process.env.DATABASE_URL) return base;
  try {
    const rows = await listSlotAssignments();
    for (const r of rows) base[r.slotId] = { url: publicUrl(r.key), kind: r.kind as "image" | "video", alt: r.altEn ? { en: r.altEn, ar: r.altAr ?? r.altEn } : base[r.slotId]?.alt };
  } catch { /* database unreachable: placeholders */ }
  return base;
}

/** Stream an object for /api/media; Range passthrough so video seeks work. */
export async function getObjectStream(key: string, range?: string) {
  const b = bucket(); if (!b) return null;
  const [row] = await db.select({ mime: mediaAssets.mime }).from(mediaAssets).where(eq(mediaAssets.key, key));   // only registered assets are served
  if (!row) return null;
  const out = await s3Client().send(new GetObjectCommand({ Bucket: b, Key: key, Range: range }));
  return { body: out.Body as unknown as ReadableStream, status: out.ContentRange ? 206 : 200, headers: { "Content-Type": row.mime, ...(out.ContentLength !== undefined ? { "Content-Length": String(out.ContentLength) } : {}), ...(out.ContentRange ? { "Content-Range": out.ContentRange } : {}), "Accept-Ranges": "bytes", ETag: out.ETag ?? "" } };
}

export async function assetsByIds(ids: string[]) { return ids.length ? db.select().from(mediaAssets).where(inArray(mediaAssets.id, ids)) : []; }
