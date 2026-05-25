/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
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
    } else if (!dev) {
      config.devtool = 'source-map';
    }
    
    return config;
  },
};

// Import ComfyUI Bridge to trigger singleton initialization on server startup
import('./src/services/comfyBridge.js').then(() => {
  console.log('🚀 ComfyUI Bridge module loaded');
}).catch(error => {
  console.error('❌ Failed to load ComfyUI Bridge:', error);
});

export default nextConfig;