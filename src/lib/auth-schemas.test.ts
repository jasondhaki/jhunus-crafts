import { describe, expect, it } from "vitest";
import { credentialsSchema, registerSchema } from "./auth-schemas";

describe("credentialsSchema", () => {
  it("accepts a valid email and password", () => {
    const result = credentialsSchema.safeParse({
      email: "person@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = credentialsSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = credentialsSchema.safeParse({
      email: "person@example.com",
      password: "short1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = credentialsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-string credentials (e.g. arrays from a malformed request)", () => {
    const result = credentialsSchema.safeParse({
      email: ["a@b.com", "c@d.com"],
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration input", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("trims the name", () => {
    const result = registerSchema.safeParse({
      name: "  Jane Doe  ",
      email: "jane@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.name).toBe("Jane Doe");
  });

  it("rejects an empty name", () => {
    const result = registerSchema.safeParse({
      name: "   ",
      email: "jane@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password longer than 72 characters", () => {
    const result = registerSchema.safeParse({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "a".repeat(73),
    });
    expect(result.success).toBe(false);
  });
});
