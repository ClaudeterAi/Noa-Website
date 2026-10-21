import { loadContent } from "@/server/content";
import { loadVenue } from "@/server/venue";

/** Everything a render needs from the admin before it shows copy: venue facts and edited page wording. */
export async function loadSite() {
  const [venue, content] = await Promise.all([loadVenue(), loadContent()]);
  return { venue, content };
}
