import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Heirloom Herringbone Tote")).toBe("heirloom-herringbone-tote");
  });

  it("collapses runs of non-alphanumeric characters into one hyphen", () => {
    expect(slugify("Jute & Cotton  —  Market Bag!!")).toBe("jute-cotton-market-bag");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  --Wanderer's Tote--  ")).toBe("wanderer-s-tote");
  });

  it("returns an empty string for input with no letters or numbers", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("keeps numbers", () => {
    expect(slugify("Set of 3 Nesting Baskets")).toBe("set-of-3-nesting-baskets");
  });
});
