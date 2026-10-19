import { guard, Denied } from "../_guard";
import { listAssets, listSlotAssignments, mediaConfigured, publicUrl, siteSlots } from "@/server/media";
import MediaManager from "./MediaManager";

export const dynamic = "force-dynamic";

export default async function Media() {
  const g = await guard(); if (g.denied) return <Denied />;
  const configured = mediaConfigured();
  const [assets, assigned] = configured ? await Promise.all([listAssets(), listSlotAssignments()]) : [[], []];
  const byId = new Map(assets.map((a) => [a.id, a]));
  const slots = siteSlots().map((s) => { const a = assigned.find((x) => x.slotId === s.id); return { ...s, assetId: a?.assetId ?? null, currentUrl: a ? publicUrl(a.key) : s.placeholderUrl, source: a ? "uploaded" : "placeholder" }; });
  return (
    <main className="ad-main">
      <h1>Media</h1>
      {!configured && <p className="err">Uploads need S3_MEDIA_BUCKET and the database configured on this deployment.</p>}
      <p className="note">Every image and film on the site is a slot. Upload a file and assign it; the site updates within a minute. "Reset" returns a slot to its placeholder. Files go straight to NOA's private bucket; the site serves cached copies.</p>
      <MediaManager canEdit={g.session.role !== "frontdesk"} slots={slots} assets={assets.map((a) => ({ id: a.id, key: a.key, kind: a.kind, mime: a.mime, bytes: a.bytes, url: publicUrl(a.key), altEn: a.altEn, createdAt: a.createdAt.toISOString(), used: assigned.filter((x) => x.assetId === a.id).map((x) => x.slotId) }))} />
      <span hidden>{byId.size}</span>
    </main>
  );
}
