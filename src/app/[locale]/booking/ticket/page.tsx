import { setRequestLocale } from "next-intl/server";
import { verifyTicket } from "@/server/ticket";
import { loadTicketView } from "@/server/ticket-view";

export const dynamic = "force-dynamic";

/** The guest's ticket: event, date and time, seats, QR, venue and the rules. Reached from the email, WhatsApp or the confirmation page; no sign-in. */
export default async function Ticket({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const L = locale === "ar" ? "ar" : "en";
  const ref = verifyTicket((await searchParams).t);
  const t = ref ? await loadTicketView(ref, "", L) : null;
  if (!t || t.status !== "confirmed") {
    return <main className="bk-result"><h1>{L === "ar" ? "لا توجد تذكرة" : "No ticket here"}</h1><p>{L === "ar" ? "هذا الرابط غير صالح أو الحجز غير مؤكد." : "This link is not valid or the reservation is not confirmed."}</p></main>;
  }
  const lbl = L === "ar"
    ? { date: "التاريخ", time: "الوقت", session: "الجلسة", seats: "المقاعد", guests: "الضيوف", venue: "المكان", rules: "قبل أن تأتي", ref: "رقم الحجز", show: "اعرض هذا الرمز عند مكتب الرصيف", done: "تم تسجيل الوصول", map: "الخريطة", boats: "القوارب" }
    : { date: "Date", time: "Time", session: "Session", seats: "Seats", guests: "Guests", venue: "Venue", rules: "Before you come", ref: "Reference", show: "Show this code at the pier desk", done: "Checked in", map: "Map", boats: "Boats" };
  return (
    <main className="tk" dir={L === "ar" ? "rtl" : "ltr"}>
      <article className="tk-card">
        <header className="tk-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="tk-img" src={t.image} alt="" />
          <div className="tk-head-copy">
            <div className="tk-kicker">NOA · {t.slotLabel}</div>
            <h1 className="tk-title">{t.title}</h1>
            {t.subtitle && <div className="tk-sub">{t.subtitle}</div>}
          </div>
        </header>

        <dl className="tk-facts">
          <div><dt>{lbl.date}</dt><dd>{t.dateLabel}</dd></div>
          <div><dt>{lbl.time}</dt><dd>{t.timeLabel}</dd></div>
          <div><dt>{lbl.seats}</dt><dd>{t.seats.map((s) => `${s.label} · ${s.name}`).join(", ")}</dd></div>
          <div><dt>{lbl.guests}</dt><dd>{t.totalGuests}</dd></div>
        </dl>

        <div className="tk-tear" aria-hidden="true" />

        <section className="tk-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.qrSvg} alt={`${lbl.ref} ${t.ref}`} width={200} height={200} />
          <div className="tk-ref">{t.ref}</div>
          <div className="tk-name">{t.guestName}</div>
          <div className={`tk-state${t.checkedInAt ? " done" : ""}`}>{t.checkedInAt ? lbl.done : lbl.show}</div>
        </section>

        <div className="tk-tear" aria-hidden="true" />

        <section className="tk-venue">
          <div className="tk-sec-h">{lbl.venue}</div>
          <p className="tk-venue-name">{t.venue.name}</p>
          <p>{t.venue.line}</p>
          <p className="tk-boats">{t.boarding} · {t.lastBoat}</p>
          <a className="tk-link" href={t.venue.mapUrl} target="_blank" rel="noreferrer">{lbl.map} →</a>
        </section>

        <section className="tk-rules">
          <div className="tk-sec-h">{lbl.rules}</div>
          <ul>{t.rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </section>
      </article>
    </main>
  );
}
