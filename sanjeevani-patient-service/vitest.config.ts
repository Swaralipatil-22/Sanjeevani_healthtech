import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// The dev and prod entrypoints get their configuration from `--env-file`.
// Vitest does not, so the integration suite would otherwise fall back to the
// localhost defaults and skip itself even when a database is configured.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env present - unit tests run on defaults, integration tests skip.
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // The integration suite drives one shared database; running files in
    // parallel would have them clobbering each other's fixtures.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 180_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
    },
  },
});
