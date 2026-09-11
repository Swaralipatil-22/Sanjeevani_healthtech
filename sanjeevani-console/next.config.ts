import type { NextConfig } from "next";

const PATIENT_SERVICE_ENDPOINT =
  process.env.PATIENT_SERVICE_INTERNAL_ENDPOINT ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,

  // Without this Turbopack walks up to the home directory looking for a lock
  // file and warns about pulling it into the build root.
  turbopack: { root: import.meta.dirname },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  /**
   * The browser never talks to the API directly. It calls `/proxy/*` on this
   * origin; middleware attaches the bearer token server-side, so the JWT stays
   * in an httpOnly cookie and out of client JavaScript.
   */
  async rewrites() {
    return [
      {
        source: "/proxy/patient-service/:path*",
        destination: `${PATIENT_SERVICE_ENDPOINT}/patient-service/:path*`,
      },
    ];
  },
};

export default nextConfig;
