import { describe, expect, it } from "vitest";
import { formatPrice, fromCents, toCents } from "./money";

describe("formatPrice", () => {
  it("formats zero", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("formats a typical price", () => {
    expect(formatPrice(1999)).toBe("$19.99");
  });

  it("formats large values with thousands separators", () => {
    expect(formatPrice(123456789)).toBe("$1,234,567.89");
  });

  it("throws on non-integer input", () => {
    expect(() => formatPrice(19.99)).toThrow();
  });
});

describe("toCents", () => {
  it("converts zero", () => {
    expect(toCents(0)).toBe(0);
  });

  it("rounds away sub-cent floating point error", () => {
    // 19.99 * 100 is 1998.9999999999998 in IEEE 754 float math.
    expect(toCents(19.99)).toBe(1999);
  });

  it("rounds half-cent values consistently", () => {
    expect(toCents(10.005)).toBe(1001);
  });

  it("handles large values", () => {
    expect(toCents(1234567.89)).toBe(123456789);
  });
});

describe("fromCents", () => {
  it("converts zero", () => {
    expect(fromCents(0)).toBe(0);
  });

  it("converts a typical value", () => {
    expect(fromCents(1999)).toBe(19.99);
  });

  it("converts large values", () => {
    expect(fromCents(123456789)).toBe(1234567.89);
  });

  it("throws on non-integer input", () => {
    expect(() => fromCents(19.99)).toThrow();
  });
});
