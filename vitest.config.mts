import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Lets the RLS tests reach your staging Supabase project; they skip when the vars are missing.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside the Next.js server build; tests run in Node.
      "server-only": fileURLToPath(new URL("./tests/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
