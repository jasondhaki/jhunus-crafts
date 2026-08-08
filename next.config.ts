import type { NextConfig } from "next";

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
};

export default nextConfig;
