import { notFound } from "next/navigation";
import { guard, Denied } from "../../_guard";
import { getBooking } from "@/server/admin/actions";
import { RefundControls } from "../../ui";

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const g = await guard(); if (g.denied) return <Denied />;
  const { id } = await params;
  const b = await getBooking(id);
  if (!b) notFound();
  return (
    <main className="ad-main">
      <h1>{b.booking.ref} <span className={`pill ${b.booking.status === "confirmed" ? "ok" : "muted"}`}>{b.booking.status}</span>{b.booking.checkedInAt && <span className="pill ok">checked in</span>}</h1>
      <div className="cards">
        <div className="card"><div className="l">Guest</div><div>{b.guest.name}</div><div className="note">{b.guest.email}<br />{b.guest.phone}<br />tier: {b.guest.tier}{b.guest.tierManual ? " (manual)" : ""}</div></div>
        <div className="card"><div className="l">Money</div><div>Subtotal AED {b.booking.subtotal.toLocaleString("en-US")}</div><div>VAT AED {b.booking.vat.toLocaleString("en-US")}</div><div><strong>Total AED {b.booking.total.toLocaleString("en-US")}</strong></div><div className="note">{b.booking.stripePaymentIntentId ?? "no payment intent"}</div></div>
        <div className="card"><div className="l">Meta</div><div className="note">source: {b.booking.source} · locale: {b.booking.locale}<br />created {b.booking.createdAt.toISOString()}<br />{b.booking.confirmedAt && `confirmed ${b.booking.confirmedAt.toISOString()}`}</div></div>
      </div>
      <h2>Seats</h2>
      <table><thead><tr><th>Unit</th><th>Date</th><th>Session</th><th>Guests</th><th>Arrival</th><th>Price</th><th>Active</th></tr></thead>
        <tbody>{b.items.map((i) => <tr key={i.item.id}><td>{i.unitName} · {i.label}</td><td>{i.date}</td><td>{i.slot}</td><td>{i.item.guests}</td><td>{i.item.arrivalTime}</td><td>AED {i.item.price.toLocaleString("en-US")}</td><td>{i.item.active ? "yes" : "no"}</td></tr>)}</tbody></table>
      {g.session.role !== "frontdesk" && <><h2>Actions</h2><RefundControls bookingId={b.booking.id} total={b.booking.total} status={b.booking.status} /></>}
      <h2>Payments</h2>
      <table><thead><tr><th>Kind</th><th>Provider id</th><th>Amount (fils)</th><th>Status</th><th>At</th></tr></thead>
        <tbody>{b.payments.map((p) => <tr key={p.id}><td>{p.kind}</td><td className="note">{p.providerId}</td><td>{p.amount}</td><td>{p.status}</td><td className="note">{p.createdAt.toISOString()}</td></tr>)}{!b.payments.length && <tr><td colSpan={5} className="note">No payment events yet.</td></tr>}</tbody></table>
      <h2>Messages</h2>
      <table><thead><tr><th>Channel</th><th>Template</th><th>To</th><th>Status</th><th>Attempts</th><th>Error</th></tr></thead>
        <tbody>{b.notifications.map((n) => <tr key={n.id}><td>{n.channel}</td><td>{n.template}</td><td>{n.to}</td><td>{n.status}</td><td>{n.attempts}</td><td className="err">{n.error}</td></tr>)}{!b.notifications.length && <tr><td colSpan={6} className="note">None.</td></tr>}</tbody></table>
    </main>
  );
}
