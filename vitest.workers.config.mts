import { defineConfig } from "vitest/config";
import { cloudflarePool } from "@cloudflare/vitest-pool-workers";
import path from "path";

export default defineConfig({
  test: {
    include: [
      "src/server/__tests__/storage.test.ts",
      "src/server/__tests__/auth-guard.test.ts",
      "src/server/__tests__/auth-routes.test.ts",
      "src/server/__tests__/notes.test.ts",
      "src/server/__tests__/integration.test.ts",
    ],
    pool: cloudflarePool({
      wrangler: { configPath: "./wrangler.toml" },
    }),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});