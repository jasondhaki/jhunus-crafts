import { beforeEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit within the window", () => {
    const key = `test-${crypto.randomUUID()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60_000).success).toBe(true);
    }
  });

  it("rejects the request once the limit is exceeded within the window", () => {
    const key = `test-${crypto.randomUUID()}`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    const third = rateLimit(key, 2, 60_000);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("tracks separate keys independently", () => {
    const keyA = `a-${crypto.randomUUID()}`;
    const keyB = `b-${crypto.randomUUID()}`;
    rateLimit(keyA, 1, 60_000);
    expect(rateLimit(keyA, 1, 60_000).success).toBe(false);
    expect(rateLimit(keyB, 1, 60_000).success).toBe(true);
  });

  it("resets the count once the window has elapsed", () => {
    vi.useFakeTimers();
    const key = `reset-${crypto.randomUUID()}`;
    try {
      rateLimit(key, 1, 1000);
      expect(rateLimit(key, 1, 1000).success).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(rateLimit(key, 1, 1000).success).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
