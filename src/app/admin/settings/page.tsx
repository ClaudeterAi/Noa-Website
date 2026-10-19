import { guard, Denied } from "../_guard";
import { listSettings } from "@/server/admin/actions";
import { SettingField } from "../ui";

export default async function Settings() {
  const g = await guard("owner"); if (g.denied) return <Denied />;
  const s = await listSettings();
  return (
    <main className="ad-main">
      <h1>Settings</h1>
      <p className="note">hold_minutes: how long a tapped seat is held (cinema-style) · max_holds_per_cart: seats one guest can hold at once · hold_extension_minutes: extra time granted once at the payment step · vat_rate: 0.05 = 5% · vip_release_hours: how long before a session members-priority seats open to everyone · tier_rules: thresholds for preferred / vip · ops_email: where staff alerts go (new bookings, call-back requests) · shuttle_alert_hours: how long before arrival the shuttle message is sent.</p>
      <div className="cards">
        <SettingField k="hold_minutes" value={s.hold_minutes ?? 5} kind="int" />
        <SettingField k="hold_extension_minutes" value={s.hold_extension_minutes ?? 3} kind="int" />
        <SettingField k="vat_rate" value={s.vat_rate ?? 0.05} kind="rate" />
        <SettingField k="vip_release_hours" value={s.vip_release_hours ?? 24} kind="int" />
        <SettingField k="max_holds_per_cart" value={s.max_holds_per_cart ?? 6} kind="int" />
        <SettingField k="ops_email" value={s.ops_email ?? "hello@noa-dubai.com"} kind="rate" />
        <SettingField k="shuttle_alert_hours" value={s.shuttle_alert_hours ?? 2} kind="int" />
      </div>
      <SettingField k="tier_rules" value={s.tier_rules ?? { preferred: { visits12m: 2, minUnitTier: 4 }, vip: { lifetimeSpend: 25000, minUnitTier: 6 } }} kind="json" />
    </main>
  );
}
