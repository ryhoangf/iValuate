import type { NextConfig } from "next";

/** Proxy API trong dev: fetch('/api/...') tới Express (mặc định cổng 5000). */
const backendOrigin = (process.env.BACKEND_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
