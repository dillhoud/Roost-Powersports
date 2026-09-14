import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep pdfjs-dist out of the server bundle: its internal worker/module
  // resolution relies on relative paths from its own files on disk, which
  // break once webpack/turbopack rewrites those paths during bundling.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
