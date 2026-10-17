import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client";

migrate(db, { migrationsFolder: "./drizzle" })
  .then(() => { console.log("migrations applied"); return pool.end(); })
  .catch((e) => { console.error(e); process.exit(1); });
