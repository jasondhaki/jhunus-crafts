import type { StateStorage } from "zustand/middleware";

// 30 days, matches the "persisted to a cookie ... max-age 30 days" spec.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; samesite=lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=; max-age=0; path=/; samesite=lax`;
}

// Zustand `persist` storage adapter backed by a plain cookie instead of
// localStorage. Guarded against `document` being undefined so it's safe to
// import from a module that also gets evaluated during SSR/tests.
export const cookieStorage: StateStorage = {
  getItem: (name) => readCookie(name),
  setItem: (name, value) => writeCookie(name, value),
  removeItem: (name) => deleteCookie(name),
};
