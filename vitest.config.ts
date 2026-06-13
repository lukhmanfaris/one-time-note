import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/lib/__tests__/**/*.test.ts"],
          environment: "jsdom",
        },
      },
      {
        test: {
          name: "server-unit",
          include: [
            "src/server/__tests__/auth.test.ts",
            "src/server/__tests__/validation.test.ts",
            "src/server/__tests__/auth-validation.test.ts",
            "src/server/__tests__/rate-limit.test.ts",
            "src/server/__tests__/database.test.ts",
          ],
          environment: "node",
        },
      },
      {
        test: {
          name: "server-integration",
          include: [
            "src/server/__tests__/storage.test.ts",
            "src/server/__tests__/auth-guard.test.ts",
            "src/server/__tests__/auth-routes.test.ts",
            "src/server/__tests__/notes.test.ts",
            "src/server/__tests__/integration.test.ts",
          ],
          environment: "node",
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});