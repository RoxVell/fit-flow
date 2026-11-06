import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let database: NeonHttpDatabase<typeof schema> | undefined;

/** Local-only use and builds never need to construct a database client. */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!database) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Sync database is not configured");
    database = drizzle(neon(url), { schema });
  }
  return database;
}
