import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";
import { mergeVenue, setVenueSnapshot, venueSnapshot, type Venue, VENUE_DEFAULTS } from "@/lib/venue";

/** Load the saved venue facts (settings key "venue"), merged over the defaults; also refreshes the render snapshot. */
export const loadVenue = cache(async (): Promise<Venue> => {
  if (!process.env.DATABASE_URL) { setVenueSnapshot(VENUE_DEFAULTS); return VENUE_DEFAULTS; }
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, "venue"));
    const v = mergeVenue(row?.value);
    setVenueSnapshot(v);
    return v;
  } catch {
    return venueSnapshot();   // a database hiccup keeps the last facts this server loaded, never blanks or reverts them
  }
});
