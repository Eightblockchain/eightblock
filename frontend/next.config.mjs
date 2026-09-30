const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api');
const adminUrl = (process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,

  // deploy.sh builds into a staging directory and swaps it in, so the live site keeps serving.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  transpilePackages: ['@eightblock/ui'],

  // Prevent webpack from bundling jsdom (used by isomorphic-dompurify on the server).
  // When bundled, jsdom cannot resolve its own browser/default-stylesheet.css at build time.
  serverExternalPackages: ['jsdom', 'isomorphic-dompurify'],

  // ESLint configuration for build
  eslint: {
    ignoreDuringBuilds: false,
  },

  // TypeScript configuration for build
  typescript: {
    ignoreBuildErrors: false,
  },

  poweredByHeader: false,

  // PM2 runs several instances; reading ISR pages from disk lets one pick up the other's re-renders.
  cacheMaxMemorySize: 0,

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(':', ''),
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.eightblock.dev',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },

  async redirects() {
    return [
      // The dashboard moved to its own app
      { source: '/admin/articles', destination: '/my-articles', permanent: true },
      { source: '/admin', destination: adminUrl, permanent: false },
      { source: '/admin/:path*', destination: `${adminUrl}/:path*`, permanent: false },
      // Wallet-era profile pages were replaced by Google accounts
      { source: '/profile/bookmarks', destination: '/bookmarks', permanent: true },
      { source: '/profile/articles', destination: '/my-articles', permanent: true },
      { source: '/profile', destination: '/settings', permanent: true },
      { source: '/articles', destination: '/writing', permanent: true },
      { source: '/profile/:path*', destination: '/about', permanent: true },
    ];
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  webpack: (config, { isServer }) => {
    // Ensure client-only code doesn't run on server
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },

  // Turbopack configuration (Next.js 16 default)
  turbopack: {},
};

export default config;
