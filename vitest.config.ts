import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./tests/global-setup.ts",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
