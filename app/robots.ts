import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow: [
          '/api/',
          '/admin',
          '/dashboard',
          '/settings',
          '/my-bookings',
          '/history',
          '/favorites',
          '/editor',
          '/studio',
          '/onboarding',
          '/designer/bookings',
          '/designer/dashboard',
          '/designer/pricing',
          '/contractor/bookings',
          '/contractor/dashboard',
        ],
      },
    ],
    sitemap: 'https://removation.ai/sitemap.xml',
  };
}
