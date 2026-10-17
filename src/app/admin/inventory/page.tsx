import { guard, Denied } from "../_guard";
import { listInventory } from "@/server/admin/actions";
import { PriceCell, UnitActiveToggle, UnitVipToggle } from "../ui";

export default async function Inventory() {
  const g = await guard(); if (g.denied) return <Denied />;
  const { types, units } = await listInventory();
  const edit = g.session.role !== "frontdesk";
  return (
    <main className="ad-main">
      <h1>Inventory & pricing</h1>
      <p className="note">Prices in AED, whole dirhams. Changes apply to new holds immediately; existing holds and bookings keep their price.</p>
      <table><thead><tr><th>Unit type</th><th>Tier</th><th>Pax</th><th>Morning</th><th>Afternoon</th><th>Per person</th><th>Units</th></tr></thead>
        <tbody>{types.map((t) => (
          <tr key={t.id}><td>{t.nameEn}<br /><span className="note">{t.nameAr}</span></td><td>{t.tier}</td><td>{t.pax}</td>
            <td>{edit ? <PriceCell id={t.id} field="priceMorning" value={t.priceMorning} /> : t.priceMorning}</td>
            <td>{edit ? <PriceCell id={t.id} field="priceAfternoon" value={t.priceAfternoon} /> : t.priceAfternoon}</td>
            <td>{t.perPerson ? "yes" : "no"}</td><td>{units.filter((u) => u.unitTypeId === t.id).length}</td></tr>
        ))}</tbody></table>
      <h2>Units</h2>
      <table><thead><tr><th>Unit</th><th>Type</th><th>Deck</th><th>Members priority</th><th>Active</th></tr></thead>
        <tbody>{units.map((u) => (
          <tr key={u.id}><td>{u.label} <span className="note">{u.id}</span></td><td>{u.unitTypeId}</td><td>{u.deck}</td>
            <td>{edit ? <UnitVipToggle id={u.id} on={u.vipPriority} /> : (u.vipPriority ? "on" : "off")}</td>
            <td>{edit ? <UnitActiveToggle id={u.id} on={u.active} /> : (u.active ? "yes" : "no")}</td></tr>
        ))}</tbody></table>
    </main>
  );
}
