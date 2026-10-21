import Link from "next/link";
import { guard, Denied } from "../_guard";
import { contentFields } from "@/lib/content";
import { loadContent } from "@/server/content";
import { ContentRow } from "./ui";

const GROUP_LABEL = (g: string) => (g.startsWith("page:") ? g.slice(5).replace(/-/g, " ") : g);

/** Page wording editor. Pick a page; every text on it is listed with English and Arabic side by side. */
export default async function Content({ searchParams }: { searchParams: Promise<{ g?: string; q?: string }> }) {
  const g = await guard("editor"); if (g.denied) return <Denied />;
  const sp = await searchParams;
  const overrides = await loadContent();
  const all = contentFields();
  const groups = [...new Set(all.map((f) => f.group))];
  const group = sp.g && groups.includes(sp.g) ? sp.g : groups[0];
  const q = sp.q?.trim().toLowerCase();
  const list = q ? all.filter((f) => f.original.en.toLowerCase().includes(q) || f.node.en.toLowerCase().includes(q) || f.node.ar.includes(sp.q!.trim())) : all.filter((f) => f.group === group);
  const edited = (grp: string) => all.filter((f) => f.group === grp && overrides[f.path]).length;
  return (
    <main className="ad-main">
      <h1>Content</h1>
      <p className="note">Change any wording on the website in English and Arabic. Saving updates every page at once and the concierge. Placeholders like {"{{pier}}"} or {"{{night.time}}"} are filled from Settings → Venue; keep them where the text mentions those facts. Reset brings back the original wording.</p>
      <form className="row" style={{ margin: "12px 0" }}>
        <input name="q" placeholder="Search all wording…" defaultValue={sp.q ?? ""} style={{ minWidth: 280 }} />
        <button className="ghost" type="submit">Search</button>
        {q && <Link className="ghost" href={`/admin/content?g=${encodeURIComponent(group)}`}>Clear</Link>}
      </form>
      <nav className="row" style={{ flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {groups.map((x) => (
          <Link key={x} href={`/admin/content?g=${encodeURIComponent(x)}`} className={`pill${x === group && !q ? " ok" : ""}`} style={{ textTransform: "capitalize" }}>
            {GROUP_LABEL(x)}{edited(x) ? ` · ${edited(x)} edited` : ""}
          </Link>
        ))}
      </nav>
      <p className="note">{q ? `${list.length} texts match "${sp.q}"` : `${list.length} texts on ${GROUP_LABEL(group)}`}</p>
      {list.map((f) => (
        <ContentRow key={f.path} path={f.path} label={q ? `${GROUP_LABEL(f.group)} · ${f.label}` : f.label}
          original={f.original} current={overrides[f.path] ? { en: overrides[f.path].en, ar: overrides[f.path].ar, reviewed: overrides[f.path].reviewed } : null} />
      ))}
    </main>
  );
}
