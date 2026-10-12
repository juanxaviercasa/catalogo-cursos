import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/postgres",
  dialect: "postgresql",
  dbCredentials: {
    // Leave unset during local build/type-check; migrations require the Supabase URL.
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
