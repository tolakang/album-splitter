import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // NEXT_PUBLIC_API_URL is used by the frontend to determine if we need internal rewrites
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    // If API URL is relative (starts with /), proxy through Next.js server
    // This is used in deployment; the backend is accessed via Traefik/reverse proxy
    if (apiBase && apiBase.startsWith('/')) {
      return [
        {
          source: '/api/:path*',
          // BACKEND_URL is only used at server-side rewrite time (internal container communication)
          // For local dev: http://backend:3001 (Docker Compose service name)
          // For production: same as above (Traefik routes external requests)
          destination: `${process.env.BACKEND_URL || 'http://backend:3001'}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
