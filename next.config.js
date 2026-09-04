/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Compress responses
  compress: true,

  // Optimize images (Next.js built-in)
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'wwuilxbkoxajvgnbhrto.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  // Reduce server-side logging noise in production
  logging: {
    fetches: { fullUrl: false },
  },

  // Experimental: speed up server component rendering
  experimental: {
    optimizePackageImports: ['recharts', '@supabase/supabase-js', 'swr'],
  },

  webpack: (config) => {
    // Avoid Windows webpack cache corruption
    config.cache = false;
    return config;
  },

  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};
module.exports = withBundleAnalyzer(nextConfig);
