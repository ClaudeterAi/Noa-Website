"use client";

import { useState, useTransition } from "react";
import { cancelAction, refundAction, retryNotificationAction, setSessionStatusAction, setTierAction, updateSettingAction, updateUnitAction, updateUnitTypeAction } from "./actions";

type R = { ok: boolean; error?: string };
function useAct() {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const run = (fn: () => Promise<R>) => start(async () => { setErr(null); const r = await fn(); if (!r.ok) setErr(r.error ?? "Failed"); });
  return { pending, err, run };
}

export function SessionToggle({ date, slot, status }: { date: string; slot: "morning" | "afternoon"; status: string }) {
  const { pending, err, run } = useAct();
  const next = status === "open" ? "closed" : "open";
  return <span className="row"><button type="button" className="ghost" disabled={pending} onClick={() => run(() => setSessionStatusAction(date, slot, next))}>{next === "closed" ? "Close" : "Reopen"}</button>{err && <span className="err">{err}</span>}</span>;
}

export function RefundControls({ bookingId, total, status }: { bookingId: string; total: number; status: string }) {
  const { pending, err, run } = useAct();
  const [amount, setAmount] = useState(total);
  if (status !== "confirmed" && status !== "pending") return null;
  return (
    <div className="row">
      {status === "confirmed" && <>
        <input type="number" min={1} max={total} value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ width: 120 }} aria-label="Refund amount (AED)" />
        <button type="button" disabled={pending} onClick={() => { if (confirm(`Refund AED ${amount.toLocaleString("en-US")} via Stripe?`)) run(() => refundAction(bookingId, amount)); }}>Refund</button>
      </>}
      <button type="button" className="ghost" disabled={pending} onClick={() => { if (confirm("Cancel this booking and free its seats? No refund is issued by this action.")) run(() => cancelAction(bookingId)); }}>Cancel booking</button>
      {err && <span className="err">{err}</span>}
    </div>
  );
}

export function TierSelect({ guestId, tier, manual }: { guestId: string; tier: string; manual: boolean }) {
  const { pending, err, run } = useAct();
  return (
    <span className="row">
      <select defaultValue={manual ? tier : "auto"} disabled={pending} onChange={(e) => run(() => setTierAction(guestId, e.target.value as "guest" | "preferred" | "vip" | "auto"))}>
        <option value="auto">auto ({tier})</option><option value="guest">guest</option><option value="preferred">preferred</option><option value="vip">vip</option>
      </select>{err && <span className="err">{err}</span>}
    </span>
  );
}

export function PriceCell({ id, field, value }: { id: string; field: "priceMorning" | "priceAfternoon"; value: number }) {
  const { pending, err, run } = useAct();
  const [v, setV] = useState(value);
  return <span className="row"><input type="number" min={0} step={50} value={v} onChange={(e) => setV(Number(e.target.value))} style={{ width: 110 }} />{v !== value && <button type="button" disabled={pending} onClick={() => run(() => updateUnitTypeAction(id, { [field]: v }))}>Save</button>}{err && <span className="err">{err}</span>}</span>;
}

export function Toggle({ on, label, onToggle }: { on: boolean; label: string; onToggle: (next: boolean) => Promise<R> }) {
  const { pending, err, run } = useAct();
  return <span className="row"><button type="button" className={on ? "" : "ghost"} disabled={pending} onClick={() => run(() => onToggle(!on))}>{label}: {on ? "on" : "off"}</button>{err && <span className="err">{err}</span>}</span>;
}
export const UnitVipToggle = ({ id, on }: { id: string; on: boolean }) => <Toggle on={on} label="Members priority" onToggle={(n) => updateUnitAction(id, { vipPriority: n })} />;
export const UnitActiveToggle = ({ id, on }: { id: string; on: boolean }) => <Toggle on={on} label="Active" onToggle={(n) => updateUnitAction(id, { active: n })} />;

export function SettingField({ k, value, kind }: { k: "hold_minutes" | "hold_extension_minutes" | "vat_rate" | "vip_release_hours" | "tier_rules"; value: unknown; kind: "int" | "rate" | "json" }) {
  const { pending, err, run } = useAct();
  const [v, setV] = useState(kind === "json" ? JSON.stringify(value, null, 2) : String(value ?? ""));
  const save = () => run(async () => {
    try { const parsed = kind === "json" ? JSON.parse(v) : Number(v); return await updateSettingAction(k, parsed); } catch (e) { return { ok: false, error: String(e) }; }
  });
  return (
    <div className="card">
      <div className="l">{k}</div>
      {kind === "json" ? <textarea value={v} onChange={(e) => setV(e.target.value)} rows={6} style={{ width: "100%", font: "inherit", fontSize: ".75rem" }} /> : <input value={v} onChange={(e) => setV(e.target.value)} />}
      <div className="row" style={{ marginTop: 8 }}><button type="button" disabled={pending} onClick={save}>Save</button>{err && <span className="err">{err}</span>}</div>
    </div>
  );
}

export function RetryButton({ id }: { id: string }) {
  const { pending, err, run } = useAct();
  return <span className="row"><button type="button" className="ghost" disabled={pending} onClick={() => run(() => retryNotificationAction(id))}>Retry</button>{err && <span className="err">{err}</span>}</span>;
}
