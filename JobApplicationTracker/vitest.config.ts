import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts", "public/js/**/*.spec.js"],
    globalSetup: ["./vitest.setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 60_000,
    // All test files share one Postgres testcontainer (research.md) — run files sequentially so
    // one file's beforeEach truncation can't race another file's in-flight assertions.
    fileParallelism: false,
  },
});
