import type { Metadata, Viewport } from 'next'
import { Outfit, DM_Sans, Inter } from 'next/font/google'
import Script from 'next/script'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/Providers'
import { CrispChat } from '@/components/CrispChat'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import { PWAPrompt } from '@/components/PWAPrompt'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800'],
})
// Complete SEO metadata
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://removation.ai'),
  title: {
    default: 'Removation.ai - AI Interior Design & Renovation Platform',
    template: '%s | Removation.ai',
  },
  description:
    'Transform your home with AI-powered interior design. Generate stunning room redesigns, book verified local designers, and bring your vision to life. 400+ styles, Vastu Shastra analysis & real-time ₹ cost estimates — trusted by Indian homeowners.',
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
    locale: 'en_IN',
    alternateLocale: 'hi_IN',
    url: 'https://removation.ai',
    siteName: 'Removation.ai',
    title: 'Removation.ai — AI Interior Design for Indian Homes',
    description:
      'Generate stunning AI room redesigns, book verified local designers, and bring your vision to life. Vastu analysis & real-time ₹ cost estimates.',
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

// JSON-LD structured data for SEO — @graph bundles multiple schemas
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://removation.ai/#app',
      name: 'Removation.ai',
      applicationCategory: 'DesignApplication',
      operatingSystem: 'Web',
      url: 'https://removation.ai',
      description:
        'AI-powered interior design platform for Indian homeowners. Generate room redesigns, get Vastu Shastra analysis, real-time \u20b9 cost estimates, and book verified local designers.',
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'INR', name: 'Free Plan' },
        { '@type': 'Offer', price: '2399', priceCurrency: 'INR', name: 'Pro Plan' },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '847',
        bestRating: '5',
        worstRating: '1',
      },
      author: { '@id': 'https://removation.ai/#org' },
      featureList: [
        'AI Interior Design',
        'Vastu Shastra Analysis',
        'Renovation Cost Calculator',
        '400+ Design Styles',
        'Designer Marketplace',
        'Style Transfer',
        'Smart Inpainting',
        'Lighting Simulation',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://removation.ai/#website',
      url: 'https://removation.ai',
      name: 'Removation.ai',
      description: 'AI interior design for Indian homes',
      publisher: { '@id': 'https://removation.ai/#org' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://removation.ai/marketplace?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://removation.ai/#org',
      name: 'Removation.ai',
      url: 'https://removation.ai',
      logo: 'https://removation.ai/images/og-image.png',
      sameAs: [
        'https://twitter.com/removationai',
        'https://linkedin.com/company/removation',
        'https://instagram.com/removation.ai',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@removation.ai',
        contactType: 'customer service',
        availableLanguage: ['English', 'Hindi'],
      },
    },
  ],
}

// FAQ schema for landing page rich results
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the AI room redesign work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Upload a photo of your room, choose your preferred style, and our AI generates a fully redesigned version in 30\u201360 seconds. The AI preserves your room\u2019s structure \u2014 walls, windows, doors \u2014 while transforming the look.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are the designers on the platform verified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Every designer goes through a portfolio review and manual admin verification before being listed. We also collect and display verified reviews from completed bookings.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do the AI designs follow Vastu Shastra principles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can enable Vastu mode on any design. Our Vastu engine checks directional placement, energy zones, and furniture alignment against 120+ classical Vastu rules and gives a 0\u2013100 score with specific, actionable suggestions.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my room photo stored permanently?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Photos are uploaded, used to generate your design, and saved to your project dashboard. They\u2019re never shared publicly or used to train AI without your explicit consent. You can delete your photos at any time.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does it cost to book a designer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Designers set their own consultation fees (typically \u20b9500\u2013\u20b92,000) and project minimums. All pricing is shown upfront on their profile. You pay through the platform, which holds the amount until the consultation is confirmed.',
      },
    },
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
        className={`dark ${outfit.variable} ${dmSans.variable} ${inter.variable}`}
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
          
          {/* JSON-LD Structured Data — main schema graph */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          {/* FAQ schema for Google rich results */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        </head>
        <body
          className={`
            font-sans antialiased
            bg-[#0a0a0a]
            text-white
            min-h-screen
            selection:bg-violet-500/30 selection:text-violet-100
          `}
          style={{ fontFamily: "var(--font-inter, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif)" }}
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

          {/* Razorpay checkout SDK — loaded before interactive so window.Razorpay is available */}
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="beforeInteractive"
          />
        </body>
      </html>
    </AuthProvider>
  )
}