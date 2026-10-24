import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse bundles pdf.js and its worker; load it from node_modules at runtime instead of bundling it.
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    // Evidence uploads go through a server action; the default limit is 1 MB.
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;
