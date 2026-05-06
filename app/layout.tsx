import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/Providers'
import { CrispChat } from '@/components/CrispChat'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import { PWAPrompt } from '@/components/PWAPrompt'
import './globals.css'

// System font stack — Google Fonts downloads fail offline.
// CSS variables are set directly in the className below.
const fontClasses = 'font-inter font-plus-jakarta'

// Complete SEO metadata
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://removation.ai'),
  title: {
    default: 'Removation.ai - AI Interior Design & Renovation Platform',
    template: '%s | Removation.ai',
  },
  description:
    'Transform your space with AI-powered interior design. Get instant renovations, Vastu Shastra analysis, and real-time cost estimates. 400+ design styles, professional results in seconds.',
  keywords: [
    'AI interior design',
    'room renovation',
    'home design AI',
    'Vastu Shastra',
    'interior decorator',
    'home makeover',
    'renovation cost calculator',
    'AI home design',
    'virtual staging',
    'interior design app',
    'room redesign',
    'home improvement',
    'Indian interior design',
    'Vastu compliant design',
  ],
  authors: [{ name: 'Removation.ai Team' }],
  creator: 'Removation.ai',
  publisher: 'Removation.ai',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'hi_IN',
    url: 'https://removation.ai',
    siteName: 'Removation.ai',
    title: 'Removation.ai - AI Interior Design & Renovation Platform',
    description:
      'Transform your space with AI-powered interior design. Get instant renovations, Vastu Shastra analysis, and real-time cost estimates.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Removation.ai - AI Interior Design',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Removation.ai - AI Interior Design & Renovation',
    description:
      'Transform any room with AI. 400+ styles, Vastu analysis, instant cost estimates.',
    images: ['/images/og-image.png'],
    creator: '@removation_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/icons/icon-152.png', sizes: '152x152' },
      { url: '/icons/icon-192.png', sizes: '192x192' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  category: 'technology',
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

// Viewport configuration for PWA
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

// JSON-LD structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Removation.ai',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  description:
    'AI-powered interior design platform with Vastu Shastra analysis and renovation cost calculator',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '15000',
    bestRating: '5',
    worstRating: '1',
  },
  author: {
    '@type': 'Organization',
    name: 'Removation.ai',
    url: 'https://removation.ai',
  },
  featureList: [
    'AI Interior Design',
    'Vastu Shastra Analysis',
    'Renovation Cost Calculator',
    '400+ Design Styles',
    'Real-time Rendering',
    'Before/After Comparison',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className=""
      >
        <head>
          {/* Preconnect to external domains for performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link rel="preconnect" href="https://api.replicate.com" />
          <link rel="preconnect" href="https://api.groq.com" />
          
          {/* DNS prefetch for third-party services */}
          <link rel="dns-prefetch" href="https://client.crisp.chat" />
          <link rel="dns-prefetch" href="https://app.posthog.com" />
          <link rel="dns-prefetch" href="https://uploadthing.com" />
          
          {/* PWA meta tags */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Removation.ai" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="msapplication-TileColor" content="#7c3aed" />
          <meta name="msapplication-tap-highlight" content="no" />
          
          {/* JSON-LD Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body
          className={`
            font-sans antialiased
            bg-white dark:bg-gray-950
            text-gray-900 dark:text-gray-100
            min-h-screen
            selection:bg-violet-500/20 selection:text-violet-900 dark:selection:text-violet-100
          `}
          suppressHydrationWarning
        >
          <Providers>
            {/* Analytics tracking */}
            <AnalyticsProvider />
            
            {/* Main content */}
            <main id="main-content" className="relative">
              {children}
            </main>
            
            {/* Toast notifications */}
            <Toaster />
            
            {/* Crisp Chat widget - bottom right */}
            <CrispChat />
            
            {/* PWA install prompt */}
            <PWAPrompt />
          </Providers>
          
          {/* Skip to content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded-lg focus:outline-none"
          >
            Skip to main content
          </a>
        </body>
      </html>
    </AuthProvider>
  )
}