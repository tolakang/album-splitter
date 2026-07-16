import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    // If API URL is relative (starts with /), proxy through Next.js
    if (apiBase && apiBase.startsWith('/')) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_URL || 'http://backend:3001'}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
