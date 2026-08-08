import { test, expect, type BrowserContext } from "@playwright/test";
import { db } from "./db";
import { loginAs, SEEDED_CUSTOMER } from "./helpers";

// The cookie's JSON shape is always {"state":{"productIds":[...]},"version":0}
// — the *key* "productIds" is present even when the array is empty, so a
// plain substring match can't tell "cleared" from "never had anything."
async function guestWishlistProductIds(context: BrowserContext): Promise<string[]> {
  const cookies = await context.cookies();
  const cookie = cookies.find((c) => c.name === "jhunu-wishlist");
  if (!cookie) return [];
  const parsed = JSON.parse(decodeURIComponent(cookie.value));
  return parsed.state?.productIds ?? [];
}

test.describe("login → wishlist merge", () => {
  test.afterEach(async () => {
    // Isolation: don't let this test's data leak into any other spec run
    // against the same seeded customer.
    const user = await db.user.findUnique({ where: { email: SEEDED_CUSTOMER.email } });
    if (user) await db.wishlistItem.deleteMany({ where: { userId: user.id } });
  });

  test("a guest's wishlist merges into the account on sign-in, then clears the local store", async ({
    page,
    context,
  }) => {
    await page.goto("/shop/heirloom-herringbone-market-tote");
    await page.getByRole("button", { name: "Add to wishlist" }).click();
    await expect(page.getByRole("button", { name: "Remove from wishlist" })).toBeVisible();

    // Confirm it's genuinely in the guest cookie store, not just visual
    // button state.
    expect(await guestWishlistProductIds(context)).toHaveLength(1);

    await loginAs(page, SEEDED_CUSTOMER);

    // loginAs lands on /account, where WishlistMergeGate (mounted in the
    // root layout) fires its merge as an un-awaited call — poll the
    // cookie on *this* page rather than immediately navigating away, since
    // a page.goto() is a full navigation that can abort an in-flight
    // fetch from the page being left. (A real user landing on /account
    // and clicking away within the same instant could hit this same
    // gap — documented in the launch-readiness notes rather than "fixed"
    // by blocking the page on the merge, which would be a worse trade-off
    // for the overwhelmingly common case.)
    await expect.poll(() => guestWishlistProductIds(context), { timeout: 10_000 }).toHaveLength(0);

    await page.goto("/account/wishlist");
    await expect(page.getByText("Heirloom Herringbone Market Tote")).toBeVisible({ timeout: 10_000 });

    const user = await db.user.findUniqueOrThrow({ where: { email: SEEDED_CUSTOMER.email } });
    const dbWishlistItem = await db.wishlistItem.findFirst({
      where: { userId: user.id, product: { slug: "heirloom-herringbone-market-tote" } },
    });
    expect(dbWishlistItem).not.toBeNull();
  });
});
