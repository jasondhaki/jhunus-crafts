// Playwright's test process is separate from the Next dev server it spins
// up (which auto-loads .env.local by Next's own convention) — this
// process needs its own explicit load to reach the same database
// directly for seeding/assertions/cleanup.
import { config } from "dotenv";
config({ path: ".env.local" });

export { db } from "../src/lib/db";
