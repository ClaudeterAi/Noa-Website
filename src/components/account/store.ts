"use client";

import { useSyncExternalStore } from "react";
import type { Me } from "@/components/booking/GuestSignIn";

/**
 * One signed-in state for the whole page: the nav icon, the phone menu card, the sign-in dialog and the account page
 * all read it, and the dialog writes it after a successful sign-in. /api/guest/me is fetched once per page load.
 */
export type GuestMe = Me & { authEnabled?: boolean };
type State = { me: GuestMe | null; dialog: null | "manual" | "auto" };

let state: State = { me: null, dialog: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; emit(); };

let loading: Promise<void> | null = null;
export function loadMe(force = false): Promise<void> {
  if (loading && !force) return loading;
  loading = fetch("/api/guest/me", { cache: "no-store" }).then((r) => r.json()).then((me: GuestMe) => set({ me })).catch(() => set({ me: { signedIn: false, authEnabled: false } }));
  return loading;
}
export const setMe = (me: GuestMe) => set({ me });
export const openSignIn = (how: "manual" | "auto" = "manual") => set({ dialog: how });
export const closeSignIn = () => set({ dialog: null });
export async function signOut() { await fetch("/api/guest/signout", { method: "POST" }).catch(() => undefined); set({ me: { signedIn: false, authEnabled: state.me?.authEnabled } }); }

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const SERVER: State = { me: null, dialog: null };
export function useGuest(): State { return useSyncExternalStore(subscribe, () => state, () => SERVER); }

/** "Lakshay Mehra" → "LM"; falls back to the first letter of the email. */
export function initials(me: GuestMe | null): string {
  const n = me?.guest?.name?.trim();
  if (n) return n.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (me?.guest?.email?.[0] ?? "").toUpperCase();
}
