import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Loaded straight from node_modules at runtime instead of being bundled
  // (used by the Excel export route).
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
