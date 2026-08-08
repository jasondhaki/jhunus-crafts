import { test, expect } from "@playwright/test";

// Keyboard-only pass through the purchase flow requested in the launch
// audit: browse -> product -> add to cart -> cart drawer focus trap ->
// checkout, driven entirely by Tab/Shift+Tab/Enter/Escape, never .click().
// Verifies the useFocusTrap hook (src/lib/use-focus-trap.ts) actually
// behaves correctly in a real browser, not just by reading the code.

test.describe("keyboard-only purchase flow", () => {
  test("navigating from the shop to checkout using only the keyboard", async ({ page }) => {
    await page.goto("/shop/heirloom-herringbone-market-tote");
    await expect(
      page.getByRole("heading", { name: "Heirloom Herringbone Market Tote" }),
    ).toBeVisible();

    // Tab to the Add to Cart button and activate it with the keyboard
    // (not .click()) so focus-on-activation semantics are exercised too.
    const addToCart = page.getByRole("button", { name: "Add to Cart" });
    await addToCart.focus();
    await expect(addToCart).toBeFocused();
    await page.keyboard.press("Enter");

    // The drawer opens and useFocusTrap should move focus into it on the
    // next animation frame — poll since that happens via
    // requestAnimationFrame, not synchronously with the click.
    const drawer = page.getByRole("dialog", { name: "Shopping cart" });
    await expect(drawer).toBeVisible();
    const closeCartButton = page.getByRole("button", { name: "Close cart" });
    await expect(closeCartButton).toBeFocused({ timeout: 2000 });

    // Shift+Tab from the first focusable element should wrap to the last
    // one in the dialog ("Continue Shopping"), not escape into the page
    // behind it.
    const continueShoppingButton = drawer.getByRole("button", { name: "Continue Shopping" });
    await page.keyboard.press("Shift+Tab");
    await expect(continueShoppingButton).toBeFocused();

    // Tabbing forward from that last element should wrap back to the
    // first (Close cart) rather than leaving the dialog.
    await page.keyboard.press("Tab");
    await expect(closeCartButton).toBeFocused();

    // Escape closes the drawer and restores focus to whatever opened it.
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();
    await expect(addToCart).toBeFocused();

    // Re-open via keyboard and Tab through to the Checkout link this time.
    await page.keyboard.press("Enter");
    await expect(drawer).toBeVisible();
    await expect(closeCartButton).toBeFocused({ timeout: 2000 });

    const checkoutLink = drawer.getByRole("link", { name: "Checkout" });
    // Tab forward until the Checkout link is focused, bounded so a broken
    // trap (or a missing element) fails fast instead of hanging.
    for (let i = 0; i < 15; i++) {
      if (await checkoutLink.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(checkoutLink).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL("/checkout");
    // The drawer's own onClick={close} on this link (see cart-drawer.tsx)
    // must have closed it, or its backdrop would block the checkout page.
    await expect(drawer).not.toBeVisible();

    // The checkout form's first field should be keyboard-reachable too.
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  });
});
