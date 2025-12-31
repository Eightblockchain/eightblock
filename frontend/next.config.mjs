import { withContentlayer } from 'next-contentlayer';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,

  // ESLint configuration for build
  eslint: {
    ignoreDuringBuilds: false,
  },

  // TypeScript configuration for build
  typescript: {
    ignoreBuildErrors: false,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.eightblock.dev',
        pathname: '/uploads/**',
      },
    ],
  },

  // Performance optimizations
  experimental: {
    mdxRs: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Turbopack configuration (Next.js 16 default)
  turbopack: {},
};

export default withContentlayer(config);
