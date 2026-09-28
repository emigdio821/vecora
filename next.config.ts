import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // The PDF reads its fonts from disk at render time, out of reach of tracing.
  outputFileTracingIncludes: {
    '/reports/pdf': ['./assets/fonts/*.ttf'],
  },
  experimental: {
    serverActions: {
      // The logo upload (LOGO_MAX_BYTES, 2 MB) plus the multipart overhead.
      bodySizeLimit: '3mb',
    },
  },
}

export default nextConfig
