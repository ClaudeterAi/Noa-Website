import { notFound } from "next/navigation";
import { guard, Denied } from "../../_guard";
import { getEvent } from "@/server/events/repo";
import { listInventory } from "@/server/admin/actions";
import EventForm from "../EventForm";

export default async function EventEdit({ params }: { params: Promise<{ id: string }> }) {
  const g = await guard("editor"); if (g.denied) return <Denied />;
  const { id } = await params;
  const event = id === "new" ? null : await getEvent(id);
  if (id !== "new" && !event) notFound();
  const { types } = await listInventory();
  return (
    <main className="ad-main">
      <h1>{event ? event.titleEn : "New event"} {event && <span className={`pill ${event.status === "published" ? "ok" : "muted"}`}>{event.status}</span>}</h1>
      <EventForm event={event} seatTypes={types.map((t) => ({ id: t.id, name: t.nameEn }))} />
    </main>
  );
}
