import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Worker bundle lean: heavy SDKs (openai, linkup, resend) live in
  // Convex actions, not in the Next server bundle.
  eslint: {
    // Never let lint fail a hackathon deploy build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

// OpenNext dev integration — only runs in `next dev`, so it is safe to call
// unconditionally at module load (it no-ops outside the dev server).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
