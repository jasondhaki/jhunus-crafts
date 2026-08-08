import { headers } from "next/headers";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Process-local — see the module-level caveat below. Cleared periodically
// so one-off callers don't accumulate forever in memory.
const buckets = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Fixed-window in-memory rate limiter.
 *
 * KNOWN LIMITATION (documented, not silently glossed over): this state
 * lives in the memory of a single serverless execution environment. On
 * Vercel, concurrent invocations can land on different instances that
 * don't share this Map, and Fluid Compute may recycle instances between
 * requests — so this does NOT enforce a hard global limit in production.
 * It's a real first line of defense against a single script hammering one
 * warm instance, not a substitute for a shared store. Before real launch
 * traffic, replace with Upstash Redis + @upstash/ratelimit (sliding
 * window, actually shared across instances) — see SECURITY.md.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanupExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/**
 * Best-effort client IP from proxy headers — works in both route handlers
 * and Server Actions (headers() is available in both). Vercel's edge
 * network sets x-forwarded-for; falls back to a shared bucket key when
 * neither header is present (e.g. local dev without a proxy in front),
 * which is strictly weaker but still rate-limits *something* rather than
 * silently no-op-ing.
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();

  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}
