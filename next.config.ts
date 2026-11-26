import type { NextConfig } from "next";

// Basic security headers. (A strict Content-Security-Policy is deliberately not set: Razorpay Checkout
// loads scripts and frames from several of its own domains, so a CSP needs careful testing per environment.)
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // One official address: send www.poorvithamobiles.com to poorvithamobiles.com so search engines see a single site.
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host" as const, value: "www.poorvithamobiles.com" }], destination: "https://poorvithamobiles.com/:path*", permanent: true }];
  },
  async headers() {
    // Product photos and the logo rarely change: let browsers and the CDN keep them for a week.
    const longCache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/products/:path*", headers: longCache },
      { source: "/brand/:path*", headers: longCache },
    ];
  },
};

export default nextConfig;
