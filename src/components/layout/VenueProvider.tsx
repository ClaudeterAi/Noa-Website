"use client";

import type { ReactNode } from "react";
import { setVenueSnapshot, type Venue } from "@/lib/venue";
import { applyContentOverrides, type ContentOverrides } from "@/lib/content";

/** Hands the server-loaded venue facts and page edits to the browser before any child renders, so client copy matches server copy. */
export default function VenueProvider({ venue, content, children }: { venue: Venue; content?: ContentOverrides; children: ReactNode }) {
  setVenueSnapshot(venue);
  if (content) applyContentOverrides(content);
  return <>{children}</>;
}
