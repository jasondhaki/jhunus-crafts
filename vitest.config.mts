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
});
