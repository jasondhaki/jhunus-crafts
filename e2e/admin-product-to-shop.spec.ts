import { test, expect } from "@playwright/test";
import { db } from "./db";
import { loginAs, SEEDED_ADMIN } from "./helpers";

test.describe("admin creates a product and it appears on /shop", () => {
  test("new product flows through revalidation onto the storefront", async ({ page }) => {
    // Real Cloudinary credentials aren't available in this environment —
    // src/lib/cloudinary.ts's signature generation is a pure local HMAC
    // (no network call, works fine with the fake-but-valid env vars this
    // config injects), but the actual upload POST needs mocking since
    // there's no real account behind it.
    await page.route("https://api.cloudinary.com/v1_1/**/image/upload", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          secure_url: "https://res.cloudinary.com/e2e-test-cloud/image/upload/v1/jhunus-crafts/products/e2e-test.jpg",
        }),
      });
    });

    await loginAs(page, SEEDED_ADMIN);

    const uniqueTitle = `E2E Test Basket ${Date.now()}`;

    await page.goto("/admin/products/new");
    await page.getByLabel("Title").fill(uniqueTitle);
    // Slug should auto-populate from the title without being touched.
    await expect(page.getByLabel("Slug")).not.toHaveValue("");

    await page.getByLabel("Description").fill("Created by the Playwright E2E launch-hardening suite.");
    // exact: true — "Compare-at Price (USD)" also contains "Price (USD)"
    // as a substring.
    await page.getByLabel("Price (USD)", { exact: true }).fill("42.00");
    await page.getByLabel("Stock").fill("7");
    await page.getByLabel("Materials").fill("100% Eco-Friendly Natural Jute");
    await page.getByLabel("Category").selectOption({ label: "Storage Baskets" });

    await page.getByLabel("Upload Images").setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      // Minimal valid 1x1 PNG.
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    // The first successfully uploaded image gets a "Primary" badge.
    await expect(page.getByText("Primary")).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Create Product" }).click();

    // A successful create redirects to the edit page for the new product —
    // a cuid, never literally "new" (which also matches [a-z0-9]+ and
    // would silently pass this check while still sitting on the create
    // form with unsaved validation errors).
    await expect(page).toHaveURL(/\/admin\/products\/(?!new$)[a-z0-9]+$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: `Edit ${uniqueTitle}` })).toBeVisible();

    try {
      // The whole point of Server Actions + revalidatePath here: this
      // must be visible on the storefront immediately, no separate
      // deploy/ISR window.
      await page.goto("/shop");
      await expect(page.getByRole("link", { name: new RegExp(uniqueTitle) })).toBeVisible();
    } finally {
      await db.product.deleteMany({ where: { title: uniqueTitle } });
    }
  });
});
