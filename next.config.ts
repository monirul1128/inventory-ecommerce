import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'images.unsplash.com'],
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
