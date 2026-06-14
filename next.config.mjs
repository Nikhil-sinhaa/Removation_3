/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable instrumentation.ts — starts the memory watchdog on server boot
  experimental: {
  },

  // Keep heavy server-only packages out of the client bundle
  serverExternalPackages: [
    'googleapis',
    'mongoose',
    'ioredis',
    'sharp',
  ],

  images: {
    remotePatterns: [
      // Google Drive — used when STORAGE_MODE=drive
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        pathname: '/uc**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbxt.replicate.delivery',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.marble3d.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'marble3d.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/renders/:path*',
        destination: '/renders/:path*',
      },
    ];
  },
  headers: async () => {
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      bufferutil: 'commonjs bufferutil',
    });
    
    // Fix SourceMap error with unsupported URL field
    // Use 'cheap-module-source-map' for dev to avoid Turbopack issues
    if (dev && !isServer) {
      config.devtool = 'cheap-module-source-map';
    }

    // OOM Fix: Exclude large/static directories from the file watcher.
    // public/renders (582MB) and public/uploads (257MB) don't contain
    // source files — watching them causes massive inotify overhead.
    if (dev) {
      config.watchOptions = {
        ignored: [
          '**/public/renders/**',
          '**/public/uploads/**',
          '**/node_modules/**',
          '**/.next/**',
        ],
        aggregateTimeout: 300,
        poll: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;