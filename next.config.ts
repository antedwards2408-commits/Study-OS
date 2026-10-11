import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cache Components (PPR) is the new Next 16 default, but it requires every
  // runtime-data access (cookies/auth/per-user DB reads) to be wrapped in
  // Suspense or `use cache`. StudyOS is almost entirely personalized,
  // per-user content with little to cache across users, so the added
  // ceremony isn't worth it for this MVP - use the traditional dynamic
  // rendering model instead (see caching-without-cache-components.md).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
