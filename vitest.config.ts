import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      // src/engine is pure logic and fully covered by unit/property tests.
      // src/server touches Postgres and is covered by integration tests that
      // require DATABASE_URL (see tests/server/README.md) — excluded from
      // this threshold until a CI database is wired up.
      include: ["src/engine/**/*.ts"],
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
