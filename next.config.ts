import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Evidence uploads go through a server action; the default limit is 1 MB.
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;
