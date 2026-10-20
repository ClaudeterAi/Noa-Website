import { guard, Denied } from "../_guard";
import { bookingByRef } from "@/server/admin/actions";
import { verifyTicket } from "@/server/ticket";
import { CheckInButton } from "./ui";

/** Pier desk. Opened by scanning a wristband QR (?t=token) or by typing a reference. Front desk and above. */
export default async function CheckIn({ searchParams }: { searchParams: Promise<{ t?: string; ref?: string; }> }) {
  const g = await guard(); if (g.denied) return <Denied />;
  const sp = await searchParams;
  const scanned = verifyTicket(sp.t);
  const typed = sp.ref?.trim().toUpperCase();
  const ref = scanned ?? (typed && /^NOA-[A-Z2-9]{6}$/.test(typed) ? typed : null);
  const b = ref ? await bookingByRef(ref) : null;
  const pax = b?.items.reduce((n, i) => n + (i.pax ?? 0), 0) ?? 0;
  return (
    <main className="ad-main">
      <h1>Check-in</h1>
      <form className="row" style={{ marginBottom: 20 }}>
        <input name="ref" placeholder="NOA-XXXXXX" defaultValue={typed ?? ""} autoFocus style={{ textTransform: "uppercase", letterSpacing: ".12em" }} />
        <button type="submit" className="ghost">Find</button>
        <span className="note">Scan the wristband QR with the phone camera; it opens this page with the booking loaded.</span>
      </form>
      {sp.t && !scanned && <p className="err">That QR code is not valid.</p>}
      {ref && !b && <p className="err">No booking {ref}.</p>}
      {b && (
        <section className={`checkin-card ${b.status === "confirmed" ? (b.checkedInAt ? "done" : "ready") : "blocked"}`}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 style={{ margin: 0 }}>{b.ref} <span className={`pill ${b.status === "confirmed" ? "ok" : "muted"}`}>{b.status}</span>{b.tier !== "guest" && <span className="pill">{b.tier}</span>}</h2>
            <span className="note">AED {b.total.toLocaleString("en-GB")}</span>
          </div>
          <p style={{ fontSize: "1.2rem", margin: "8px 0 2px" }}>{b.guestName}</p>
          <p className="note">{b.guestPhone}</p>
          <table style={{ margin: "12px 0" }}><thead><tr><th>Seat</th><th>Type</th><th>Date</th><th>Session</th><th>Guests</th></tr></thead>
            <tbody>{b.items.map((i, k) => <tr key={k}><td><strong>{i.label}</strong></td><td>{i.type}</td><td>{i.date}</td><td>{i.slot}</td><td>{i.pax}</td></tr>)}</tbody></table>
          <p className="note">{b.items.length} seat{b.items.length === 1 ? "" : "s"} · up to {pax} guests · issue {pax} wristband{pax === 1 ? "" : "s"}</p>
          {b.status !== "confirmed" && <p className="err">Not confirmed. Do not issue wristbands.</p>}
          {b.status === "confirmed" && b.checkedInAt && <p className="ok-text">Already checked in {b.checkedInAt.toLocaleString("en-GB", { timeZone: "Asia/Dubai" })} by {b.checkedInBy}.</p>}
          {b.status === "confirmed" && !b.checkedInAt && <CheckInButton refCode={b.ref} />}
        </section>
      )}
    </main>
  );
}
