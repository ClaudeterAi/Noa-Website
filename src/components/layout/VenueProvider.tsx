"use client";

import type { ReactNode } from "react";
import { setVenueSnapshot, type Venue } from "@/lib/venue";

/** Hands the server-loaded venue facts to the browser before any child renders, so client copy matches server copy. */
export default function VenueProvider({ venue, children }: { venue: Venue; children: ReactNode }) {
  setVenueSnapshot(venue);
  return <>{children}</>;
}
