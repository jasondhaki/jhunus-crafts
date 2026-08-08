import { test, expect } from "@playwright/test";

test.describe("browse → filter → product → add to cart", () => {
  test("filtering the shop, opening a product, and adding it to the cart", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { name: "The Full Collection", level: 1 })).toBeVisible();

    const initialCount = await page.getByRole("link", { name: /Heirloom Herringbone/ }).count();
    expect(initialCount).toBeGreaterThan(0);

    // Filter down to a single category and confirm the URL and result set
    // both reflect it — this is the URL-driven filter architecture
    // (useShopFilters), not client-only state. The navigation is wrapped
    // in startTransition, so the checkbox's checked state (itself derived
    // from the URL) lags the click slightly — wait for the URL, not the
    // checkbox, as the source of truth.
    await page.getByRole("checkbox", { name: "Tote Bags" }).click();
    await expect(page).toHaveURL(/category=tote-bags/);
    await expect(page.getByRole("checkbox", { name: "Tote Bags" })).toBeChecked();
    await expect(page.getByRole("link", { name: /Sundrift Flat-Braid/ })).toBeVisible();

    // Open a product from the filtered results.
    await page.getByRole("link", { name: /Heirloom Herringbone Market Tote/ }).click();
    await expect(page).toHaveURL(/\/shop\/heirloom-herringbone-market-tote/);
    await expect(page.getByRole("heading", { name: "Heirloom Herringbone Market Tote" })).toBeVisible();

    // Add to cart and confirm the drawer opens with the right line item —
    // this is the optimistic cart store + drawer round trip, not just a
    // click registering.
    await page.getByRole("button", { name: "Add to Cart" }).click();
    const drawer = page.getByRole("dialog", { name: "Shopping cart" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Heirloom Herringbone Market Tote")).toBeVisible();

    // Header badge reflects the cart count once hydrated.
    await expect(page.getByRole("button", { name: /Cart, 1 item/ })).toBeVisible();
  });
});
