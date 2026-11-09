import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Lets the RLS tests reach your local/staging Supabase; they skip when the vars are missing.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside the Next.js server build; tests run in Node.
      "server-only": fileURLToPath(new URL("./tests/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // `npm run ai:eval` (--mode eval) runs only the live AI eval, which costs money. Never in `npm test` or CI.
    include: mode === "eval" ? ["tests/eval/**/*.eval.ts"] : ["tests/**/*.test.ts"],
    fileParallelism: mode !== "eval",
  },
}));
