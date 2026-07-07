import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma out of the server bundle so its query engine resolves correctly
  // when running via `next start` under PM2.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
