import { describe, expect, it } from "vitest";
import { productFormSchema, toProductData } from "./product-schema";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Heirloom Herringbone Tote",
    slug: "Heirloom Herringbone Tote", // deliberately unslugified — the schema transforms it
    description: "A handwoven jute tote.",
    price: "48.00",
    compareAtPrice: "",
    stock: "14",
    dimensions: "",
    materials: "100% Jute",
    weave: "",
    color: "",
    categoryId: "cat_1",
    isFeatured: undefined,
    isActive: "on",
    images: ["https://res.cloudinary.com/demo/image/upload/v1/a.jpg"],
    ...overrides,
  };
}

describe("productFormSchema", () => {
  it("slugifies the slug field on parse", () => {
    const result = productFormSchema.parse(baseInput());
    expect(result.slug).toBe("heirloom-herringbone-tote");
  });

  it("rejects a slug that has no letters or numbers even after slugifying", () => {
    const result = productFormSchema.safeParse(baseInput({ slug: "???" }));
    expect(result.success).toBe(false);
  });

  it("treats an empty compareAtPrice as absent rather than 0", () => {
    const result = productFormSchema.parse(baseInput({ compareAtPrice: "" }));
    expect(result.compareAtPrice).toBeUndefined();
  });

  it("rejects a non-positive price", () => {
    const result = productFormSchema.safeParse(baseInput({ price: "0" }));
    expect(result.success).toBe(false);
  });

  it("rejects negative stock", () => {
    const result = productFormSchema.safeParse(baseInput({ stock: "-1" }));
    expect(result.success).toBe(false);
  });

  it("maps checkbox 'on' to true and a missing value to false", () => {
    const checked = productFormSchema.parse(baseInput({ isFeatured: "on" }));
    const unchecked = productFormSchema.parse(baseInput({ isFeatured: undefined }));
    expect(checked.isFeatured).toBe(true);
    expect(unchecked.isFeatured).toBe(false);
  });

  it("requires at least one image", () => {
    const result = productFormSchema.safeParse(baseInput({ images: [] }));
    expect(result.success).toBe(false);
  });
});

describe("toProductData", () => {
  it("converts the dollar price to integer cents", () => {
    const input = productFormSchema.parse(baseInput({ price: "48.00" }));
    expect(toProductData(input).priceCents).toBe(4800);
  });

  it("converts compareAtPrice to cents when present, null when absent", () => {
    const withCompare = productFormSchema.parse(baseInput({ compareAtPrice: "68.00" }));
    const withoutCompare = productFormSchema.parse(baseInput({ compareAtPrice: "" }));
    expect(toProductData(withCompare).compareAtCents).toBe(6800);
    expect(toProductData(withoutCompare).compareAtCents).toBeNull();
  });

  it("normalizes blank optional strings to null", () => {
    const input = productFormSchema.parse(baseInput({ dimensions: "", weave: "", color: "" }));
    const data = toProductData(input);
    expect(data.dimensions).toBeNull();
    expect(data.weave).toBeNull();
    expect(data.color).toBeNull();
  });

  it("preserves a real dimensions/weave/color value", () => {
    const input = productFormSchema.parse(
      baseInput({ dimensions: '14" x 16"', weave: "Herringbone", color: "Natural" }),
    );
    const data = toProductData(input);
    expect(data.dimensions).toBe('14" x 16"');
    expect(data.weave).toBe("Herringbone");
    expect(data.color).toBe("Natural");
  });
});
