import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const migrationsDir = resolve(process.cwd(), "drizzle/migrations");
const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.log("No migration files found.");
  process.exit(0);
}

const sql = neon(databaseUrl);

function parseStatements(contents: string): string[] {
  return contents
    .split("--> statement-breakpoint")
    .map((chunk) => chunk.replace(/^--[^\n]*\n?/gm, "").trim())
    .filter(Boolean);
}

async function main() {
  for (const file of files) {
    const path = resolve(migrationsDir, file);
    const statements = parseStatements(readFileSync(path, "utf8"));
    console.log(`Applying ${file} (${statements.length} statements)...`);

    for (const statement of statements) {
      await sql.query(statement);
    }
  }

  console.log("Migrations applied successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
