import type { NextConfig } from 'next'

// Bundle analyzer (enable with ANALYZE=true npm run build)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // Use a custom distDir to avoid permission issues if an old .next folder was created by a different user.
  // NOTE: distDir name is rotated when permissions get stuck from old builds.
  distDir: '.next_run4',
  reactStrictMode: true,
  poweredByHeader: false,
  generateBuildId: async () => {
    // Force new build ID to bust cache
    return `build-${Date.now()}`;
  },
  
  // Image Optimization
  images: {
    formats: ['image/webp', 'image/avif'], // Modern formats first
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.albassam-app.com',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net', // Cloudflare Images (future)
      },
    ],
  },
  
  // Minimal PWA: manifest + icons. Service worker can be added later.
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Increased from default 1mb for map/forms
    },
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://*.googleapis.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; frame-ancestors 'none';",
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
