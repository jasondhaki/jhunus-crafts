import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mirrors tsconfig.json's "@/*" path so tests can use the same import
// aliases as application code — nothing under src/ previously imported via
// "@/..." from a test file, so this was never needed until now.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // e2e/ holds Playwright specs (also named *.spec.ts) — without this,
    // vitest's default include pattern picks them up too and fails on
    // Playwright's test.describe(), which vitest doesn't understand.
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
});
