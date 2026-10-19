import type { CSSProperties } from "react";
import type { CtaLink, L, Locale, Section } from "@/content/types";
import { hrefPath, mediaUrl, pick, registry } from "@/content/registry";
import { Link } from "@/i18n/navigation";
import { Rich } from "@/components/Text";
import { AmenityIcon } from "./Icons";
import FaqList from "./FaqList";
import ContactForm from "./ContactForm";
import { publishedEvents } from "@/server/events/public";
import { getMediaMap } from "@/server/media";
import Carousel from "@/components/ui/Carousel";
import NewsletterForm from "@/components/sections/NewsletterForm";
import type { EventItem } from "@/content/types";

/** Event art: an uploaded poster URL, a registry slot id, or the DJ placeholder. */
const eventImage = (media: string | undefined, lookup: (id: string | undefined) => string | null) => {
  if (!media) return lookup("deck-dj-1") ?? lookup("split-dj") ?? "";
  if (media.startsWith("/") || media.startsWith("http")) return media;
  return lookup(media) ?? lookup("deck-dj-1") ?? "";
};

const bgFrom = (lookup: (id: string | undefined) => string | null) => (mediaId: string): CSSProperties => {
  const url = lookup(mediaId) ?? mediaUrl(mediaId);
  return url ? { backgroundImage: `url('${url}')` } : {};
};

function CtaA({ link, locale, className }: { link: CtaLink; locale: Locale; className?: string }) {
  return <Link href={hrefPath(link.href)} className={className}>{pick(link.label, locale)}</Link>;
}
function CtaButton({ link, locale, className = "pkg-btn" }: { link: CtaLink; locale: Locale; className?: string }) {
  return <Link href={hrefPath(link.href)}><button type="button" className={className}>{pick(link.label, locale)}</button></Link>;
}

export async function SectionRenderer({ section: s, locale }: { section: Section; locale: Locale }) {
  const media = await getMediaMap();   // admin uploads overlay the registry placeholders
  const mUrl = (id: string | undefined) => (id ? media[id]?.url ?? null : null);
  const bg = bgFrom(mUrl);
  const live = s.type === "eventsGrid" || s.type === "eventStrip" || s.type === "posterCarousel" ? await publishedEvents() : null;
  const liveList = (ids: string[], take?: number): EventItem[] => {
    const fromDb = live?.upcoming ?? [];
    if (fromDb.length) return take ? fromDb.slice(0, take) : fromDb;
    return ids.map((id) => registry.events[id]);
  };
  switch (s.type) {
    case "hero": {
      const video = { url: mUrl(s.media) };
      const poster = { url: mUrl("hero-poster") ?? mUrl("hero-still") };
      const still = { url: mUrl("hero-still") };
      const isPlaceholderFilm = !!video.url && video.url.startsWith("/media/hero-placeholder");
      return (
        <section className={`hero${s.quiet ? " hero-quiet" : ""}`} id={s.id}>
          {video?.url ? (
            <video className="hero-bg hero-video" autoPlay muted loop playsInline preload="metadata" poster={poster?.url ?? undefined} aria-hidden="true">
              {isPlaceholderFilm && <source src={video.url.replace(/\.mp4$/, ".webm")} type="video/webm" />}
              <source src={video.url} type={video.url.endsWith(".webm") ? "video/webm" : "video/mp4"} />
            </video>
          ) : (
            <div className="hero-bg" style={still?.url ? bg("hero-still") : undefined} data-placeholder="hero-video" />
          )}
          <div className="hero-fade" />
        </section>
      );
    }

    case "ticker": {
      const items = [...s.items, ...s.items];
      return (
        <div className="ticker" id={s.id}>
          <div className="ticker-track">
            {items.map((it, i) => <span className="ti" key={i}><span className="ti-dot" />{pick(it, locale)}</span>)}
          </div>
        </div>
      );
    }

    case "split":
      return (
        <section className="split" id={s.id}>
          {s.cells.map((c) => {
            const inner = (
              <>
                <div className="split-bg" style={bg(c.media)} />
                <div className="split-overlay" />
                <div className="split-text">
                  <div className="split-h">{pick(c.heading, locale)}</div>
                  <div className="split-s">{pick(c.sub, locale)}</div>
                </div>
              </>
            );
            return c.href
              ? <Link key={c.media} href={hrefPath(c.href)} className="split-cell">{inner}</Link>
              : <div key={c.media} className="split-cell">{inner}</div>;
          })}
        </section>
      );

    case "package": {
      const p = registry.packages[s.packageId];
      const copy = (
        <div className="pkg-copy rv">
          <div className="pkg-num">{locale === "ar" ? `الباقة — ${p.number}` : `Package — ${p.number}`}</div>
          <div className="pkg-h"><Rich l={p.name} locale={locale} /></div>
          <div className="pkg-vibe">{pick(p.vibe, locale)}</div>
          <div className="pkg-time">{pick(p.time, locale)}</div>
          <p className="pkg-desc">{pick(p.desc, locale)}</p>
          <div className="pkg-actions">
            <CtaA link={p.more} locale={locale} className="pkg-more" />
            <CtaButton link={p.book} locale={locale} />
          </div>
        </div>
      );
      const img = <div className="pkg-img"><div className="pkg-img-inner" style={bg(p.media)} /></div>;
      return (
        <section className={`pkg${s.flip ? " flip" : ""}`} id={s.id}>
          {s.flip ? <>{img}{copy}</> : <>{copy}{img}</>}
        </section>
      );
    }

    case "restaurant":
      return (
        <section className="rest" id={s.id}>
          <div className="rv">
            <div className="rest-h"><Rich l={s.heading} locale={locale} /></div>
            <div className="rest-sub">{pick(s.sub, locale)}</div>
          </div>
          <div className="rest-grid rv d1">
            {s.media.map((m) => <div className="rest-img" key={m}><div className="rest-img-inner" style={bg(m)} /></div>)}
          </div>
        </section>
      );

    /* ---------------- editorial home (design pass 2) ---------------- */
    case "editorialIntro": {
      return (
        <section className="ed-intro" id={s.id}>
          <div className="ed-intro-copy rv">
            <div className="ed-eyebrow">{pick(s.eyebrow, locale)}</div>
            <h2 className="ed-h">{pick(s.heading, locale)}</h2>
            {s.paragraphs.map((p, i) => <p key={i} className="ed-p">{pick(p, locale)}</p>)}
            <dl className="ed-facts">
              {s.facts.map((f, i) => (
                <div key={i} className="ed-fact"><dt>{pick(f.label, locale)}</dt><dd>{f.lines.map((l, j) => <span key={j}>{pick(l, locale)}</span>)}</dd></div>
              ))}
            </dl>
            {s.link && <CtaA link={s.link} locale={locale} className="ed-link" />}
          </div>
          <div className="ed-intro-media rv">
            <Carousel arrows="none" ariaLabel={pick(s.heading, locale)}>
              {s.media.map((m) => <div key={m} className="ed-frame ed-frame-landscape" style={bg(m)} role="img" aria-label={media[m]?.alt?.[locale] ?? ""} />)}
            </Carousel>
          </div>
        </section>
      );
    }
    case "tileCarousels": {
      return (
        <section className="ed-tiles" id={s.id}>
          {s.tiles.map((tile, i) => (
            <div key={i} className="ed-tile rv">
              <Carousel arrows="inside" ariaLabel={pick(tile.heading, locale)}>
                {tile.media.map((m) => <div key={m} className="ed-frame ed-frame-portrait" style={bg(m)} role="img" aria-label={media[m]?.alt?.[locale] ?? ""} />)}
              </Carousel>
              <div className="ed-tile-label">
                <div className="ed-tile-h">{pick(tile.heading, locale)}</div>
                <div className="ed-tile-sub">{pick(tile.sub, locale)}</div>
              </div>
              {tile.caption && <div className="ed-tile-cap">{pick(tile.caption, locale)}</div>}
              {tile.href && <Link href={hrefPath(tile.href)} className="ed-tile-link" aria-label={pick(tile.heading, locale)} />}
            </div>
          ))}
        </section>
      );
    }
    case "packageEditorial": {
      const p = registry.packages[s.packageId];
      return (
        <section className={`ed-pkg${s.flip ? " flip" : ""}`} id={s.id}>
          <div className="ed-pkg-copy rv">
            <h2 className="ed-h">{pick(p.name, locale).replace("\n", " ")}</h2>
            <div className="ed-pkg-vibe">{pick(p.vibe, locale)}</div>
            <div className="ed-pkg-time">{pick(p.time, locale)}</div>
            <p className="ed-p">{pick(p.desc, locale)}</p>
            <div className="ed-actions"><CtaA link={p.more} locale={locale} className="ed-link" /><CtaButton link={p.book} locale={locale} /></div>
          </div>
          <div className="ed-pkg-media rv"><div className="ed-frame ed-frame-bleed" style={bg(p.media)} role="img" aria-label={media[p.media]?.alt?.[locale] ?? ""} /></div>
        </section>
      );
    }
    case "galleryCarousel": {
      return (
        <section className="ed-gallery" id={s.id}>
          <div className="ed-center rv"><h2 className="ed-h">{pick(s.heading, locale)}</h2><div className="ed-sub">{pick(s.sub, locale)}</div></div>
          <div className="rv">
            <Carousel perView={2} arrows="outside" dots={false} ariaLabel={pick(s.heading, locale)}>
              {s.media.map((m) => <div key={m} className="ed-frame ed-frame-tall" style={bg(m)} role="img" aria-label={media[m]?.alt?.[locale] ?? ""} />)}
            </Carousel>
          </div>
          {s.link && <div className="ed-center rv"><CtaA link={s.link} locale={locale} className="ed-link ed-link-arrow" /></div>}
        </section>
      );
    }
    case "textPortrait": {
      return (
        <section className={`ed-portrait${s.flip ? " flip" : ""}`} id={s.id}>
          <div className="ed-portrait-copy rv">
            <h2 className="ed-h">{pick(s.heading, locale)}</h2>
            <div className="ed-sub">{pick(s.sub, locale)}</div>
            {s.paragraphs.map((p, i) => <p key={i} className="ed-p">{pick(p, locale)}</p>)}
            {s.link && <CtaButton link={s.link} locale={locale} />}
          </div>
          <div className="ed-portrait-media rv"><div className="ed-frame ed-frame-portrait" style={bg(s.media)} role="img" aria-label={media[s.media]?.alt?.[locale] ?? ""} /></div>
        </section>
      );
    }
    case "posterCarousel": {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(new Date());
      const pool: Array<{ id: string; date: string; name: L; artist: L; shortDate: L; media?: string; kind?: string; status?: string }> = s.source === "upcoming" ? (live?.upcoming ?? []) : (live?.highlights ?? []);
      const picked = s.source === "upcoming" ? pool.filter((e) => e.date >= today).slice(0, 8) : pool.slice(0, 8);
      const slides = picked.length
        ? picked.map((e) => ({ key: e.id, img: eventImage(e.media, mUrl), name: pick(e.name, locale).replace("\n", " "), who: pick(e.artist, locale), when: pick(e.shortDate, locale) }))
        : s.fallbackMedia.map((m, i) => ({ key: m, img: mUrl(m) ?? "", name: locale === "ar" ? "قريباً" : "Coming soon", who: "", when: locale === "ar" ? `البرنامج ${i + 1}` : `Line-up ${i + 1}` }));
      return (
        <section className={`ed-posters ed-posters-${s.aspect === "1/1" ? "sq" : "tall"}`} id={s.id}>
          <div className="ed-center rv"><h2 className="ed-h">{pick(s.heading, locale)}</h2>{s.sub && <div className="ed-sub">{pick(s.sub, locale)}</div>}</div>
          <div className="rv">
            <Carousel perView={3} arrows="outside" dots={slides.length > 3} ariaLabel={pick(s.heading, locale)}>
              {slides.map((sl) => (
                <Link key={sl.key} href={hrefPath(s.href)} className="ed-poster">
                  <div className={`ed-frame ${s.aspect === "1/1" ? "ed-frame-square" : "ed-frame-poster"}`} style={{ backgroundImage: `url('${sl.img}')` }} />
                  <div className="ed-poster-meta"><div className="ed-poster-name">{sl.name}</div><div className="ed-poster-sub">{[sl.who, sl.when].filter(Boolean).join(" · ")}</div></div>
                </Link>
              ))}
            </Carousel>
          </div>
        </section>
      );
    }
    case "newsletter": {
      return (
        <section className="ed-news" id={s.id}>
          <div className="ed-center"><div className="ed-eyebrow">{pick(s.kicker, locale)}</div><h2 className="ed-h">{pick(s.heading, locale)}</h2><p className="ed-p">{pick(s.body, locale)}</p></div>
          <NewsletterForm locale={locale} />
        </section>
      );
    }
    case "eventsGrid":
      return (
        <section className="events" id={s.id}>
          <div className="events-top rv">
            <div className="events-h"><Rich l={s.heading} locale={locale} /></div>
            {s.all && <CtaButton link={s.all} locale={locale} className="events-all" />}
          </div>
          <div className="events-grid">
            {liveList(s.eventIds, 3).map((e, i) => {
              const id = e.id;
              return (
                <Link key={id} href={hrefPath(s.cardHref)} className={`evt rv${i ? ` d${i}` : ""}`} data-placeholder={e.isPlaceholder ? "event" : undefined}>
                  <div className="evt-img">
                    <div className="evt-bg" style={e.media ? bg(e.media) : undefined} />
                    <div className="evt-dim" />
                  </div>
                  <div className="evt-body">
                    <div className="evt-date">{pick(e.dateLabel, locale)}</div>
                    <div className="evt-name"><Rich l={e.name} locale={locale} /></div>
                    <div className="evt-who">{pick(e.artist, locale)}</div>
                    <div className="evt-link">{locale === "ar" ? "احجز مكانك" : "Reserve Your Spot"}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      );

    case "eventStrip":
      return (
        <section className="event-strip" id={s.id} style={s.noTopBorder ? { borderTop: "none", paddingTop: 0 } : undefined}>
          <div className="event-strip-h rv">{pick(s.heading, locale)}</div>
          {(live?.upcoming.length ? liveList(s.eventIds).slice(3) : s.eventIds.map((id) => registry.events[id])).map((e) => {
            const id = e.id;
            return (
              <Link key={id} href={hrefPath(s.href)} className="event-row rv" data-placeholder={e.isPlaceholder ? "event" : undefined}>
                <div className="event-row-date">{pick(e.shortDate, locale)}</div>
                <div className="event-row-name">{pick(e.name, locale).replace("\n", " ")}</div>
                <div className="event-row-who">{pick(e.artist, locale)}</div>
                <div className="event-row-cta">{pick(s.cta, locale)}</div>
              </Link>
            );
          })}
        </section>
      );

    case "amenities":
      return (
        <section className="amen" id={s.id}>
          <div className="amen-h rv">{pick(s.heading, locale)}</div>
          <div className="amen-grid rv d1">
            {s.items.map((it) => (
              <div className="amen-item" key={it.icon}>
                <AmenityIcon id={it.icon} />
                <div className="amen-n">{pick(it.name, locale)}</div>
                <div className="amen-d">{pick(it.desc, locale)}</div>
              </div>
            ))}
          </div>
        </section>
      );

    case "location":
      return (
        <section className="location" id={s.id}>
          <div className="loc-map">
            <div className="loc-map-bg" />
            <div className="loc-dim" />
            <div className="loc-pin-wrap"><div className="loc-dot" /><div className="loc-ring" /></div>
            <div className="loc-label-tag"><span>{pick(s.label, locale)}</span></div>
          </div>
          <div className="loc-info rv">
            <div className="loc-h"><Rich l={s.heading} locale={locale} /></div>
            <div className="loc-items">
              {s.rows.map((r) => (
                <div className="loc-row" key={r.label.en}>
                  <div className="loc-bar" />
                  <div>
                    <div className="loc-lbl">{pick(r.label, locale)}</div>
                    <div className="loc-val">{pick(r.value, locale).split("\n").map((line, i) => (
                      <span key={i}>{i > 0 && <br />}{line.includes("@") ? <a href={`mailto:${line}`}>{line}</a> : line}</span>
                    ))}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="faq" id={s.id} style={s.noTopBorder ? { borderTop: "none", paddingTop: 0 } : undefined}>
          <div className="faq-wrap">
            <div className="faq-h rv">{pick(s.heading, locale)}</div>
            <FaqList
              openFirst={s.openFirst}
              items={s.faqIds.map((id) => ({ id, q: pick(registry.faqs[id].q, locale), a: pick(registry.faqs[id].a, locale) }))}
            />
            {s.more && <div style={{ textAlign: "center", marginTop: 36 }}><CtaA link={s.more} locale={locale} className="pkg-more" /></div>}
          </div>
        </section>
      );

    case "cta":
      return (
        <section className="cta" id={s.id}>
          <div className="cta-pre rv">{pick(s.pre, locale)}</div>
          <div className="cta-h rv d1"><Rich l={s.heading} locale={locale} /></div>
          <p className="cta-body rv d2">{pick(s.body, locale)}</p>
          <div className="cta-row rv d3">
            <CtaButton link={s.primary} locale={locale} />
            <CtaA link={s.secondary} locale={locale} className="pkg-more" />
          </div>
        </section>
      );

    case "subhero":
      return (
        <section className="subhero" id={s.id}>
          <div className="subhero-bg" style={bg(s.media)} />
          <div className="subhero-dim" />
          <div className="subhero-text rv">
            <div className="subhero-kicker">{pick(s.kicker, locale)}</div>
            <h1 className="subhero-h"><Rich l={s.heading} locale={locale} /></h1>
            <div className="subhero-sub">{pick(s.sub, locale)}</div>
          </div>
        </section>
      );

    case "prose":
      return (
        <section className="prose rv" id={s.id}>
          <div className="prose-kicker">{pick(s.kicker, locale)}</div>
          <h2 className="prose-h"><Rich l={s.heading} locale={locale} /></h2>
          {s.paragraphs.map((p, i) => <p key={i}><Rich l={p} locale={locale} /></p>)}
        </section>
      );

    case "splitProse":
      return (
        <section className={`split-prose${s.flip ? " flip" : ""}`} id={s.id}>
          <div className="split-prose-img"><div className="split-prose-img-inner" style={bg(s.media)} /></div>
          <div className="split-prose-copy rv">
            <div className="split-prose-num">{pick(s.num, locale)}</div>
            <h3 className="split-prose-h"><Rich l={s.heading} locale={locale} /></h3>
            {s.paragraphs.map((p, i) => <p className="split-prose-p" key={i}><Rich l={p} locale={locale} /></p>)}
            {s.link && (
              <p className="split-prose-p" style={{ marginTop: 8 }}>
                <Link href={hrefPath(s.link.href)} className="split-prose-link">{pick(s.link.label, locale)}</Link>
              </p>
            )}
          </div>
        </section>
      );

    case "specs":
      return (
        <section className="specs" id={s.id}>
          <div className="specs-h rv">{pick(s.heading, locale)}</div>
          <div className="specs-sub rv d1">{pick(s.sub, locale)}</div>
          <div className="specs-grid rv d2">
            {s.items.map((it) => (
              <div className="spec" key={it.n + it.label.en}>
                <div className="spec-n">{it.n}{it.small && <small>{it.small}</small>}</div>
                <div className="spec-lbl"><Rich l={it.label} locale={locale} /></div>
              </div>
            ))}
          </div>
        </section>
      );

    case "included":
      return (
        <section className="incl" id={s.id}>
          <div className="incl-h rv">{pick(s.heading, locale)}</div>
          <div className="incl-sub rv d1">{pick(s.sub, locale)}</div>
          <div className="incl-grid rv d2">
            {s.rows.map((r) => (
              <div className="incl-row" key={r.label.en}>
                <div className="incl-lbl">{pick(r.label, locale)}</div>
                <div className="incl-val">{pick(r.value, locale)}</div>
              </div>
            ))}
          </div>
        </section>
      );

    case "tariff":
      return (
        <section className="tariff" id={s.id}>
          <div className="tariff-h rv">{pick(s.heading, locale)}</div>
          <div className="tariff-sub rv d1">{pick(s.sub, locale)}</div>
          <div className="tariff-grid rv d2">
            {s.cards.map((c) => (
              <div className="tariff-card" key={c.name.en}>
                <div className="tariff-name">{pick(c.name, locale)}</div>
                <div className="tariff-price"><small>AED</small>{c.price}</div>
                <div className="tariff-desc">{pick(c.desc, locale)}</div>
                <div className="tariff-cap">{pick(c.cap, locale)}</div>
              </div>
            ))}
          </div>
          {s.note && (
            <div className="form-meta" style={{ marginTop: 36 }}>
              {pick(s.note.before, locale)}{" "}
              <Link href={hrefPath(s.note.href)} style={{ borderBottom: "1px solid", color: "#1a1a1a" }}>{pick(s.note.linkLabel, locale)}</Link>{" "}
              {pick(s.note.after, locale)}
            </div>
          )}
        </section>
      );

    case "contactStrip":
      return (
        <section className="contact-strip" id={s.id}>
          <div className="contact-grid">
            {s.cells.map((c) => (
              <div className="contact-cell" key={c.label.en}>
                <h6>{pick(c.label, locale)}</h6>
                {c.href ? <a href={c.href}>{pick(c.value, locale)}</a> : <p><Rich l={c.value} locale={locale} /></p>}
              </div>
            ))}
          </div>
        </section>
      );

    case "contactForm": {
      const ar = locale === "ar";
      const labels = {
        first: ar ? "الاسم الأول" : "First Name", last: ar ? "اسم العائلة" : "Last Name",
        email: ar ? "البريد الإلكتروني" : "Email", phone: ar ? "الهاتف" : "Phone",
        reason: ar ? "سبب التواصل" : "Reason for Writing", country: ar ? "بلد الإقامة" : "Country of Residence",
        message: ar ? "الرسالة" : "Message",
        messagePlaceholder: ar ? "أخبرنا بما في ذهنك — التاريخ، حجم المجموعة، أي تفضيلات." : "Tell us what you have in mind — date, group size, any preferences.",
        consent: ar ? "أوافق على التواصل معي بخصوص استفساري." : "I agree to be contacted about my enquiry.",
        newsletter: ar ? "أرسلوا لي نشرة نوا الشهرية." : "Send me NOA's monthly newsletter.",
        send: ar ? "إرسال الرسالة" : "Send Message",
        urgent: ar ? "للاستفسارات العاجلة حول الحجوزات يُرجى الاتصال مباشرة على" : "For urgent reservation queries please call",
        received: ar ? "تم استلام الرسالة — سنرد خلال يوم عمل واحد." : "Message received — we will reply within one business day.",
      };
      return (
        <section className="form-block" id={s.id}>
          <div className="form-wrap">
            <div className="form-h rv">{pick(s.heading, locale)}</div>
            <div className="form-sub rv d1">{pick(s.sub, locale)}</div>
            <ContactForm labels={labels} reasons={s.reasons.map((r) => pick(r, locale))} countries={s.countries.map((c) => pick(c, locale))} />
          </div>
        </section>
      );
    }

    case "text":
      return (
        <section className="prose rv" id={s.id} data-placeholder={s.isPlaceholder ? "legal" : undefined}>
          <h2 className="prose-h">{pick(s.heading, locale)}</h2>
          {s.paragraphs.map((p, i) => <p key={i}><Rich l={p} locale={locale} /></p>)}
        </section>
      );
  }
}
