import { defineConfig } from "vitest/config";
import { resolve } from "path";

/**
 * Pact consumer-contract specs run in a pure `node` environment:
 * no jsdom, no MSW setup (the Pact FFI mock server is the network layer).
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["__tests__/pact/**/*.spec.ts"],
    exclude: ["**/node_modules/**"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    pool: "forks",
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});