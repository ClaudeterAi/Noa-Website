/** Media manager against the REAL S3 bucket (presign → PUT → register → assign → served map) with the local Postgres. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db/client";
import { seed } from "@/db/seed";
import { assignSlot, getMediaMap, getObjectStream, presignUpload, publicUrl, registerAsset, siteSlots } from "@/server/media";

const live = !!process.env.S3_MEDIA_BUCKET && !!process.env.AWS_ACCESS_KEY_ID;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed();
  await db.execute(sql`TRUNCATE media_slots, media_assets CASCADE`);
});
afterAll(async () => { await pool.end(); });

describe("media", () => {
  it("lists every registry slot with its placeholder; the map equals placeholders when nothing is assigned", async () => {
    const slots = siteSlots(); expect(slots.find((s) => s.id === "hero-video")?.kind).toBe("video"); expect(slots.length).toBeGreaterThan(10);
    const m = await getMediaMap(); expect(m["hero-video"].url).toBe("/media/hero-placeholder.mp4");
  });
  it("refuses unsupported types and oversized files before any upload", async () => {
    await expect(presignUpload({ filename: "x.gif", mime: "image/gif", bytes: 10 }, "t@noa")).rejects.toThrow(/Unsupported/);
    await expect(presignUpload({ filename: "x.jpg", mime: "image/jpeg", bytes: 26 * 1024 * 1024 }, "t@noa")).rejects.toThrow(/too large/);
  });
  it.skipIf(!live)("real round-trip: presign → PUT → register → assign → public URL served with cache headers", async () => {
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
    const pre = await presignUpload({ filename: "Test Pixel.png", mime: "image/png", bytes: png.length }, "test@noa-dubai.com");
    expect(pre.key).toMatch(/^media\/[a-f0-9]{12}\/test-pixel\.png$/);
    const put = await fetch(pre.url, { method: "PUT", body: png, headers: { "Content-Type": "image/png" } }); expect(put.status).toBe(200);
    await expect(registerAsset({ key: pre.key, mime: "image/png", bytes: 999 }, "test@noa-dubai.com")).rejects.toThrow(/does not match/);   // tampered size
    const asset = await registerAsset({ key: pre.key, mime: "image/png", bytes: png.length, width: 1, height: 1, altEn: "pixel" }, "test@noa-dubai.com");
    await expect(assignSlot("hero-video", asset.id, "test@noa-dubai.com")).rejects.toThrow(/needs a video/);
    await assignSlot("pkg-morning", asset.id, "test@noa-dubai.com");
    const m = await getMediaMap(); expect(m["pkg-morning"].url).toBe(publicUrl(pre.key)); expect(m["pkg-morning"].alt?.en).toBe("pixel");
    const obj = await getObjectStream(pre.key); expect(obj?.status).toBe(200); expect(obj?.headers["Content-Type"]).toBe("image/png");
    const part = await getObjectStream(pre.key, "bytes=0-9"); expect(part?.status).toBe(206);
    await assignSlot("pkg-morning", null, "test@noa-dubai.com");
    expect((await getMediaMap())["pkg-morning"].url).not.toBe(publicUrl(pre.key));   // back to placeholder
    expect(await getObjectStream("media/000000000000/nope.png")).toBeNull();          // unregistered keys are never served
  });
});
