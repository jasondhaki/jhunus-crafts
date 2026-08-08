"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

// No service worker / offline-cached shell — this app has no PWA scope in
// CLAUDE.md's stack list, and a real offline experience (cached pages,
// background sync) would be a substantial addition, not a launch-week fix.
// What's addressable now: telling the customer plainly when their
// connection drops, rather than letting every subsequent action fail
// silently or with a confusing generic error (particularly mid-checkout,
// where a failed fetch could otherwise look like a declined payment).
//
// useSyncExternalStore, not useState+useEffect: navigator.onLine is exactly
// the "external mutable source" this hook exists for, and it sidesteps the
// state-in-effect anti-pattern (plus gives a real, mismatch-free SSR value
// via getServerSnapshot instead of an effect racing after first paint).
function subscribe(callback: () => void) {
  window.addEventListener("offline", callback);
  window.addEventListener("online", callback);
  return () => {
    window.removeEventListener("offline", callback);
    window.removeEventListener("online", callback);
  };
}

function getSnapshot() {
  return !navigator.onLine;
}

function getServerSnapshot() {
  return false;
}

export function OfflineBanner() {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-bark px-4 py-2 text-center text-sm font-medium text-cream"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      You&rsquo;re offline. Some pages and actions won&rsquo;t work until your
      connection is back.
    </div>
  );
}
