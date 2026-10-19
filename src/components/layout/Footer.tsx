import type { Locale } from "@/content/types";
import { hrefPath, pick, registry } from "@/content/registry";
import { Link } from "@/i18n/navigation";

const SOCIAL_NAMES: Record<string, string> = { IG: "Instagram", TK: "TikTok", FB: "Facebook", YT: "YouTube", X: "X" };
function SocialIcon({ id }: { id: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "IG": return <svg viewBox="0 0 24 24" width="16" height="16" {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".9" fill="currentColor" stroke="none" /></svg>;
    case "TK": return <svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 4c.4 2.6 2.1 4.3 4.5 4.6" /></svg>;
    case "FB": return <svg viewBox="0 0 24 24" width="16" height="16" {...p}><path d="M14 8h2.5V4.5H14c-2.2 0-3.5 1.4-3.5 3.6V10H8v3.5h2.5V20H14v-6.5h2.5l.5-3.5h-3V8.4c0-.3.1-.4.4-.4z" /></svg>;
    case "YT": return <svg viewBox="0 0 24 24" width="16" height="16" {...p}><rect x="3" y="6" width="18" height="12" rx="4" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" /></svg>;
    default: return <span style={{ fontSize: ".6rem" }}>{id}</span>;
  }
}
export default function Footer({ locale }: { locale: Locale }) {
  const { settings, nav } = registry;
  return (
    <footer>
      <div className="ft-grid">
        <div>
          <Link href="/" className="ft-logo">{settings.brand}</Link>
          <p className="ft-about">{pick(settings.tagline, locale)}</p>
          <div className="ft-socials">
            {settings.socials.filter((s) => s.href && s.href !== "#").map((s) => <a key={s.label} href={s.href} className="ft-soc" aria-label={SOCIAL_NAMES[s.label] ?? s.label} target="_blank" rel="noopener noreferrer"><SocialIcon id={s.label} /></a>)}
          </div>
        </div>
        {nav.footer.map((col) => (
          <div className="ft-col" key={col.heading.en}>
            <h4>{pick(col.heading, locale)}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={l.label.en}><Link href={hrefPath(l.href)}>{pick(l.label, locale)}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="ft-bot">
        <span className="ft-copy">{pick(settings.copyright, locale)}</span>
        <div className="ft-legal">
          <Link href="/privacy">{locale === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
          <Link href="/terms">{locale === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}</Link>
          <Link href="/cookies">{locale === "ar" ? "سياسة ملفات تعريف الارتباط" : "Cookie Policy"}</Link>
        </div>
      </div>
    </footer>
  );
}
