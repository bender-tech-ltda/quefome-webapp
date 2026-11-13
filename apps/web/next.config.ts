import type { NextConfig } from "next";

/**
 * The browser always talks to same-origin `/api/*` (first-party cookies, no CORS). It is proxied at
 * RUNTIME (default target: the real API on :4020; `pnpm dev:mock` points it at the mock on :4010)
 * by src/app/api/[...path]/route.ts — NOT with `rewrites()`, whose destination is frozen into
 * .next/routes-manifest.json at build time (verified: one image could not be promoted across environments).
 */

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@quefome/domain", "@quefome/contract"],
  async redirects() {
    return [
      // old admin routes (legacy port) -> MVP routes
      { source: "/admin/orders/fulfillment", destination: "/admin", permanent: false },
      { source: "/admin/orders", destination: "/admin/historico", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
