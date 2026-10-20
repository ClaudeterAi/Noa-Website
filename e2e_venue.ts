import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./src/db/client";
import { seed } from "./src/db/seed";
import { saveVenue } from "./src/server/admin/actions";
import { VENUE_DEFAULTS } from "./src/lib/venue";
(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" }); await seed({ onlyIfEmpty: true });
  const pier = process.argv[2];
  const r = await saveVenue({ email: "e2e@noa-dubai.com", role: "owner" }, { ...VENUE_DEFAULTS, pier: { en: pier, ar: pier } });
  console.log("saved", pier, r.ok); await pool.end();
})();
