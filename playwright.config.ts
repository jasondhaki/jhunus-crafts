import { defineConfig, devices } from "@playwright/test";
import { E2E_STRIPE_WEBHOOK_SECRET } from "./e2e/helpers";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

// A dedicated port (not 3000) so this never collides with a `npm run dev`
// instance already running locally, and so CI can spin up a clean server
// per run without guessing whether something else already owns 3000.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // Merged into the spawned dev server's environment (never written to
    // .env.local): a real webhook secret so the signature-verification
    // spec can sign requests the server actually accepts, and a
    // syntactically-valid-but-fake Stripe secret key so getStripe() can
    // construct a client (real API calls with it still fail — there's no
    // real Stripe test-mode account wired into this environment, which is
    // the actual boundary documented in e2e/README.md).
    env: {
      // .env.local's AUTH_URL is "http://localhost:3000" (the default dev
      // port) — NextAuth uses it to build redirect targets, so left
      // unoverridden here, a credentials sign-in on port 3100 redirects
      // the browser to port 3000, which nothing is listening on
      // (ERR_CONNECTION_REFUSED). Found by actually running the login
      // flow, not by inspection.
      AUTH_URL: BASE_URL,
      STRIPE_WEBHOOK_SECRET: E2E_STRIPE_WEBHOOK_SECRET,
      STRIPE_SECRET_KEY: "sk_test_e2e_placeholder_not_real",
      // Signature generation (src/lib/cloudinary.ts) is a pure local HMAC
      // computation — no network call — so these fake-but-valid-shaped
      // values let getUploadSignatureAction() succeed. The actual upload
      // request to Cloudinary's API is intercepted and mocked in the
      // admin-product spec, since these credentials don't correspond to a
      // real account.
      CLOUDINARY_CLOUD_NAME: "e2e-test-cloud",
      CLOUDINARY_API_KEY: "123456789012345",
      CLOUDINARY_API_SECRET: "e2e_test_api_secret_not_real",
    },
  },
});
