import type { Locale } from "@/content/types";
import { hrefPath, pick, registry } from "@/content/registry";
import { Link } from "@/i18n/navigation";

export default function Footer({ locale }: { locale: Locale }) {
  const { settings, nav } = registry;
  return (
    <footer>
      <div className="ft-grid">
        <div>
          <Link href="/" className="ft-logo">{settings.brand}</Link>
          <p className="ft-about">{pick(settings.tagline, locale)}</p>
          <div className="ft-socials">
            {settings.socials.map((s) => <a key={s.label} href={s.href} className="ft-soc">{s.label}</a>)}
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
