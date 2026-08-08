import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Next's dev server (HMR/Fast Refresh) needs 'unsafe-eval' for its own
// runtime; production never should. Everything else is identical between
// the two so a dev/prod CSP mismatch can't hide a production-only bug.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com`,
  // Tailwind/Next inject some styles inline at runtime — a stricter
  // nonce-based style-src is a further hardening step, not done here.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com",
  "font-src 'self' data:",
  // api.cloudinary.com (uploads, from the admin product form) is a
  // different host than res.cloudinary.com (image delivery, in img-src) —
  // both are needed. Found by actually running the upload flow against
  // this policy: the browser silently blocked the real upload request
  // client-side (a CSP violation, not a network failure), which
  // `page.route()`'s mock never even got a chance to intercept.
  "connect-src 'self' https://api.stripe.com https://api.cloudinary.com https://res.cloudinary.com",
  // Stripe's Payment Element renders card fields in an iframe it controls.
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // Belt-and-suspenders with the X-Frame-Options header below — modern
  // browsers prefer this CSP directive, X-Frame-Options covers older ones.
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    // Enables the forbidden()/unauthorized() functions from next/navigation,
    // used by src/lib/auth-guards.ts for role-based access control.
    authInterrupts: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Defense-in-depth against clickjacking — this storefront never
          // needs to be framed by anything, including its own origin.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Sends the full URL only to our own origin; cross-origin
          // requests (e.g. an outbound link) get just the origin, not the
          // full path/query (which could carry a session-adjacent token
          // in some flows).
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
        ],
      },
    ];
  },
};

export default nextConfig;
