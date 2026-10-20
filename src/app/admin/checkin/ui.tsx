"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkInAction } from "../actions";

export function CheckInButton({ refCode }: { refCode: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="row">
      <button disabled={pending} onClick={() => start(async () => { const r = await checkInAction(refCode); if (!r.ok) setErr(r.error); else router.refresh(); })}>{pending ? "Checking in…" : "Check in and issue wristbands"}</button>
      {err && <span className="err">{err}</span>}
    </div>
  );
}
