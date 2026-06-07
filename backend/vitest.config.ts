import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["src/**/*.test.ts"],
          pool: "@cloudflare/vitest-pool-workers",
          wrangler: { configPath: "./wrangler.toml" },
        },
      },
    ],
  },
});