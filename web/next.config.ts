import type { NextConfig } from "next";
import path from "node:path";

const apiOrigin = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  agentRules: false,
  outputFileTracingRoot: path.resolve(import.meta.dirname, ".."),
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
